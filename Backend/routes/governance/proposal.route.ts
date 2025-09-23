import express from 'express';
import { authWithRefresh } from '../../middleware/authWithRefresh';
import { requireRole } from '../../middleware/roleAuth';
import {
  createProposal,
  getAllProposals,
  getTopProposals,
  getProposalById,
  getUserProposals,
  updateProposalStatus,
  deleteProposal,
  getGovernanceStats
} from '../../controllers/governance/proposal.controller';

const router = express.Router();

// Public routes (no authentication required)
router.get('/stats', getGovernanceStats);
router.get('/top', getTopProposals);
router.get('/all', getAllProposals);
router.get('/:proposalId', getProposalById);

// Protected routes (authentication required)
router.use(authWithRefresh);

// User routes
router.post('/create', createProposal);
router.get('/user/:userId', getUserProposals);

// Admin routes
router.patch('/:proposalId/status', requireRole('admin'), updateProposalStatus);
router.delete('/:proposalId', requireRole('admin'), deleteProposal);

export default router;
