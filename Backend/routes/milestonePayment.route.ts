import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { listMilestonePayments } from '../controllers/milestonePayment.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, listMilestonePayments);

export default router;
