require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ContributorPayoutModel from '../models/contributorPayout.model';
import ApplicationModel from '../models/application.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** GET /contributor-payout – startup: payouts I sent; contributor: payouts I received */
export const listContributorPayouts = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; marketplace_role?: string };
  const userId = user._id;

  if (user.marketplace_role === 'startup') {
    const payouts = await ContributorPayoutModel.find({ startupId: userId })
      .populate('contributorId', 'firstName lastName email')
      .populate('milestoneId', 'title amount')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, payouts });
  }

  if (user.marketplace_role === 'contributor') {
    const payouts = await ContributorPayoutModel.find({ contributorId: userId })
      .populate('startupId', 'startupName firstName lastName email')
      .populate('milestoneId', 'title amount')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, payouts });
  }

  return next(new ErrorHandler('Not authorized to list payouts', 403));
});

/** POST /contributor-payout – startup only: record a salary/payout to a hired contributor */
export const createContributorPayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'startup') return next(new ErrorHandler('Only startups can send payouts to contributors', 403));

  const { contributorId, milestoneId, amount, note } = req.body as {
    contributorId?: string;
    milestoneId?: string;
    amount?: number;
    note?: string;
  };

  if (!contributorId) return next(new ErrorHandler('contributorId is required', 400));
  const numAmount = amount != null ? Number(amount) : 0;
  if (isNaN(numAmount) || numAmount <= 0) return next(new ErrorHandler('Amount must be a positive number', 400));

  const accepted = await ApplicationModel.findOne({
    startupId: user._id,
    contributorId,
    status: 'accepted',
  });
  if (!accepted) return next(new ErrorHandler('Contributor is not hired by your startup', 400));

  const payout = await ContributorPayoutModel.create({
    startupId: user._id,
    contributorId,
    milestoneId: milestoneId || undefined,
    amount: numAmount,
    status: 'paid',
    note: typeof note === 'string' ? note.trim() : '',
    paidAt: new Date(),
  });

  const populated = await ContributorPayoutModel.findById(payout._id)
    .populate('contributorId', 'firstName lastName email')
    .populate('milestoneId', 'title amount')
    .lean();
  res.status(201).json({ success: true, payout: populated });
});
