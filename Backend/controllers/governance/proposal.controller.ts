import { Request, Response } from 'express';
import Proposal, { IProposal } from '../../models/governance/proposal.model';
import Vote from '../../models/governance/vote.model';
import User from '../../models/user.mode';
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";

// Create a new proposal
export const createProposal = CatchAsyncError(async (req: Request, res: Response) => {
  console.log('=== PROPOSAL CREATION REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user?.id);
  console.log('User object:', req.user);
  
  const {
    title,
    category,
    summary,
    detailedDescription,
    expectedImpact,
    implementationPlan,
    timeline,
    resourcesNeeded,
    attachments = [],
    startDate,
    endDate,
    proposalFee = 0.1
  } = req.body;

  // Validate required fields
  const requiredFields = {
    title,
    category,
    summary,
    detailedDescription,
    expectedImpact,
    implementationPlan,
    resourcesNeeded,
    startDate,
    endDate
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.log("Missing fields:", missingFields.join(", "));
    return res.status(400).json({
      success: false,
      message: `All required fields must be provided. Missing: ${missingFields.join(", ")}`
    });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start <= now) {
    return res.status(400).json({
      success: false,
      message: 'Voting start date must be in the future'
    });
  }

  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'Voting end date must be after start date'
    });
  }

  console.log('User ID from request:', req.user?.id);
  console.log('User ID type:', typeof req.user?.id);

  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    console.log('No user ID found in request');
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found in database for ID:', userId);
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  console.log('User found:', user.username, user.email);

  const proposalData: Partial<IProposal> = {
    title,
    category,
    proposerName: user.username || `${user.firstName} ${user.lastName}`,
    proposerWallet: (user as any).walletAddress || 'N/A',
    proposerId: userId,
    summary,
    detailedDescription,
    expectedImpact,
    implementationPlan,
    timeline: {
      startDate: start,
      endDate: end,
      milestones: req.body.milestones || []
    },
    resourcesNeeded,
    attachments: attachments && attachments.length > 0 ? attachments : [],
    votingOptions: {
      yes: 0,
      no: 0,
      abstain: 0
    },
    totalVotes: 0,
    startDate: start,
    endDate: end,
    proposalFee: proposalFee || 0.1,
    isPaid: (proposalFee || 0.1) === 0,
    status: 'Active', // Directly active - no admin approval needed for now
    requiredVotes: 100, // Default required votes
    quorum: 65 // Default quorum percentage
  };

  console.log('Creating proposal with data:', proposalData);
  
  try {
    const proposal = await Proposal.create(proposalData);
    console.log('Proposal created successfully:', proposal._id);

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully and is now active for voting!',
      data: proposal
    });
  } catch (createError: any) {
    console.error('Error creating proposal in database:', createError);
    console.error('Validation errors:', createError.errors);

    return res.status(400).json({
      success: false,
      message: 'Failed to create proposal',
      error: createError.message,
      validationErrors: createError.errors
    });
  }
});

// Get all proposals with filtering and pagination
export const getAllProposals = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const {
      status = 'Active',
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { proposerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const proposals = await Proposal.find(query)
      .populate('proposerId', 'username firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Proposal.countDocuments(query);

    // Get statistics
    const stats = await Proposal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        },
        stats: {
          totalProposals: total,
          activeProposals: statusStats.Active || 0,
          passedProposals: statusStats.Passed || 0,
          rejectedProposals: statusStats.Rejected || 0,
          ...statusStats
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals',
      error: error.message
    });
  }
});

// Get top proposals (most votes)
export const getTopProposals = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit as string);

    const topProposals = await Proposal.find({ status: 'Active' })
      .populate('proposerId', 'username firstName lastName email')
      .sort({ totalVotes: -1, createdAt: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: topProposals
    });
  } catch (error: any) {
    console.error('Error fetching top proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top proposals',
      error: error.message
    });
  }
});

// Get single proposal by ID
export const getProposalById = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId)
      .populate('proposerId', 'username firstName lastName email avatar');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Get votes for this proposal
    const votes = await Vote.find({ proposalId })
      .populate('voterId', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        proposal,
        votes,
        voteCount: votes.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposal',
      error: error.message
    });
  }
});

// Get user's proposals
export const getUserProposals = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const proposals = await Proposal.find({ proposerId: userId })
      .populate('proposerId', 'username firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Proposal.countDocuments({ proposerId: userId });

    res.status(200).json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching user proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user proposals',
      error: error.message
    });
  }
});

// Update proposal status (Admin only)
export const updateProposalStatus = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { status, adminNotes } = req.body;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.status = status;
    if (adminNotes) {
      proposal.adminNotes = adminNotes;
    }

    await proposal.save();

    res.status(200).json({
      success: true,
      message: 'Proposal status updated successfully',
      data: proposal
    });
  } catch (error: any) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal status',
      error: error.message
    });
  }
});

// Delete proposal (Admin only)
export const deleteProposal = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Delete all votes for this proposal
    await Vote.deleteMany({ proposalId });

    // Delete the proposal
    await Proposal.findByIdAndDelete(proposalId);

    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal',
      error: error.message
    });
  }
});

// Get governance statistics
export const getGovernanceStats = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const stats = await Proposal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Proposal.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVotes = await Vote.countDocuments();
    const totalProposals = await Proposal.countDocuments();

    const statusStats = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const categoryStatsObj = categoryStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalProposals,
        totalVotes,
        statusStats,
        categoryStats: categoryStatsObj,
        activeProposals: statusStats.Active || 0,
        passedProposals: statusStats.Passed || 0,
        rejectedProposals: statusStats.Rejected || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching governance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch governance statistics',
      error: error.message
    });
  }
});
