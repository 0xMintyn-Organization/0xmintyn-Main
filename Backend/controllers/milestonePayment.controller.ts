require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import MilestonePaymentModel from '../models/milestonePayment.model';
import ErrorHandler from '../utils/errorHandler';

/** GET /milestone-payment – admin: all payments; startup: own payments (funding received) */
export const listMilestonePayments = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role: string; marketplace_role?: string };
  const userId = user._id;
  const role = user.role;
  const marketplaceRole = user.marketplace_role;

  if (role === 'admin') {
    const payments = await MilestonePaymentModel.find()
      .sort({ paidAt: -1 })
      .populate('startupId', 'email startupName firstName lastName')
      .populate('milestoneId')
      .lean();
    return res.status(200).json({ success: true, payments });
  }

  if (marketplaceRole === 'startup') {
    const payments = await MilestonePaymentModel.find({ startupId: userId })
      .sort({ paidAt: -1 })
      .lean();
    return res.status(200).json({ success: true, payments });
  }

  return next(new ErrorHandler('Not authorized to list milestone payments', 403));
});
