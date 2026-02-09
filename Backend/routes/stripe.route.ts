import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import {
  createStripeConnectAccount,
  getStripeOnboardingLink,
  getStripeConnectStatus,
  getStripeDashboardLink,
  getStripeBalance,
  createWithdrawal,
  listWithdrawals,
} from '../controllers/stripe.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.post(
  '/connect/create-account',
  updateAccessTokenMiddleware,
  isAuthenticated,
  createStripeConnectAccount
);
router.get(
  '/connect/onboarding-link',
  updateAccessTokenMiddleware,
  isAuthenticated,
  getStripeOnboardingLink
);
router.get(
  '/connect/status',
  updateAccessTokenMiddleware,
  isAuthenticated,
  getStripeConnectStatus
);
router.get(
  '/connect/dashboard-link',
  updateAccessTokenMiddleware,
  isAuthenticated,
  getStripeDashboardLink
);

// Phase 6: Withdraw balance
router.get(
  '/balance',
  updateAccessTokenMiddleware,
  isAuthenticated,
  getStripeBalance
);
router.post(
  '/withdraw',
  updateAccessTokenMiddleware,
  isAuthenticated,
  createWithdrawal
);
router.get(
  '/withdrawals',
  updateAccessTokenMiddleware,
  isAuthenticated,
  listWithdrawals
);

export default router;
