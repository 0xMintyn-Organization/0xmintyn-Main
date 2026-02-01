import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { listContributorPayouts, createContributorPayout } from '../controllers/contributorPayout.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, listContributorPayouts);
router.post('/', updateAccessTokenMiddleware, isAuthenticated, createContributorPayout);

export default router;
