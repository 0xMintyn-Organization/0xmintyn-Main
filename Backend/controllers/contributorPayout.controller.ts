require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ContributorPayoutModel from '../models/contributorPayout.model';
import MilestonePaymentModel from '../models/milestonePayment.model';
import ApplicationModel from '../models/application.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';
import { getAccountStatus } from '../services/stripeConnect.service';
import {
  reverseTransfer,
  createPlatformTransfer,
  getTransferReversibleAmount,
} from '../services/stripePayment.service';

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

/** POST /contributor-payout – startup only: record a salary/payout to a hired contributor.
 * Phase 5: Uses Stripe – reverse transfer from startup, transfer to contributor. */
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

  // Phase 5: Stripe Connect – both must have active Connect accounts
  const startupUser = await UserModel.findById(user._id).select('stripeConnectAccountId').lean();
  const contributorUser = await UserModel.findById(contributorId).select('stripeConnectAccountId').lean();
  const startupConnectId = (startupUser as { stripeConnectAccountId?: string })?.stripeConnectAccountId;
  const contributorConnectId = (contributorUser as { stripeConnectAccountId?: string })?.stripeConnectAccountId;

  if (!startupConnectId?.trim()) {
    return next(new ErrorHandler('Startup must connect bank account first. Complete Stripe Connect onboarding.', 400));
  }
  if (!contributorConnectId?.trim()) {
    return next(new ErrorHandler('Contributor must connect bank account to receive payouts. Ask them to complete Stripe Connect onboarding.', 400));
  }

  const startupStatus = await getAccountStatus(startupConnectId.trim());
  const contributorStatus = await getAccountStatus(contributorConnectId.trim());
  if ('error' in startupStatus) return next(new ErrorHandler('Startup payment account error: ' + startupStatus.error, 400));
  if ('error' in contributorStatus) return next(new ErrorHandler('Contributor payment account error: ' + contributorStatus.error, 400));
  if (!startupStatus.payoutsEnabled) return next(new ErrorHandler('Startup payment account is not yet ready. Complete Stripe verification.', 400));
  if (!contributorStatus.payoutsEnabled) return next(new ErrorHandler('Contributor payment account is not yet ready. Complete Stripe verification.', 400));

  // Find source transfer: milestone-specific or latest MilestonePayment for this startup
  let sourcePayment: { stripeTransferId: string } | null = null;
  if (milestoneId) {
    sourcePayment = await MilestonePaymentModel.findOne({
      milestoneId,
      startupId: user._id,
      stripeTransferId: { $exists: true, $nin: [null, ''] },
    })
      .select('stripeTransferId')
      .lean() as { stripeTransferId: string } | null;
    if (!sourcePayment?.stripeTransferId) {
      return next(new ErrorHandler('Milestone has no Stripe funding yet. Admin must approve the milestone as Paid first.', 400));
    }
  } else {
    const latest = await MilestonePaymentModel.findOne({
      startupId: user._id,
      stripeTransferId: { $exists: true, $nin: [null, ''] },
    })
      .sort({ paidAt: -1 })
      .select('stripeTransferId')
      .lean() as { stripeTransferId?: string } | null;
    if (!latest?.stripeTransferId) {
      return next(new ErrorHandler('Startup has no milestone funding for Stripe payouts. Complete a milestone payment first or link this payout to a milestone.', 400));
    }
    sourcePayment = { stripeTransferId: latest.stripeTransferId };
  }

  const amountCents = Math.round(numAmount * 100);
  const reversible = await getTransferReversibleAmount(sourcePayment.stripeTransferId);
  if ('error' in reversible) return next(new ErrorHandler('Could not verify funding: ' + reversible.error, 400));
  if (reversible.amountCents < amountCents) {
    return next(new ErrorHandler(`Insufficient reversible funding. Available: $${(reversible.amountCents / 100).toFixed(2)}.`, 400));
  }

  // Reverse transfer from startup → platform, then transfer platform → contributor
  const reverseResult = await reverseTransfer(sourcePayment.stripeTransferId, amountCents, {
    contributorId: String(contributorId),
  });
  if ('error' in reverseResult) {
    return next(new ErrorHandler('Transfer reversal failed: ' + reverseResult.error, 400));
  }

  const transferResult = await createPlatformTransfer(amountCents, contributorConnectId.trim(), {
    startupId: String(user._id),
    milestoneId: milestoneId || undefined,
  });
  if ('error' in transferResult) {
    return next(new ErrorHandler('Transfer to contributor failed: ' + transferResult.error + '. Reversal was applied; please contact support.', 400));
  }

  const payout = await ContributorPayoutModel.create({
    startupId: user._id,
    contributorId,
    milestoneId: milestoneId || undefined,
    amount: numAmount,
    status: 'paid',
    note: typeof note === 'string' ? note.trim() : '',
    paidAt: new Date(),
    stripeTransferId: transferResult.transferId,
  });

  const populated = await ContributorPayoutModel.findById(payout._id)
    .populate('contributorId', 'firstName lastName email')
    .populate('milestoneId', 'title amount')
    .lean();
  res.status(201).json({ success: true, payout: populated });
});
