import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import {
  getOwnStartupProfile,
  getStartupProfileById,
  putStartupProfile,
  listApprovedStartupProfiles,
  listAllStartupProfilesForAdmin,
  patchStartupProfileStatus,
  getStartupProfileMilestones,
} from '../controllers/startupProfile.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, getOwnStartupProfile);
router.put('/', updateAccessTokenMiddleware, isAuthenticated, putStartupProfile);
router.get('/list', updateAccessTokenMiddleware, isAuthenticated, listApprovedStartupProfiles);
router.get('/list/admin', updateAccessTokenMiddleware, isAuthenticated, listAllStartupProfilesForAdmin);
router.get('/:id/milestones', updateAccessTokenMiddleware, isAuthenticated, getStartupProfileMilestones);
router.get('/:id', updateAccessTokenMiddleware, isAuthenticated, getStartupProfileById);
router.patch('/:id', updateAccessTokenMiddleware, isAuthenticated, patchStartupProfileStatus);

export default router;
