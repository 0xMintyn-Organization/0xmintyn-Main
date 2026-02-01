import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { getOwnContributorProfile, putContributorProfile, listContributorProfiles, getContributorProfileById } from '../controllers/contributorProfile.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, getOwnContributorProfile);
router.put('/', updateAccessTokenMiddleware, isAuthenticated, putContributorProfile);
router.get('/list', updateAccessTokenMiddleware, isAuthenticated, listContributorProfiles);
router.get('/:id', updateAccessTokenMiddleware, isAuthenticated, getContributorProfileById);

export default router;
