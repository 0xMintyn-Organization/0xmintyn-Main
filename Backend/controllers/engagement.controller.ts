require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import EngagementModel from '../models/engagement.model';
import ApplicationModel from '../models/application.model';
import ContributorPayoutModel from '../models/contributorPayout.model';
import MilestoneModel from '../models/milestone.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** GET /engagement – startup: my engagements (with hired contributors); contributor: my engagements */
export const listEngagements = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; marketplace_role?: string };
  const userId = user._id;

  if (user.marketplace_role === 'startup') {
    const engagements = await EngagementModel.find({ startupId: userId })
      .populate('contributorId', 'firstName lastName email')
      .populate('applicationId')
      .sort({ startDate: -1 })
      .lean();
    return res.status(200).json({ success: true, engagements });
  }

  if (user.marketplace_role === 'contributor') {
    const engagements = await EngagementModel.find({ contributorId: userId })
      .populate('startupId', 'startupName firstName lastName email')
      .sort({ startDate: -1 })
      .lean();
    return res.status(200).json({ success: true, engagements });
  }

  return next(new ErrorHandler('Not authorized to list engagements', 403));
});

/** GET /engagement/:id – get one (startup: own; contributor: own) */
export const getEngagementById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const engagementId = req.params.id;
  const user = req.user as { _id: string; marketplace_role?: string };

  const engagement = await EngagementModel.findById(engagementId)
    .populate('startupId', 'startupName firstName lastName email')
    .populate('contributorId', 'firstName lastName email')
    .lean();
  if (!engagement) return next(new ErrorHandler('Engagement not found', 404));

  const startupIdStr = (engagement.startupId as { _id?: unknown })?._id != null
    ? String((engagement.startupId as { _id: unknown })._id)
    : String(engagement.startupId);
  const contributorIdStr = (engagement.contributorId as { _id?: unknown })?._id != null
    ? String((engagement.contributorId as { _id: unknown })._id)
    : String(engagement.contributorId);

  if (user.marketplace_role === 'startup' && startupIdStr !== String(user._id)) return next(new ErrorHandler('Not authorized', 403));
  if (user.marketplace_role === 'contributor' && contributorIdStr !== String(user._id)) return next(new ErrorHandler('Not authorized', 403));

  return res.status(200).json({ success: true, engagement });
});

/** PUT /engagement – create or update engagement (startup only). Create when accepting; update dates/salary. */
export const putEngagement = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'startup') return next(new ErrorHandler('Only startups can manage engagements', 403));

  const { contributorId, startDate, endDate, agreedSalary, status, note } = req.body as {
    contributorId?: string;
    startDate?: string;
    endDate?: string | null;
    agreedSalary?: number;
    status?: 'active' | 'ended';
    note?: string;
  };

  if (!contributorId) return next(new ErrorHandler('contributorId is required', 400));

  const accepted = await ApplicationModel.findOne({
    startupId: user._id,
    contributorId,
    status: 'accepted',
  });
  if (!accepted) return next(new ErrorHandler('Contributor is not hired by your startup', 400));

  let engagement = await EngagementModel.findOne({ startupId: user._id, contributorId });

  const update: Record<string, unknown> = {};
  if (startDate !== undefined) update.startDate = new Date(startDate);
  if (endDate !== undefined) update.endDate = endDate === null || endDate === '' ? null : new Date(endDate);
  if (agreedSalary !== undefined && typeof agreedSalary === 'number' && !isNaN(agreedSalary) && agreedSalary >= 0) update.agreedSalary = agreedSalary;
  if (status === 'active' || status === 'ended') update.status = status;
  if (note !== undefined) update.note = typeof note === 'string' ? note.trim() : '';

  if (!engagement) {
    engagement = await EngagementModel.create({
      startupId: user._id,
      contributorId,
      applicationId: accepted._id,
      startDate: update.startDate ? (update.startDate as Date) : new Date(),
      endDate: (update.endDate as Date) || null,
      agreedSalary: (update.agreedSalary as number) ?? (accepted.monthlySalary ?? 0),
      status: (update.status as string) || 'active',
      note: (update.note as string) || '',
    });
  } else {
    Object.assign(engagement, update);
    await engagement.save();
  }

  const populated = await EngagementModel.findById(engagement._id)
    .populate('contributorId', 'firstName lastName email')
    .lean();
  return res.status(200).json({ success: true, engagement: populated });
});

/** GET /engagement/analytics – startup or contributor: aggregated stats (total paid, earned, by engagement) */
export const getEngagementAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; marketplace_role?: string };
  const userId = user._id;

  if (user.marketplace_role === 'startup') {
    const payouts = await ContributorPayoutModel.find({ startupId: userId }).lean();
    const totalPaidToContributors = payouts.reduce((s, p) => s + Number(p.amount), 0);
    const byContributor: Record<string, { totalPaid: number; count: number }> = {};
    for (const p of payouts) {
      const cid = String(p.contributorId);
      if (!byContributor[cid]) byContributor[cid] = { totalPaid: 0, count: 0 };
      byContributor[cid].totalPaid += Number(p.amount);
      byContributor[cid].count += 1;
    }
    const engagements = await EngagementModel.find({ startupId: userId }).lean();
    return res.status(200).json({
      success: true,
      analytics: {
        totalPaidToContributors,
        payoutsCount: payouts.length,
        engagementsCount: engagements.length,
        byContributor: Object.entries(byContributor).map(([contributorId, v]) => ({ contributorId, ...v })),
      },
    });
  }

  if (user.marketplace_role === 'contributor') {
    const payouts = await ContributorPayoutModel.find({ contributorId: userId }).lean();
    const milestones = await MilestoneModel.find({ assignedContributorId: userId, status: { $in: ['Completed', 'Submitted', 'Paid'] } }).lean();
    const totalReceived = payouts.reduce((s, p) => s + Number(p.amount), 0);
    const totalEarned = milestones.reduce((s, m) => s + Number(m.amount), 0);
    const pending = totalEarned - totalReceived;
    const byMonth: Record<string, number> = {};
    for (const p of payouts) {
      const d = p.paidAt || p.createdAt;
      if (d) {
        const key = new Date(d).toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + Number(p.amount);
      }
    }
    return res.status(200).json({
      success: true,
      analytics: {
        totalEarned,
        totalReceived,
        pending,
        payoutsCount: payouts.length,
        completedMilestonesCount: milestones.filter((m) => m.status === 'Paid' || m.status === 'Completed').length,
        byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
      },
    });
  }

  return next(new ErrorHandler('Not authorized', 403));
});
