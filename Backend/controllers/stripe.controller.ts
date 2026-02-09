require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import UserModel from '../models/user.mode';
import WithdrawalModel from '../models/withdrawal.model';
import ErrorHandler from '../utils/errorHandler';
import {
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  getAccountStatus,
  type ConnectAccountType,
} from '../services/stripeConnect.service';
import { getConnectBalance, createPayout, getPayoutWithDestination } from '../services/stripePayout.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/** Determine userType from user's role and marketplace_role. */
function getUserConnectType(user: { role?: string; marketplace_role?: string }): ConnectAccountType | null {
  if (user.role === 'instructor') return 'instructor';
  if (user.marketplace_role === 'startup') return 'startup';
  if (user.marketplace_role === 'contributor') return 'contributor';
  return null;
}

/** POST /stripe/connect/create-account – Create Connect account for current user. */
export const createStripeConnectAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  const userType = getUserConnectType(user);
  if (!userType) {
    return next(new ErrorHandler('Only instructors, startups, or contributors can connect a Stripe account', 403));
  }

  if (user.stripeConnectAccountId) {
    return res.status(200).json({
      success: true,
      accountId: user.stripeConnectAccountId,
      message: 'Stripe account already connected',
    });
  }

  const result = await createConnectAccount(user.email, userType);
  if ('error' in result) return next(new ErrorHandler(result.error, 400));

  user.stripeConnectAccountId = result.accountId;
  user.stripeConnectStatus = 'pending';
  await user.save();

  res.status(201).json({
    success: true,
    accountId: result.accountId,
    message: 'Stripe account created. Complete onboarding to receive payments.',
  });
});

/** GET /stripe/connect/onboarding-link – Get URL for user to complete Stripe onboarding. */
export const getStripeOnboardingLink = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  if (!user.stripeConnectAccountId) {
    return next(new ErrorHandler('Create a Stripe account first', 400));
  }

  // returnUrl and refreshUrl – where to send user after onboarding
  const returnPath = '/myprofile'; // or a dedicated stripe-return page
  const refreshPath = '/myprofile';
  const returnUrl = `${FRONTEND_URL}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}?stripe=return`;
  const refreshUrl = `${FRONTEND_URL}${refreshPath.startsWith('/') ? refreshPath : `/${refreshPath}`}?stripe=refresh`;

  const result = await createAccountLink(
    user.stripeConnectAccountId,
    refreshUrl,
    returnUrl
  );

  if ('error' in result) return next(new ErrorHandler(result.error, 400));

  res.status(200).json({ success: true, url: result.url });
});

/** GET /stripe/connect/status – Get Connect account status. */
export const getStripeConnectStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id).select('stripeConnectAccountId stripeConnectStatus');
  if (!user) return next(new ErrorHandler('User not found', 404));

  if (!user.stripeConnectAccountId) {
    return res.status(200).json({
      success: true,
      connected: false,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    });
  }

  const status = await getAccountStatus(user.stripeConnectAccountId);
  if ('error' in status) return next(new ErrorHandler(status.error, 400));

  const active = status.chargesEnabled && status.payoutsEnabled;
  if (active && user.stripeConnectStatus !== 'active') {
    user.stripeConnectStatus = 'active';
    await user.save();
  }

  res.status(200).json({
    success: true,
    connected: true,
    accountId: user.stripeConnectAccountId,
    chargesEnabled: status.chargesEnabled,
    payoutsEnabled: status.payoutsEnabled,
    detailsSubmitted: status.detailsSubmitted,
    status: user.stripeConnectStatus,
  });
});

/** GET /stripe/connect/dashboard-link – Login link to Stripe Express Dashboard (view payouts, bank account). */
export const getStripeDashboardLink = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  const userType = getUserConnectType(user);
  if (!userType) {
    return next(new ErrorHandler('Only instructors, startups, or contributors can access Stripe dashboard', 403));
  }

  if (!user.stripeConnectAccountId) {
    return next(new ErrorHandler('Connect your bank account first', 400));
  }

  const result = await createLoginLink(user.stripeConnectAccountId);
  if ('error' in result) return next(new ErrorHandler(result.error, 400));

  res.status(200).json({ success: true, url: result.url });
});

/** Phase 6: GET /stripe/balance – available/pending for current user's Connect account. */
export const getStripeBalance = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  const userType = getUserConnectType(user);
  if (!userType) {
    return next(new ErrorHandler('Only instructors, startups, or contributors can view Stripe balance', 403));
  }

  if (!user.stripeConnectAccountId) {
    return res.status(200).json({
      success: true,
      available: 0,
      pending: 0,
      currency: 'usd',
      connected: false,
      message: 'Connect your bank account to see balance and withdraw.',
    });
  }

  const balance = await getConnectBalance(user.stripeConnectAccountId);
  if ('error' in balance) return next(new ErrorHandler(balance.error, 400));

  res.status(200).json({
    success: true,
    available: balance.available,
    pending: balance.pending,
    currency: balance.currency,
    connected: true,
  });
});

/** Phase 6: POST /stripe/withdraw – create payout to user's bank. */
export const createWithdrawal = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById((req.user as { _id: string })._id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  const userType = getUserConnectType(user);
  if (!userType) {
    return next(new ErrorHandler('Only instructors, startups, or contributors can withdraw', 403));
  }

  if (!user.stripeConnectAccountId) {
    return next(new ErrorHandler('Connect your bank account first to withdraw', 400));
  }

  const accountStatus = await getAccountStatus(user.stripeConnectAccountId);
  if ('error' in accountStatus) return next(new ErrorHandler(accountStatus.error, 400));
  if (!accountStatus.payoutsEnabled) {
    return next(new ErrorHandler('Your payment account is not yet ready for payouts. Complete Stripe verification.', 400));
  }

  const { amount } = req.body as { amount?: number };
  const numAmount = amount != null ? Number(amount) : 0;
  if (isNaN(numAmount) || numAmount < 1) {
    return next(new ErrorHandler('Amount must be at least $1.00', 400));
  }

  const amountCents = Math.round(numAmount * 100);
  const payoutResult = await createPayout(
    user.stripeConnectAccountId,
    amountCents,
    'usd',
    { userId: String(user._id) }
  );

  if ('error' in payoutResult) return next(new ErrorHandler(payoutResult.error, 400));

  await WithdrawalModel.create({
    userId: user._id,
    amount: numAmount,
    currency: 'usd',
    stripePayoutId: payoutResult.payoutId,
    status: payoutResult.status === 'pending' ? 'pending' : payoutResult.status,
  });

  res.status(201).json({
    success: true,
    message: 'Withdrawal initiated. Funds will arrive in your bank account within 2–3 business days.',
    payoutId: payoutResult.payoutId,
    status: payoutResult.status,
    amount: numAmount,
  });
});

/** Phase 6: GET /stripe/withdrawals – list user's withdrawals with bank account info. */
export const listWithdrawals = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as { _id: string })._id;
  const user = await UserModel.findById(userId).select('stripeConnectAccountId').lean();
  const accountId = (user as { stripeConnectAccountId?: string })?.stripeConnectAccountId;

  const withdrawals = await WithdrawalModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const withdrawalsWithBank = await Promise.all(
    withdrawals.map(async (w) => {
      let bankName: string | undefined;
      let last4: string | undefined;
      let arrivalDate: number | undefined;

      if (accountId && w.stripePayoutId) {
        const payoutInfo = await getPayoutWithDestination(accountId, w.stripePayoutId);
        if (!('error' in payoutInfo)) {
          bankName = payoutInfo.bankName;
          last4 = payoutInfo.last4;
          arrivalDate = payoutInfo.arrivalDate;
        }
      }

      return {
        _id: w._id,
        amount: w.amount,
        currency: w.currency,
        stripePayoutId: w.stripePayoutId,
        status: w.status,
        createdAt: w.createdAt,
        bankName,
        last4,
        arrivalDate,
      };
    })
  );

  res.status(200).json({
    success: true,
    withdrawals: withdrawalsWithBank,
  });
});
