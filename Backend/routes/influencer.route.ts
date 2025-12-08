import express from 'express';
import { getInfluencerAnalytics } from '../controllers/influencer.controller';
import { isAthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { requireInfluencerOrAdmin } from '../middleware/roleAuth';

const influencerRouter = express.Router();

// Get influencer analytics data (protected, influencer or admin only, view only)
influencerRouter.get('/analytics', updateAccessTokenMiddleware, isAthenticated, requireInfluencerOrAdmin, getInfluencerAnalytics);

export default influencerRouter;

