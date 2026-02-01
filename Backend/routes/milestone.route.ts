import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import {
  listMilestones,
  createMilestone,
  getMilestoneById,
  patchMilestone,
} from '../controllers/milestone.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, listMilestones);
router.post('/', updateAccessTokenMiddleware, isAuthenticated, createMilestone);
router.get('/:id', updateAccessTokenMiddleware, isAuthenticated, getMilestoneById);
router.patch('/:id', updateAccessTokenMiddleware, isAuthenticated, patchMilestone);

export default router;
