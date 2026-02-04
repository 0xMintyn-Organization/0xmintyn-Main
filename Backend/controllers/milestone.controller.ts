require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import MilestoneModel, { MILESTONE_STATUSES, MilestoneStatus } from '../models/milestone.model';
import MilestonePaymentModel from '../models/milestonePayment.model';
import EngagementModel from '../models/engagement.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** Flow: Open → In Progress (startup assigns) → Completed (contributor) → Submitted (startup) → Paid | Rejected (admin). */
const VALID_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  Open: ['In Progress'],
  'In Progress': ['Completed'],
  Completed: ['Submitted'],
  Submitted: ['Paid', 'Rejected'],
  Paid: [],
  Rejected: [],
};

function canTransition(
  from: MilestoneStatus,
  to: MilestoneStatus,
  role: string,
  marketplaceRole: string | undefined,
  isStartupOwner: boolean,
  isAssignedContributor: boolean
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) return false;
  if (to === 'In Progress') return isStartupOwner;
  if (to === 'Completed') return marketplaceRole === 'contributor' && isAssignedContributor;
  if (to === 'Submitted') return isStartupOwner;
  if (to === 'Paid' || to === 'Rejected') return role === 'admin';
  return false;
}

/** GET /milestone – startup: own; admin: Submitted + Paid; contributor: assigned to me. */
export const listMilestones = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role: string; marketplace_role?: string };
  const userId = user._id;
  const role = user.role;
  const marketplaceRole = user.marketplace_role;

  if (role === 'admin') {
    const milestones = await MilestoneModel.find({ status: { $in: ['Submitted', 'Paid'] } })
      .sort({ submittedAt: -1, completedAt: -1, createdAt: -1 })
      .populate('startupId', 'email startupName firstName lastName')
      .populate('assignedContributorId', 'email firstName lastName')
      .lean();
    return res.status(200).json({ success: true, milestones });
  }

  if (marketplaceRole === 'startup') {
    const milestones = await MilestoneModel.find({ startupId: userId })
      .populate('assignedContributorId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, milestones });
  }

  if (marketplaceRole === 'contributor') {
    const milestones = await MilestoneModel.find({ assignedContributorId: userId })
      .populate('startupId', 'email startupName firstName lastName')
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
  const populated = await MilestoneModel.findById(milestone._id)
    .populate('startupId', 'email startupName')
    .lean();
  res.status(201).json({ success: true, milestone: populated });
});

/** GET /milestone/:id – startup: own; admin: any; contributor: if assigned to me. */
export const getMilestoneById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const milestoneId = req.params.id;
  const user = req.user as { _id: string; role: string; marketplace_role?: string };

  const milestone = await MilestoneModel.findById(milestoneId)
    .populate('startupId', 'email startupName firstName lastName')
    .populate('assignedContributorId', 'email firstName lastName')
    .lean();
  if (!milestone) return next(new ErrorHandler('Milestone not found', 404));

  const startupIdStr = (milestone.startupId as { _id?: unknown })?._id != null ? String((milestone.startupId as { _id: unknown })._id) : String(milestone.startupId);
  const assignedIdStr = milestone.assignedContributorId
    ? (milestone.assignedContributorId as { _id?: unknown })?._id != null
      ? String((milestone.assignedContributorId as { _id: unknown })._id)
      : String(milestone.assignedContributorId)
    : null;
  const isOwner = startupIdStr === String(user._id);
  const isAdmin = user.role === 'admin';
  const isAssigned = assignedIdStr === String(user._id);

  if (isOwner || isAdmin || (user.marketplace_role === 'contributor' && isAssigned)) {
    return res.status(200).json({ success: true, milestone });
  }
  return next(new ErrorHandler('Not authorized to view this milestone', 403));
});

/** PATCH /milestone/:id – startup: assign + In Progress, Submitted; contributor: Completed; admin: Paid, Rejected. */
export const patchMilestone = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const milestoneId = req.params.id;
  const user = req.user as { _id: string; role: string; marketplace_role?: string };
  const { status, assignedContributorId: assignId } = req.body as { status?: string; assignedContributorId?: string };

  const milestone = await MilestoneModel.findById(milestoneId);
  if (!milestone) return next(new ErrorHandler('Milestone not found', 404));

  const startupIdStr = String(milestone.startupId);
  const isStartupOwner = startupIdStr === String(user._id);
  const isAdmin = user.role === 'admin';
  const assignedIdStr = milestone.assignedContributorId ? String(milestone.assignedContributorId) : null;
  const isAssignedContributor = assignedIdStr === String(user._id);

  // Assign to hired contributor (startup only, when moving to In Progress)
  if (assignId !== undefined && isStartupOwner && milestone.status === 'Open') {
    const engagement = await EngagementModel.findOne({ startupId: milestone.startupId, contributorId: assignId });
    if (!engagement) return next(new ErrorHandler('Contributor must be hired (accepted) to assign milestones', 400));
    milestone.assignedContributorId = assignId as any;
  }

  if (status) {
    if (!MILESTONE_STATUSES.includes(status as MilestoneStatus)) return next(new ErrorHandler('Valid status required', 400));
    if (
      !canTransition(
        milestone.status as MilestoneStatus,
        status as MilestoneStatus,
        user.role,
        user.marketplace_role,
        isStartupOwner,
        isAssignedContributor
      )
    ) {
      return next(new ErrorHandler(`Cannot transition from ${milestone.status} to ${status}`, 400));
    }
    milestone.status = status as MilestoneStatus;
    if (status === 'Completed') milestone.completedAt = new Date();
    if (status === 'Submitted') milestone.submittedAt = new Date();
    if (status === 'Paid') milestone.paidAt = new Date();
    if (status === 'Rejected') milestone.rejectedAt = new Date();
  }

  await milestone.save();

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
