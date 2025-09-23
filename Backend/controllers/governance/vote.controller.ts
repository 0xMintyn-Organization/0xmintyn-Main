import { Request, Response } from 'express';
import Vote, { IVote } from '../../models/governance/vote.model';
import Proposal from '../../models/governance/proposal.model';
import User from '../../models/user.mode';
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";

// Cast a vote on a proposal
export const castVote = CatchAsyncError(async (req: Request, res: Response) => {
  const { proposalId } = req.params;
  const { vote, reason } = req.body;
  
  console.log('=== VOTE REQUEST DEBUG ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Proposal ID from params:', proposalId);

  // Validate vote choice
  if (!['yes', 'no', 'abstain'].includes(vote)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vote choice. Must be yes, no, or abstain'
    });
  }

  // Check if proposal exists and is active
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (proposal.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Proposal is not active for voting'
    });
  }

  // Check if user is trying to vote on their own proposal
  const userId = req.user?.id || req.user?._id;
  if (proposal.proposerId.toString() === userId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot vote on your own proposal'
    });
  }

  // Check if voting period is still open
  const now = new Date();
  if (now < proposal.startDate || now > proposal.endDate) {
    return res.status(400).json({
      success: false,
      message: 'Voting period is not open'
    });
  }

  // Check if user has already voted
  console.log('=== VOTE CHECK DEBUG ===');
  console.log('Proposal ID:', proposalId);
  console.log('User ID from request:', req.user?.id);
  console.log('User _id from request:', req.user?._id);
  console.log('User ID type:', typeof req.user?.id);
  console.log('User _id type:', typeof req.user?._id);
  
  // Use both id and _id to be safe
  console.log('Final user ID being used:', userId);
  
  const existingVote = await Vote.findOne({
    proposalId,
    voterId: userId
  });
  
  // Also check all votes for this proposal for debugging
  const allVotesForProposal = await Vote.find({ proposalId });
  console.log('All votes for this proposal:', allVotesForProposal.length);
  console.log('All votes details:', allVotesForProposal.map(v => ({ id: v._id, voterId: v.voterId, vote: v.vote })));
  
  console.log('Existing vote found:', existingVote);
  console.log('Existing vote ID:', existingVote?._id);

  if (existingVote) {
    console.log('User has already voted, returning error');
    return res.status(400).json({
      success: false,
      message: 'You have already voted on this proposal. Use the update vote endpoint to change your vote.'
    });
  }
  
  console.log('No existing vote found, proceeding with vote creation');

  // Get user's voting power (for now, we'll use a default value)
  // In a real implementation, this would be based on token holdings
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Calculate voting power (simplified - in reality this would be based on staked tokens)
  const votingPower = user.isEmailVerified ? 1 : 0.5;

  // Create the vote
  const voteData: Partial<IVote> = {
    proposalId,
    voterId: userId,
    voterName: user.username || `${user.firstName} ${user.lastName}`,
    voterWallet: (user as any).walletAddress || 'N/A',
    vote,
    votingPower,
    reason
  };

  console.log('=== VOTE CREATION DEBUG ===');
  console.log('Vote data being created:', voteData);
  console.log('Proposal ID type:', typeof proposalId);
  console.log('Voter ID type:', typeof userId);

  try {
    const newVote = await Vote.create(voteData);
    console.log('Vote created successfully:', newVote._id);

    // Update proposal vote counts
    const voteUpdate: any = {};
    voteUpdate[`votingOptions.${vote}`] = 1;
    voteUpdate.totalVotes = 1;

    await Proposal.findByIdAndUpdate(proposalId, {
      $inc: voteUpdate
    });

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: newVote
    });
  } catch (createError: any) {
    // Handle duplicate key error specifically
    if (createError.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this proposal. Use the update vote endpoint to change your vote.'
      });
    }
    
    // Handle other validation errors
    if (createError.name === 'ValidationError') {
      const errors = Object.values(createError.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Re-throw other errors
    throw createError;
  }
});

// Update a vote (only if voting period is still open)
export const updateVote = CatchAsyncError(async (req: Request, res: Response) => {
  const { proposalId } = req.params;
  const { vote, reason } = req.body;

  // Validate vote choice
  if (!['yes', 'no', 'abstain'].includes(vote)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vote choice. Must be yes, no, or abstain'
    });
  }

  // Check if proposal exists and is active
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (proposal.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Proposal is not active for voting'
    });
  }

  // Check if voting period is still open
  const now = new Date();
  if (now < proposal.startDate || now > proposal.endDate) {
    return res.status(400).json({
      success: false,
      message: 'Voting period is not open'
    });
  }

  // Find existing vote
  const userId = req.user?.id || req.user?._id;
  const existingVote = await Vote.findOne({
    proposalId,
    voterId: userId
  });

  if (!existingVote) {
    return res.status(404).json({
      success: false,
      message: 'No existing vote found'
    });
  }

  // If the vote is the same, just update the reason
  if (existingVote.vote === vote) {
    existingVote.reason = reason;
    await existingVote.save();
    
    return res.status(200).json({
      success: true,
      message: 'Vote reason updated successfully',
      data: existingVote
    });
  }

  // Update vote counts in proposal
  const oldVote = existingVote.vote;
  const newVote = vote;

  await Proposal.findByIdAndUpdate(proposalId, {
    $inc: {
      [`votingOptions.${oldVote}`]: -1,
      [`votingOptions.${newVote}`]: 1
    }
  });

  // Update the vote
  existingVote.vote = newVote;
  existingVote.reason = reason;
  await existingVote.save();

  res.status(200).json({
    success: true,
    message: 'Vote updated successfully',
    data: existingVote
  });
});

// Remove a vote (only if voting period is still open)
export const removeVote = CatchAsyncError(async (req: Request, res: Response) => {
  const { proposalId } = req.params;

  // Check if proposal exists and is active
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (proposal.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Proposal is not active for voting'
    });
  }

  // Check if voting period is still open
  const now = new Date();
  if (now < proposal.startDate || now > proposal.endDate) {
    return res.status(400).json({
      success: false,
      message: 'Voting period is not open'
    });
  }

  // Find and remove existing vote
  const userId = req.user?.id || req.user?._id;
  const existingVote = await Vote.findOneAndDelete({
    proposalId,
    voterId: userId
  });

  if (!existingVote) {
    return res.status(404).json({
      success: false,
      message: 'No existing vote found'
    });
  }

  // Update proposal vote counts
  await Proposal.findByIdAndUpdate(proposalId, {
    $inc: {
      [`votingOptions.${existingVote.vote}`]: -1,
      totalVotes: -1
    }
  });

  res.status(200).json({
    success: true,
    message: 'Vote removed successfully'
  });
});

// Get votes for a proposal
export const getProposalVotes = CatchAsyncError(async (req: Request, res: Response) => {
  const { proposalId } = req.params;
  const { vote, page = 1, limit = 20 } = req.query;

  const query: any = { proposalId };
  if (vote) {
    query.vote = vote;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const votes = await Vote.find(query)
    .populate('voterId', 'username firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Vote.countDocuments(query);

  // Get vote summary
  const voteSummary = await Vote.aggregate([
    { $match: { proposalId: proposalId } },
    { $group: { _id: '$vote', count: { $sum: 1 }, totalPower: { $sum: '$votingPower' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      votes,
      summary: voteSummary,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    }
  });
});

// Get user's voting history
export const getUserVotes = CatchAsyncError(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const votes = await Vote.find({ voterId: userId })
    .populate('proposalId', 'title category status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Vote.countDocuments({ voterId: userId });

  res.status(200).json({
    success: true,
    data: {
      votes,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    }
  });
});

// Get voting statistics
export const getVotingStats = CatchAsyncError(async (req: Request, res: Response) => {
  const { proposalId } = req.params;

  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Get detailed vote statistics
  const voteStats = await Vote.aggregate([
    { $match: { proposalId: proposalId } },
    {
      $group: {
        _id: '$vote',
        count: { $sum: 1 },
        totalPower: { $sum: '$votingPower' },
        avgPower: { $avg: '$votingPower' }
      }
    }
  ]);

  // Get voter participation by date
  const participationByDate = await Vote.aggregate([
    { $match: { proposalId: proposalId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Check if current user has voted
  let userVote = null;
  const userId = req.user?.id || req.user?._id;
  if (userId) {
    console.log('=== VOTING STATS DEBUG ===');
    console.log('Proposal ID:', proposalId);
    console.log('User ID for stats:', userId);
    userVote = await Vote.findOne({ proposalId, voterId: userId });
    console.log('User vote found in stats:', userVote);
  }

  res.status(200).json({
    success: true,
    data: {
      proposal: {
        id: proposal._id,
        title: proposal.title,
        status: proposal.status,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        totalVotes: proposal.totalVotes,
        votingOptions: proposal.votingOptions
      },
      voteStats,
      participationByDate,
      userVote
    }
  });
});
