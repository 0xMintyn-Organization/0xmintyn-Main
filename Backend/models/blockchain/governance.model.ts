import mongoose, { Document, Schema } from 'mongoose';

// Governance Config Schema
export interface GovernanceConfigDocument extends Document {
  programAddress: string;
  admin: string;
  votingToken: string;
  proposalThreshold: string;
  votingPeriod: string; // in seconds
  quorum: string;
  totalProposals: number;
  treasury: string;
  lastSyncedAt: Date;
}

const GovernanceConfigSchema = new Schema<GovernanceConfigDocument>({
  programAddress: { type: String, required: true, unique: true },
  admin: { type: String, required: true, index: true },
  votingToken: { type: String, required: true, index: true },
  proposalThreshold: { type: String, required: true },
  votingPeriod: { type: String, required: true },
  quorum: { type: String, required: true },
  totalProposals: { type: Number, default: 0 },
  treasury: { type: String, required: true, index: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'governance_configs'
});

// Proposal Schema
export interface ProposalDocument extends Document {
  programAddress: string;
  proposalId: number;
  proposer: string;
  title: string;
  description: string;
  actionType: number; // 0: TextProposal, 1: TreasurySpend, 2: ConfigChange
  amount: string;
  recipient: string;
  yesVotes: string;
  noVotes: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  isExecuted: boolean;
  executedAt?: Date;
  executedBy?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  createdAt: Date;
  // Additional tracking
  voteHistory: Array<{
    voter: string;
    vote: boolean;
    votingPower: string;
    timestamp: Date;
    txHash: string;
  }>;
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  participation: number; // percentage of total voting power that participated
  lastSyncedAt: Date;
}

const ProposalSchema = new Schema<ProposalDocument>({
  programAddress: { type: String, required: true, index: true },
  proposalId: { type: Number, required: true, index: true },
  proposer: { type: String, required: true, index: true },
  title: { type: String, required: true, index: 'text' },
  description: { type: String, required: true, index: 'text' },
  actionType: { type: Number, required: true, index: true },
  amount: { type: String, default: '0' },
  recipient: { type: String, default: '' },
  yesVotes: { type: String, default: '0' },
  noVotes: { type: String, default: '0' },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  isExecuted: { type: Boolean, default: false, index: true },
  executedAt: { type: Date, sparse: true },
  executedBy: { type: String, sparse: true },
  cancelledAt: { type: Date, sparse: true },
  cancelledBy: { type: String, sparse: true },
  voteHistory: [{
    voter: { type: String, required: true },
    vote: { type: Boolean, required: true },
    votingPower: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    txHash: { type: String, required: true, index: true }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'active', 'passed', 'failed', 'executed', 'cancelled'],
    default: 'pending',
    index: true 
  },
  participation: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'proposals'
});

// Vote Schema
export interface VoteDocument extends Document {
  programAddress: string;
  proposal: string;
  voter: string;
  vote: boolean; // true for yes, false for no
  votingPower: string;
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  // Additional data
  proposalTitle: string;
  proposalType: number;
}

const VoteSchema = new Schema<VoteDocument>({
  programAddress: { type: String, required: true, index: true },
  proposal: { type: String, required: true, index: true },
  voter: { type: String, required: true, index: true },
  vote: { type: Boolean, required: true, index: true },
  votingPower: { type: String, required: true },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  proposalTitle: { type: String, required: true },
  proposalType: { type: Number, required: true }
}, {
  timestamps: true,
  collection: 'votes'
});

// Governance Events Schema
export interface GovernanceEventDocument extends Document {
  programAddress: string;
  eventType: 'ProposalCreated' | 'VoteCast' | 'ProposalExecuted' | 'ProposalCancelled' | 'ConfigUpdated' | 'GovernanceInitialized';
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  proposer?: string;
  voter?: string;
  proposal?: string;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

const GovernanceEventSchema = new Schema<GovernanceEventDocument>({
  programAddress: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['ProposalCreated', 'VoteCast', 'ProposalExecuted', 'ProposalCancelled', 'ConfigUpdated', 'GovernanceInitialized'],
    index: true 
  },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  proposer: { type: String, sparse: true, index: true },
  voter: { type: String, sparse: true, index: true },
  proposal: { type: String, sparse: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date, sparse: true },
  error: { type: String, sparse: true }
}, {
  timestamps: true,
  collection: 'governance_events'
});

// Voter Profile Schema
export interface VoterProfileDocument extends Document {
  voter: string;
  totalVotes: number;
  totalVotingPower: string;
  participationRate: number; // percentage of proposals they've voted on
  averageVotingPower: string;
  firstVoteDate: Date;
  lastVoteDate: Date;
  voteDistribution: {
    yes: number;
    no: number;
  };
  // Voting patterns
  votingHistory: Array<{
    proposal: string;
    vote: boolean;
    votingPower: string;
    timestamp: Date;
  }>;
  lastSyncedAt: Date;
}

const VoterProfileSchema = new Schema<VoterProfileDocument>({
  voter: { type: String, required: true, unique: true, index: true },
  totalVotes: { type: Number, default: 0 },
  totalVotingPower: { type: String, default: '0' },
  participationRate: { type: Number, default: 0 },
  averageVotingPower: { type: String, default: '0' },
  firstVoteDate: { type: Date, sparse: true },
  lastVoteDate: { type: Date, sparse: true },
  voteDistribution: {
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 }
  },
  votingHistory: [{
    proposal: { type: String, required: true },
    vote: { type: Boolean, required: true },
    votingPower: { type: String, required: true },
    timestamp: { type: Date, required: true }
  }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'voter_profiles'
});

// Indexes
GovernanceConfigSchema.index({ admin: 1, votingToken: 1 });

ProposalSchema.index({ programAddress: 1, proposalId: 1 }, { unique: true });
ProposalSchema.index({ proposer: 1, status: 1 });
ProposalSchema.index({ status: 1, endTime: 1 });
ProposalSchema.index({ actionType: 1, status: 1 });
ProposalSchema.index({ '$**': 'text' }); // Full text search

VoteSchema.index({ voter: 1, proposal: 1 }, { unique: true });
VoteSchema.index({ proposal: 1, vote: 1 });
VoteSchema.index({ voter: 1, blockTime: -1 });

GovernanceEventSchema.index({ eventType: 1, blockTime: -1 });
GovernanceEventSchema.index({ proposer: 1, eventType: 1 });
GovernanceEventSchema.index({ processed: 1, blockTime: 1 });

VoterProfileSchema.index({ participationRate: -1 });
VoterProfileSchema.index({ totalVotes: -1 });

// Create models
export const GovernanceConfig = mongoose.model<GovernanceConfigDocument>('GovernanceConfig', GovernanceConfigSchema);
export const Proposal = mongoose.model<ProposalDocument>('Proposal', ProposalSchema);
export const Vote = mongoose.model<VoteDocument>('Vote', VoteSchema);
export const GovernanceEvent = mongoose.model<GovernanceEventDocument>('GovernanceEvent', GovernanceEventSchema);
export const VoterProfile = mongoose.model<VoterProfileDocument>('VoterProfile', VoterProfileSchema);

// Utility functions
export class GovernanceModelUtils {
  static async updateProposalStatus(proposalId: string) {
    const proposal = await Proposal.findOne({ programAddress: proposalId });
    if (!proposal) return null;
    
    const now = new Date();
    let status: string = proposal.status;
    
    if (proposal.cancelledAt) {
      status = 'cancelled';
    } else if (proposal.isExecuted) {
      status = 'executed';
    } else if (!proposal.isActive) {
      status = 'cancelled';
    } else if (now < proposal.startTime) {
      status = 'pending';
    } else if (now >= proposal.startTime && now <= proposal.endTime) {
      status = 'active';
    } else {
      // Voting ended, determine if passed or failed
      const config = await GovernanceConfig.findOne({ programAddress: proposal.programAddress });
      if (!config) return null;
      
      const yesVotes = BigInt(proposal.yesVotes);
      const noVotes = BigInt(proposal.noVotes);
      const quorum = BigInt(config.quorum);
      
      if (yesVotes > noVotes && yesVotes >= quorum) {
        status = 'passed';
      } else {
        status = 'failed';
      }
    }
    
    if (status !== proposal.status) {
      await Proposal.updateOne(
        { _id: proposal._id },
        { status, lastSyncedAt: now }
      );
    }
    
    return status;
  }

  static async getVotingStats(proposalId: string) {
    const proposal = await Proposal.findOne({ programAddress: proposalId });
    if (!proposal) return null;
    
    const yesVotes = BigInt(proposal.yesVotes);
    const noVotes = BigInt(proposal.noVotes);
    const totalVotes = yesVotes + noVotes;
    
    const config = await GovernanceConfig.findOne({ programAddress: proposal.programAddress });
    const quorum = config ? BigInt(config.quorum) : 0n;
    
    return {
      yesVotes: proposal.yesVotes,
      noVotes: proposal.noVotes,
      totalVotes: totalVotes.toString(),
      yesPercentage: totalVotes > 0n ? Number((yesVotes * 100n) / totalVotes) : 0,
      noPercentage: totalVotes > 0n ? Number((noVotes * 100n) / totalVotes) : 0,
      quorumMet: totalVotes >= quorum,
      quorum: quorum.toString(),
      quorumPercentage: quorum > 0n ? Number((totalVotes * 100n) / quorum) : 0
    };
  }

  static async updateVoterProfile(voter: string) {
    const votes = await Vote.find({ voter }).sort({ blockTime: 1 });
    
    if (votes.length === 0) return null;
    
    const totalVotes = votes.length;
    const totalVotingPower = votes.reduce((sum, vote) => sum + BigInt(vote.votingPower), 0n);
    const averageVotingPower = totalVotingPower / BigInt(totalVotes);
    
    const yesVotes = votes.filter(v => v.vote).length;
    const noVotes = votes.filter(v => !v.vote).length;
    
    const firstVoteDate = votes[0].blockTime;
    const lastVoteDate = votes[votes.length - 1].blockTime;
    
    // Calculate participation rate
    const totalProposals = await Proposal.countDocuments({
      endTime: { $lte: new Date() },
      status: { $in: ['passed', 'failed', 'executed'] }
    });
    
    const participationRate = totalProposals > 0 ? (totalVotes / totalProposals) * 100 : 0;
    
    const votingHistory = votes.map(vote => ({
      proposal: vote.proposal,
      vote: vote.vote,
      votingPower: vote.votingPower,
      timestamp: vote.blockTime
    }));
    
    await VoterProfile.findOneAndUpdate(
      { voter },
      {
        totalVotes,
        totalVotingPower: totalVotingPower.toString(),
        participationRate,
        averageVotingPower: averageVotingPower.toString(),
        firstVoteDate,
        lastVoteDate,
        voteDistribution: { yes: yesVotes, no: noVotes },
        votingHistory,
        lastSyncedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    return await VoterProfile.findOne({ voter });
  }

  static async getGovernanceStats(timeframe: 'day' | 'week' | 'month' = 'month') {
    const now = new Date();
    const timeframeMap = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    const startTime = new Date(now.getTime() - timeframeMap[timeframe]);
    
    const totalProposals = await Proposal.countDocuments({});
    const recentProposals = await Proposal.countDocuments({ createdAt: { $gte: startTime } });
    const activeProposals = await Proposal.countDocuments({ status: 'active' });
    const passedProposals = await Proposal.countDocuments({ status: 'passed' });
    const executedProposals = await Proposal.countDocuments({ status: 'executed' });
    
    const totalVotes = await Vote.countDocuments({});
    const recentVotes = await Vote.countDocuments({ blockTime: { $gte: startTime } });
    
    const uniqueVoters = await Vote.distinct('voter').then(voters => voters.length);
    const recentVoters = await Vote.distinct('voter', { blockTime: { $gte: startTime } }).then(voters => voters.length);
    
    // Proposal type distribution
    const proposalTypes = await Proposal.aggregate([
      { $group: { _id: '$actionType', count: { $sum: 1 } } }
    ]);
    
    // Top voters by participation
    const topVoters = await VoterProfile.find({})
      .sort({ participationRate: -1, totalVotes: -1 })
      .limit(10);
    
    return {
      timeframe,
      totalProposals,
      recentProposals,
      activeProposals,
      passedProposals,
      executedProposals,
      totalVotes,
      recentVotes,
      uniqueVoters,
      recentVoters,
      proposalTypes,
      topVoters
    };
  }

  static async getProposalsByStatus(status?: string, limit: number = 20, skip: number = 0) {
    const query = status ? { status } : {};
    
    const proposals = await Proposal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Proposal.countDocuments(query);
    
    return {
      proposals,
      total,
      hasMore: skip + limit < total
    };
  }

  static async searchProposals(
    query: string,
    filters: {
      status?: string;
      actionType?: number;
      proposer?: string;
    } = {},
    limit: number = 20,
    skip: number = 0
  ) {
    const matchConditions: any = {};
    
    // Text search
    if (query) {
      matchConditions.$text = { $search: query };
    }
    
    // Apply filters
    if (filters.status) {
      matchConditions.status = filters.status;
    }
    
    if (filters.actionType !== undefined) {
      matchConditions.actionType = filters.actionType;
    }
    
    if (filters.proposer) {
      matchConditions.proposer = filters.proposer;
    }
    
    const proposals = await Proposal.find(matchConditions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Proposal.countDocuments(matchConditions);
    
    return {
      proposals,
      total,
      hasMore: skip + limit < total
    };
  }
}













