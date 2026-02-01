require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import MilestoneModel, { MILESTONE_STATUSES, MilestoneStatus } from '../models/milestone.model';
import MilestonePaymentModel from '../models/milestonePayment.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** Startup: Open → In Progress → Completed. Admin: Completed → Paid (fund release). */
const VALID_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  Open: ['In Progress'],
  'In Progress': ['Completed'],
  Completed: ['Paid'],
  Paid: [],
};

function canTransition(
  from: MilestoneStatus,
  to: MilestoneStatus,
  role: string,
  isStartupOwner: boolean
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) return false;
  if (to === 'In Progress' || to === 'Completed') return isStartupOwner;
  if (to === 'Paid') return role === 'admin';
  return false;
}

/** GET /milestone – startup: own milestones; admin: only Completed (and Paid) for management. Contributor sees nothing. */
export const listMilestones = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role: string; marketplace_role?: string };
  const userId = user._id;
  const role = user.role;
  const marketplaceRole = user.marketplace_role;

  if (role === 'admin') {
    const milestones = await MilestoneModel.find({ status: { $in: ['Completed', 'Paid'] } })
      .sort({ completedAt: -1, createdAt: -1 })
      .populate('startupId', 'email startupName firstName lastName')
      .lean();
    return res.status(200).json({ success: true, milestones });
  }

  if (marketplaceRole === 'startup') {
    const milestones = await MilestoneModel.find({ startupId: userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, milestones });
  }

  return next(new ErrorHandler('Not authorized to list milestones', 403));
});

/** POST /milestone – create (startup only) */
export const createMilestone = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'startup') return next(new ErrorHandler('Only startups can create milestones', 403));

  const { title, description, amount } = req.body as { title?: string; description?: string; amount?: number };
  if (!title || typeof title !== 'string' || !title.trim()) return next(new ErrorHandler('Title is required', 400));
  const numAmount = amount != null ? Number(amount) : 0;
  if (isNaN(numAmount) || numAmount < 0) return next(new ErrorHandler('Amount must be a non-negative number', 400));

  const milestone = await MilestoneModel.create({
    startupId: user._id,
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    amount: numAmount,
    status: 'Open',
  });
  const populated = await MilestoneModel.findById(milestone._id).populate('startupId', 'email startupName').lean();
  res.status(201).json({ success: true, milestone: populated });
});

/** GET /milestone/:id – startup: own; admin: any (for management) */
export const getMilestoneById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const milestoneId = req.params.id;
  const user = req.user as { _id: string; role: string; marketplace_role?: string };

  const milestone = await MilestoneModel.findById(milestoneId)
    .populate('startupId', 'email startupName firstName lastName')
    .populate('assignedContributorId', 'email firstName lastName')
    .lean();
  if (!milestone) return next(new ErrorHandler('Milestone not found', 404));

  const startupIdStr = (milestone.startupId as { _id?: unknown })?._id != null ? String((milestone.startupId as { _id: unknown })._id) : String(milestone.startupId);
  const isOwner = startupIdStr === String(user._id);
  const isAdmin = user.role === 'admin';

  if (isOwner || isAdmin) return res.status(200).json({ success: true, milestone });
  return next(new ErrorHandler('Not authorized to view this milestone', 403));
});

/** PATCH /milestone/:id – startup: Open→In Progress, In Progress→Completed; admin: Completed→Paid */
export const patchMilestone = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const milestoneId = req.params.id;
  const user = req.user as { _id: string; role: string; marketplace_role?: string };
  const { status } = req.body as { status?: string };

  if (!status || !MILESTONE_STATUSES.includes(status as MilestoneStatus)) return next(new ErrorHandler('Valid status required', 400));

  const milestone = await MilestoneModel.findById(milestoneId);
  if (!milestone) return next(new ErrorHandler('Milestone not found', 404));

  const startupIdStr = String(milestone.startupId);
  const isStartupOwner = startupIdStr === String(user._id);
  const isAdmin = user.role === 'admin';

  if (!canTransition(milestone.status as MilestoneStatus, status as MilestoneStatus, user.role, isStartupOwner)) {
    return next(new ErrorHandler(`Cannot transition from ${milestone.status} to ${status}`, 400));
  }

  milestone.status = status as MilestoneStatus;
  if (status === 'Completed') milestone.completedAt = new Date();
  if (status === 'Paid') milestone.paidAt = new Date();
  await milestone.save();

  // Create payment history when admin marks Paid (like course order)
  if (status === 'Paid' && isAdmin) {
    const existingPayment = await MilestonePaymentModel.findOne({ milestoneId: milestone._id });
    if (!existingPayment) {
      const startupUser = await UserModel.findById(milestone.startupId).select('startupName').lean();
      const startupName = (startupUser as { startupName?: string })?.startupName || '';
      await MilestonePaymentModel.create({
        milestoneId: milestone._id,
        startupId: milestone.startupId,
        amount: milestone.amount,
        milestoneTitle: milestone.title,
        startupName,
        status: 'paid',
        payment_info: {
          paymentMethod: 'manual',
          paymentStatus: 'completed',
          amount: milestone.amount,
          currency: 'USD',
        },
        paidAt: milestone.paidAt || new Date(),
      });
    }
  }

  const populated = await MilestoneModel.findById(milestone._id)
    .populate('startupId', 'email startupName firstName lastName')
    .populate('assignedContributorId', 'email firstName lastName')
    .lean();
  res.status(200).json({ success: true, milestone: populated });
});
