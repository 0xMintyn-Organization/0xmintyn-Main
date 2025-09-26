import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../../utils/logger';

// Governance Configuration Schema
export interface IGovernanceConfig extends Document {
  admin: string;
  tokenMint: string;
  minProposalTokens: string;
  votingPeriod: number; // in seconds
  executionDelay: number; // in seconds
  quorumThreshold: number; // percentage
  supermajorityThreshold: number; // percentage
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  onChainSlot: number;
  lastSyncAt: Date;
}

const GovernanceConfigSchema = new Schema<IGovernanceConfig>({
  admin: { type: String, required: true },
  tokenMint: { type: String, required: true },
  minProposalTokens: { type: String, required: true },
  votingPeriod: { type: Number, required: true },
  executionDelay: { type: Number, required: true },
  quorumThreshold: { type: Number, required: true },
  supermajorityThreshold: { type: Number, required: true },
  isActive: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  onChainSlot: { type: Number, required: true },
  lastSyncAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'governance_configs'
});

// Proposal Schema
export interface IProposal extends Document {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: Date;
  startTime: Date;
  endTime: Date;
  status: 'draft' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
  proposalType: 'parameter_change' | 'technical_upgrade' | 'security_update' | 'treasury' | 'governance' | 'other';
  category: string;
  votesFor: string;
  votesAgainst: string;
  totalVotes: string;
  quorumRequired: string;
  isExecuted: boolean;
  executionData?: string;
  implementationDetails?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  onChainSlot: number;
  lastSyncAt: Date;
}

const ProposalSchema = new Schema<IProposal>({
  proposalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  proposer: { type: String, required: true },
  createdAt: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'succeeded', 'defeated', 'executed', 'cancelled'], 
    required: true 
  },
  proposalType: { 
    type: String, 
    enum: ['parameter_change', 'technical_upgrade', 'security_update', 'treasury', 'governance', 'other'], 
    required: true 
  },
  category: { type: String, required: true },
  votesFor: { type: String, required: true, default: '0' },
  votesAgainst: { type: String, required: true, default: '0' },
  totalVotes: { type: String, required: true, default: '0' },
  quorumRequired: { type: String, required: true },
  isExecuted: { type: Boolean, required: true, default: false },
  executionData: { type: String },
  implementationDetails: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  onChainSlot: { type: Number, required: true },
  lastSyncAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'proposals'
});

// Vote Schema
export interface IVote extends Document {
  voter: string;
  proposal: string;
  voteType: 'for' | 'against' | 'abstain';
  votingPower: string;
  timestamp: Date;
  transactionHash: string;
  blockTime: number;
  slot: number;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>({
  voter: { type: String, required: true },
  proposal: { type: String, required: true },
  voteType: { type: String, enum: ['for', 'against', 'abstain'], required: true },
  votingPower: { type: String, required: true },
  timestamp: { type: Date, required: true },
  transactionHash: { type: String, required: true, unique: true },
  blockTime: { type: Number, required: true },
  slot: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'votes'
});

// Delegation Schema
export interface IDelegation extends Document {
  delegator: string;
  delegate: string;
  votingPower: string;
  createdAt: Date;
  isActive: boolean;
  transactionHash: string;
  blockTime: number;
  slot: number;
  createdAt: Date;
  updatedAt: Date;
}

const DelegationSchema = new Schema<IDelegation>({
  delegator: { type: String, required: true },
  delegate: { type: String, required: true },
  votingPower: { type: String, required: true },
  createdAt: { type: Date, required: true },
  isActive: { type: Boolean, required: true, default: true },
  transactionHash: { type: String, required: true, unique: true },
  blockTime: { type: Number, required: true },
  slot: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'delegations'
});

// Proposal Execution Schema
export interface IProposalExecution extends Document {
  proposal: string;
  executor: string;
  executionData: string;
  transactionHash: string;
  blockTime: number;
  slot: number;
  status: 'pending' | 'executed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalExecutionSchema = new Schema<IProposalExecution>({
  proposal: { type: String, required: true },
  executor: { type: String, required: true },
  executionData: { type: String, required: true },
  transactionHash: { type: String, required: true, unique: true },
  blockTime: { type: Number, required: true },
  slot: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'executed', 'failed'], required: true, default: 'pending' },
  errorMessage: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'proposal_executions'
});

// Create indexes for better performance
GovernanceConfigSchema.index({ admin: 1 });
GovernanceConfigSchema.index({ isActive: 1 });
GovernanceConfigSchema.index({ lastSyncAt: 1 });

ProposalSchema.index({ proposalId: 1 });
ProposalSchema.index({ proposer: 1 });
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ proposalType: 1 });
ProposalSchema.index({ category: 1 });
ProposalSchema.index({ createdAt: 1 });
ProposalSchema.index({ endTime: 1 });
ProposalSchema.index({ lastSyncAt: 1 });
ProposalSchema.index({ tags: 1 });

VoteSchema.index({ voter: 1 });
VoteSchema.index({ proposal: 1 });
VoteSchema.index({ voteType: 1 });
VoteSchema.index({ timestamp: 1 });
VoteSchema.index({ transactionHash: 1 });
VoteSchema.index({ blockTime: 1 });

DelegationSchema.index({ delegator: 1 });
DelegationSchema.index({ delegate: 1 });
DelegationSchema.index({ isActive: 1 });
DelegationSchema.index({ createdAt: 1 });
DelegationSchema.index({ transactionHash: 1 });

ProposalExecutionSchema.index({ proposal: 1 });
ProposalExecutionSchema.index({ executor: 1 });
ProposalExecutionSchema.index({ status: 1 });
ProposalExecutionSchema.index({ transactionHash: 1 });
ProposalExecutionSchema.index({ blockTime: 1 });

// Export models
export const GovernanceConfig = mongoose.model<IGovernanceConfig>('GovernanceConfig', GovernanceConfigSchema);
export const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
export const Delegation = mongoose.model<IDelegation>('Delegation', DelegationSchema);
export const ProposalExecution = mongoose.model<IProposalExecution>('ProposalExecution', ProposalExecutionSchema);

// Helper functions for syncing with blockchain
export class GovernanceSyncHelper {
  static async syncGovernanceConfig(blockchainData: any, slot: number): Promise<void> {
    try {
      await GovernanceConfig.findOneAndUpdate(
        { admin: blockchainData.admin.toString() },
        {
          tokenMint: blockchainData.tokenMint.toString(),
          minProposalTokens: blockchainData.minProposalTokens.toString(),
          votingPeriod: blockchainData.votingPeriod.toNumber(),
          executionDelay: blockchainData.executionDelay.toNumber(),
          quorumThreshold: blockchainData.quorumThreshold,
          supermajorityThreshold: blockchainData.supermajorityThreshold,
          isActive: blockchainData.isActive,
          onChainSlot: slot,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.debug('Governance config synced successfully');
    } catch (error) {
      logger.error('Failed to sync governance config:', error);
      throw error;
    }
  }

  static async syncProposal(proposalId: string, blockchainData: any, slot: number): Promise<void> {
    try {
      await Proposal.findOneAndUpdate(
        { proposalId },
        {
          title: blockchainData.title,
          description: blockchainData.description,
          proposer: blockchainData.proposer.toString(),
          createdAt: new Date(blockchainData.createdAt.toNumber() * 1000),
          startTime: new Date(blockchainData.startTime.toNumber() * 1000),
          endTime: new Date(blockchainData.endTime.toNumber() * 1000),
          status: blockchainData.status,
          proposalType: blockchainData.proposalType,
          category: blockchainData.category,
          votesFor: blockchainData.votesFor.toString(),
          votesAgainst: blockchainData.votesAgainst.toString(),
          totalVotes: blockchainData.totalVotes.toString(),
          quorumRequired: blockchainData.quorumRequired.toString(),
          isExecuted: blockchainData.isExecuted,
          executionData: blockchainData.executionData,
          onChainSlot: slot,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.debug(`Proposal ${proposalId} synced successfully`);
    } catch (error) {
      logger.error(`Failed to sync proposal ${proposalId}:`, error);
      throw error;
    }
  }

  static async recordVote(
    voter: string,
    proposal: string,
    voteType: 'for' | 'against' | 'abstain',
    votingPower: string,
    transactionHash: string,
    blockTime: number,
    slot: number
  ): Promise<void> {
    try {
      await Vote.create({
        voter,
        proposal,
        voteType,
        votingPower,
        timestamp: new Date(blockTime * 1000),
        transactionHash,
        blockTime,
        slot,
      });
      logger.debug(`Vote recorded: ${transactionHash}`);
    } catch (error) {
      logger.error(`Failed to record vote ${transactionHash}:`, error);
      throw error;
    }
  }

  static async recordDelegation(
    delegator: string,
    delegate: string,
    votingPower: string,
    transactionHash: string,
    blockTime: number,
    slot: number
  ): Promise<void> {
    try {
      await Delegation.create({
        delegator,
        delegate,
        votingPower,
        createdAt: new Date(blockTime * 1000),
        transactionHash,
        blockTime,
        slot,
      });
      logger.debug(`Delegation recorded: ${transactionHash}`);
    } catch (error) {
      logger.error(`Failed to record delegation ${transactionHash}:`, error);
      throw error;
    }
  }

  static async recordProposalExecution(
    proposal: string,
    executor: string,
    executionData: string,
    transactionHash: string,
    blockTime: number,
    slot: number,
    status: 'pending' | 'executed' | 'failed' = 'pending',
    errorMessage?: string
  ): Promise<void> {
    try {
      await ProposalExecution.create({
        proposal,
        executor,
        executionData,
        transactionHash,
        blockTime,
        slot,
        status,
        errorMessage,
      });
      logger.debug(`Proposal execution recorded: ${transactionHash}`);
    } catch (error) {
      logger.error(`Failed to record proposal execution ${transactionHash}:`, error);
      throw error;
    }
  }

  // Analytics helper functions
  static async getProposalStats(proposalId: string): Promise<{
    totalVotes: number;
    votesFor: number;
    votesAgainst: number;
    participationRate: number;
    forPercentage: number;
    againstPercentage: number;
  }> {
    try {
      const proposal = await Proposal.findOne({ proposalId });
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const votes = await Vote.find({ proposal: proposalId });
      const totalVotes = votes.length;
      const votesFor = votes.filter(v => v.voteType === 'for').length;
      const votesAgainst = votes.filter(v => v.voteType === 'against').length;
      
      const participationRate = totalVotes > 0 ? (totalVotes / 1000) * 100 : 0; // Mock calculation
      const forPercentage = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
      const againstPercentage = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 0;

      return {
        totalVotes,
        votesFor,
        votesAgainst,
        participationRate,
        forPercentage,
        againstPercentage,
      };
    } catch (error) {
      logger.error(`Failed to get proposal stats for ${proposalId}:`, error);
      throw error;
    }
  }

  static async getUserVotingHistory(user: string, limit: number = 50): Promise<IVote[]> {
    try {
      return await Vote.find({ voter: user })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('proposal', 'title status');
    } catch (error) {
      logger.error(`Failed to get voting history for user ${user}:`, error);
      throw error;
    }
  }

  static async getUserDelegations(user: string): Promise<IDelegation[]> {
    try {
      return await Delegation.find({ 
        $or: [{ delegator: user }, { delegate: user }],
        isActive: true 
      }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Failed to get delegations for user ${user}:`, error);
      throw error;
    }
  }
}

export default {
  GovernanceConfig,
  Proposal,
  Vote,
  Delegation,
  ProposalExecution,
  GovernanceSyncHelper,
};
