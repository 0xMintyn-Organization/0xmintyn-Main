import express from 'express';
import { authWithRefresh } from '../../middleware/authWithRefresh';
import {
  castVote,
  updateVote,
  removeVote,
  getProposalVotes,
  getUserVotes,
  getVotingStats
} from '../../controllers/governance/vote.controller';

const router = express.Router();

// All vote routes require authentication
router.use(authWithRefresh);

// Vote operations
router.post('/:proposalId', castVote);
router.put('/:proposalId', updateVote);
router.delete('/:proposalId', removeVote);

// Vote data retrieval
router.get('/:proposalId/stats', getVotingStats);
router.get('/:proposalId/votes', getProposalVotes);
router.get('/user/:userId', getUserVotes);

export default router;
