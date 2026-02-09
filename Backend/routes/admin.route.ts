import express from 'express';
import { getAdminUsers, getAdminOrders, getFailedWithdrawals, getStripeOverview } from '../controllers/admin.controller';
import { isAthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { requireAdmin } from '../middleware/roleAuth';

const adminRouter = express.Router();

// Get admin users data (protected, admin only)
adminRouter.get('/users', updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAdminUsers);

// Get admin orders data (protected, admin only)
adminRouter.get('/orders', updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAdminOrders);

// Phase 7: Failed withdrawals for admin review
adminRouter.get('/failed-withdrawals', updateAccessTokenMiddleware, isAthenticated, requireAdmin, getFailedWithdrawals);

// Phase 8: Stripe overview (balance, transfers, failed withdrawals)
adminRouter.get('/stripe-overview', updateAccessTokenMiddleware, isAthenticated, requireAdmin, getStripeOverview);

export default adminRouter;
