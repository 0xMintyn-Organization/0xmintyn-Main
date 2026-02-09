import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import {
  listMilestones,
  createMilestone,
  getMilestoneById,
  patchMilestone,
  getSolanaMilestoneState,
  initSolanaMilestone,
} from '../controllers/milestone.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, listMilestones);
router.post('/', updateAccessTokenMiddleware, isAuthenticated, createMilestone);
// Solana routes (before :id to avoid "solana" being parsed as id)
router.get('/solana/state', updateAccessTokenMiddleware, isAuthenticated, getSolanaMilestoneState);
router.post('/solana/init', updateAccessTokenMiddleware, isAuthenticated, initSolanaMilestone);
router.get('/:id', updateAccessTokenMiddleware, isAuthenticated, getMilestoneById);
router.patch('/:id', updateAccessTokenMiddleware, isAuthenticated, patchMilestone);

export default router;
