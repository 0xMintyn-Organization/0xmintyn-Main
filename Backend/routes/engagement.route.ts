import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { listEngagements, getEngagementById, putEngagement, getEngagementAnalytics } from '../controllers/engagement.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/analytics', updateAccessTokenMiddleware, isAuthenticated, getEngagementAnalytics);
router.get('/', updateAccessTokenMiddleware, isAuthenticated, listEngagements);
router.get('/:id', updateAccessTokenMiddleware, isAuthenticated, getEngagementById);
router.put('/', updateAccessTokenMiddleware, isAuthenticated, putEngagement);

export default router;
