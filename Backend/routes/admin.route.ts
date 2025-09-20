import express from 'express';
import { getAdminUsers, getAdminOrders } from '../controllers/admin.controller';
import { isAthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { requireAdmin } from '../middleware/roleAuth';

const adminRouter = express.Router();

// Get admin users data (protected, admin only)
adminRouter.get('/users', updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAdminUsers);

// Get admin orders data (protected, admin only)
adminRouter.get('/orders', updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAdminOrders);

export default adminRouter;
