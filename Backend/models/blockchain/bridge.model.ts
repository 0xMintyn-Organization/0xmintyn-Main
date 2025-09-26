import mongoose, { Document, Schema } from 'mongoose';

// Bridge Config Schema
export interface BridgeConfigDocument extends Document {
  programAddress: string;
  admin: string;
  guardians: string[];
  requiredSignatures: number;
  supportedChains: string[];
  bridgeFee: string;
  feeRecipient: string;
  totalBridged: string;
  totalRequests: number;
  isActive: boolean;
  lastSyncedAt: Date;
}

const BridgeConfigSchema = new Schema<BridgeConfigDocument>({
  programAddress: { type: String, required: true, unique: true },
  admin: { type: String, required: true, index: true },
  guardians: [{ type: String, index: true }],
  requiredSignatures: { type: Number, required: true },
  supportedChains: [{ type: String, index: true }],
  bridgeFee: { type: String, required: true },
  feeRecipient: { type: String, required: true, index: true },
  totalBridged: { type: String, default: '0' },
  totalRequests: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'bridge_configs'
});

// Bridge Request Schema
export interface BridgeRequestDocument extends Document {
  programAddress: string;
  requestId: string;
  sender: string;
  tokenMint: string;
  amount: string;
  destinationChain: string;
  destinationAddress: string;
  bridgeFee: string;
  status: number; // 0: Pending, 1: Completed, 2: Failed, 3: Cancelled
  createdAt: Date;
  completedAt?: Date;
  destinationTxHash?: string;
  guardian?: string;
  // Processing details
  signatures: Array<{
    guardian: string;
    signature: string;
    timestamp: Date;
    txHash: string;
  }>;
  signatureCount: number;
  estimatedCompletionTime?: Date;
  failureReason?: string;
  cancellationReason?: string;
  // Refund details
  refunded: boolean;
  refundTxHash?: string;
  refundAt?: Date;
  lastSyncedAt: Date;
}

const BridgeRequestSchema = new Schema<BridgeRequestDocument>({
  programAddress: { type: String, required: true, index: true },
  requestId: { type: String, required: true, unique: true, index: true },
  sender: { type: String, required: true, index: true },
  tokenMint: { type: String, required: true, index: true },
  amount: { type: String, required: true },
  destinationChain: { type: String, required: true, index: true },
  destinationAddress: { type: String, required: true, index: true },
  bridgeFee: { type: String, required: true },
  status: { type: Number, default: 0, index: true },
  completedAt: { type: Date, sparse: true },
  destinationTxHash: { type: String, sparse: true, index: true },
  guardian: { type: String, sparse: true, index: true },
  signatures: [{
    guardian: { type: String, required: true },
    signature: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    txHash: { type: String, required: true, index: true }
  }],
  signatureCount: { type: Number, default: 0, index: true },
  estimatedCompletionTime: { type: Date, sparse: true },
  failureReason: { type: String, sparse: true },
  cancellationReason: { type: String, sparse: true },
  refunded: { type: Boolean, default: false, index: true },
  refundTxHash: { type: String, sparse: true, index: true },
  refundAt: { type: Date, sparse: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'bridge_requests'
});

// Guardian Signature Schema
export interface GuardianSignatureDocument extends Document {
  programAddress: string;
  guardian: string;
  bridgeRequest: string;
  signature: string;
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  // Guardian info
  guardianIndex: number;
  isValid: boolean;
  verificationData?: Record<string, any>;
}

const GuardianSignatureSchema = new Schema<GuardianSignatureDocument>({
  programAddress: { type: String, required: true, index: true },
  guardian: { type: String, required: true, index: true },
  bridgeRequest: { type: String, required: true, index: true },
  signature: { type: String, required: true },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  guardianIndex: { type: Number, required: true },
  isValid: { type: Boolean, default: true, index: true },
  verificationData: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'guardian_signatures'
});

// Supported Token Schema
export interface SupportedTokenDocument extends Document {
  programAddress: string;
  tokenMint: string;
  symbol: string;
  name: string;
  decimals: number;
  bridgeVault: string;
  isActive: boolean;
  // Bridge limits
  minBridgeAmount: string;
  maxBridgeAmount: string;
  dailyLimit: string;
  currentDailyVolume: string;
  lastDailyReset: Date;
  // Chain support
  supportedChains: Array<{
    chain: string;
    contractAddress: string;
    isActive: boolean;
  }>;
  lastSyncedAt: Date;
}

const SupportedTokenSchema = new Schema<SupportedTokenDocument>({
  programAddress: { type: String, required: true, index: true },
  tokenMint: { type: String, required: true, unique: true, index: true },
  symbol: { type: String, required: true, index: true },
  name: { type: String, required: true },
  decimals: { type: Number, required: true },
  bridgeVault: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  minBridgeAmount: { type: String, required: true },
  maxBridgeAmount: { type: String, required: true },
  dailyLimit: { type: String, required: true },
  currentDailyVolume: { type: String, default: '0' },
  lastDailyReset: { type: Date, default: Date.now },
  supportedChains: [{
    chain: { type: String, required: true },
    contractAddress: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'supported_tokens'
});

// Bridge Statistics Schema
export interface BridgeStatsDocument extends Document {
  programAddress: string;
  date: Date; // Daily stats
  chain: string;
  tokenMint: string;
  // Volume metrics
  totalVolume: string;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  cancelledRequests: number;
  pendingRequests: number;
  // Time metrics
  averageProcessingTime: number; // in seconds
  fastestProcessingTime: number;
  slowestProcessingTime: number;
  // Fee metrics
  totalFeesCollected: string;
  averageFee: string;
}

const BridgeStatsSchema = new Schema<BridgeStatsDocument>({
  programAddress: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  chain: { type: String, required: true, index: true },
  tokenMint: { type: String, required: true, index: true },
  totalVolume: { type: String, default: '0' },
  totalRequests: { type: Number, default: 0 },
  completedRequests: { type: Number, default: 0 },
  failedRequests: { type: Number, default: 0 },
  cancelledRequests: { type: Number, default: 0 },
  pendingRequests: { type: Number, default: 0 },
  averageProcessingTime: { type: Number, default: 0 },
  fastestProcessingTime: { type: Number, default: 0 },
  slowestProcessingTime: { type: Number, default: 0 },
  totalFeesCollected: { type: String, default: '0' },
  averageFee: { type: String, default: '0' }
}, {
  timestamps: false,
  collection: 'bridge_stats'
});

// Bridge Events Schema
export interface BridgeEventDocument extends Document {
  programAddress: string;
  eventType: 'BridgeInitiated' | 'BridgeCompleted' | 'BridgeCancelled' | 'GuardianAdded' | 'GuardianRemoved' | 'BridgeRequestSigned' | 'TokenAdded' | 'ConfigUpdated';
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  sender?: string;
  guardian?: string;
  bridgeRequest?: string;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

const BridgeEventSchema = new Schema<BridgeEventDocument>({
  programAddress: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['BridgeInitiated', 'BridgeCompleted', 'BridgeCancelled', 'GuardianAdded', 'GuardianRemoved', 'BridgeRequestSigned', 'TokenAdded', 'ConfigUpdated'],
    index: true 
  },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  sender: { type: String, sparse: true, index: true },
  guardian: { type: String, sparse: true, index: true },
  bridgeRequest: { type: String, sparse: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date, sparse: true },
  error: { type: String, sparse: true }
}, {
  timestamps: true,
  collection: 'bridge_events'
});

// Indexes
BridgeConfigSchema.index({ isActive: 1, totalRequests: 1 });

BridgeRequestSchema.index({ sender: 1, status: 1 });
BridgeRequestSchema.index({ destinationChain: 1, status: 1 });
BridgeRequestSchema.index({ status: 1, createdAt: -1 });
BridgeRequestSchema.index({ tokenMint: 1, destinationChain: 1 });

GuardianSignatureSchema.index({ guardian: 1, bridgeRequest: 1 }, { unique: true });
GuardianSignatureSchema.index({ bridgeRequest: 1, isValid: 1 });

SupportedTokenSchema.index({ isActive: 1, symbol: 1 });
SupportedTokenSchema.index({ 'supportedChains.chain': 1, 'supportedChains.isActive': 1 });

BridgeStatsSchema.index({ programAddress: 1, date: -1 });
BridgeStatsSchema.index({ chain: 1, date: -1 });
BridgeStatsSchema.index({ tokenMint: 1, date: -1 });

BridgeEventSchema.index({ eventType: 1, blockTime: -1 });
BridgeEventSchema.index({ sender: 1, eventType: 1 });
BridgeEventSchema.index({ processed: 1, blockTime: 1 });

// Create models
export const BridgeConfig = mongoose.model<BridgeConfigDocument>('BridgeConfig', BridgeConfigSchema);
export const BridgeRequest = mongoose.model<BridgeRequestDocument>('BridgeRequest', BridgeRequestSchema);
export const GuardianSignature = mongoose.model<GuardianSignatureDocument>('GuardianSignature', GuardianSignatureSchema);
export const SupportedToken = mongoose.model<SupportedTokenDocument>('SupportedToken', SupportedTokenSchema);
export const BridgeStats = mongoose.model<BridgeStatsDocument>('BridgeStats', BridgeStatsSchema);
export const BridgeEvent = mongoose.model<BridgeEventDocument>('BridgeEvent', BridgeEventSchema);

// Utility functions
export class BridgeModelUtils {
  static async updateRequestStatus(requestId: string) {
    const request = await BridgeRequest.findOne({ requestId });
    if (!request) return null;

    const config = await BridgeConfig.findOne({ programAddress: request.programAddress });
    if (!config) return null;

    // Update signature count
    const signatures = await GuardianSignature.countDocuments({
      bridgeRequest: requestId,
      isValid: true
    });

    await BridgeRequest.updateOne(
      { requestId },
      { 
        signatureCount: signatures,
        lastSyncedAt: new Date()
      }
    );

    // Check if ready for completion
    if (signatures >= config.requiredSignatures && request.status === 0) {
      // Estimate completion time (add 10-30 minutes for guardian processing)
      const estimatedTime = new Date(Date.now() + (Math.random() * 20 + 10) * 60 * 1000);
      
      await BridgeRequest.updateOne(
        { requestId },
        { estimatedCompletionTime: estimatedTime }
      );
    }

    return await BridgeRequest.findOne({ requestId });
  }

  static async getBridgeStats(
    timeframe: 'day' | 'week' | 'month' = 'month',
    chain?: string,
    token?: string
  ) {
    const now = new Date();
    const timeframeMap = {
      day: 1,
      week: 7,
      month: 30
    };

    const daysBack = timeframeMap[timeframe];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const matchConditions: any = { date: { $gte: startDate } };
    if (chain) matchConditions.chain = chain;
    if (token) matchConditions.tokenMint = token;

    const stats = await BridgeStats.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: { $toDecimal: '$totalVolume' } },
          totalRequests: { $sum: '$totalRequests' },
          completedRequests: { $sum: '$completedRequests' },
          failedRequests: { $sum: '$failedRequests' },
          cancelledRequests: { $sum: '$cancelledRequests' },
          pendingRequests: { $sum: '$pendingRequests' },
          totalFees: { $sum: { $toDecimal: '$totalFeesCollected' } },
          avgProcessingTime: { $avg: '$averageProcessingTime' }
        }
      }
    ]);

    const result = stats[0] || {
      totalVolume: '0',
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      cancelledRequests: 0,
      pendingRequests: 0,
      totalFees: '0',
      avgProcessingTime: 0
    };

    // Calculate success rate
    const successRate = result.totalRequests > 0 
      ? (result.completedRequests / result.totalRequests) * 100 
      : 0;

    return {
      ...result,
      totalVolume: result.totalVolume.toString(),
      totalFees: result.totalFees.toString(),
      successRate: Math.round(successRate * 100) / 100,
      timeframe
    };
  }

  static async getUserBridgeHistory(
    user: string,
    limit: number = 20,
    skip: number = 0,
    status?: number
  ) {
    const query: any = { sender: user };
    if (status !== undefined) query.status = status;

    const requests = await BridgeRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BridgeRequest.countDocuments(query);

    // Get user stats
    const userStats = await BridgeRequest.aggregate([
      { $match: { sender: user } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          volume: { $sum: { $toDecimal: '$amount' } }
        }
      }
    ]);

    const stats = {
      total: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      totalVolume: '0'
    };

    userStats.forEach(stat => {
      const statusMap = ['pending', 'completed', 'failed', 'cancelled'];
      const statusName = statusMap[stat._id] || 'unknown';
      stats[statusName] = stat.count;
      stats.total += stat.count;
      stats.totalVolume = (BigInt(stats.totalVolume) + BigInt(stat.volume.toString())).toString();
    });

    return {
      requests,
      total,
      hasMore: skip + limit < total,
      stats
    };
  }

  static async getChainStats() {
    const chainStats = await BridgeRequest.aggregate([
      {
        $group: {
          _id: '$destinationChain',
          totalRequests: { $sum: 1 },
          totalVolume: { $sum: { $toDecimal: '$amount' } },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] }
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ['$status', 0] }, 1, 0] }
          }
        }
      },
      { $sort: { totalVolume: -1 } }
    ]);

    return chainStats.map(stat => ({
      chain: stat._id,
      totalRequests: stat.totalRequests,
      totalVolume: stat.totalVolume.toString(),
      completedRequests: stat.completedRequests,
      pendingRequests: stat.pendingRequests,
      successRate: stat.totalRequests > 0 
        ? (stat.completedRequests / stat.totalRequests) * 100 
        : 0
    }));
  }

  static async getTokenStats() {
    const tokenStats = await BridgeRequest.aggregate([
      {
        $group: {
          _id: '$tokenMint',
          totalRequests: { $sum: 1 },
          totalVolume: { $sum: { $toDecimal: '$amount' } },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] }
          }
        }
      },
      { $sort: { totalVolume: -1 } },
      { $limit: 20 }
    ]);

    // Enhance with token information
    const enhancedStats = await Promise.all(
      tokenStats.map(async (stat) => {
        const tokenInfo = await SupportedToken.findOne({ tokenMint: stat._id });
        return {
          tokenMint: stat._id,
          symbol: tokenInfo?.symbol || 'UNKNOWN',
          name: tokenInfo?.name || 'Unknown Token',
          totalRequests: stat.totalRequests,
          totalVolume: stat.totalVolume.toString(),
          completedRequests: stat.completedRequests,
          successRate: stat.totalRequests > 0 
            ? (stat.completedRequests / stat.totalRequests) * 100 
            : 0
        };
      })
    );

    return enhancedStats;
  }

  static async getGuardianPerformance() {
    const guardianStats = await GuardianSignature.aggregate([
      {
        $group: {
          _id: '$guardian',
          totalSignatures: { $sum: 1 },
          validSignatures: {
            $sum: { $cond: ['$isValid', 1, 0] }
          },
          averageResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { totalSignatures: -1 } }
    ]);

    return guardianStats.map(stat => ({
      guardian: stat._id,
      totalSignatures: stat.totalSignatures,
      validSignatures: stat.validSignatures,
      validityRate: stat.totalSignatures > 0 
        ? (stat.validSignatures / stat.totalSignatures) * 100 
        : 0,
      averageResponseTime: stat.averageResponseTime || 0
    }));
  }

  static async checkDailyLimits(tokenMint: string): Promise<{
    isWithinLimit: boolean;
    currentVolume: string;
    dailyLimit: string;
    remainingLimit: string;
  }> {
    const token = await SupportedToken.findOne({ tokenMint });
    if (!token) {
      throw new Error('Token not supported');
    }

    // Check if we need to reset daily volume
    const now = new Date();
    const daysSinceReset = (now.getTime() - token.lastDailyReset.getTime()) / (24 * 60 * 60 * 1000);
    
    if (daysSinceReset >= 1) {
      // Reset daily volume
      await SupportedToken.updateOne(
        { tokenMint },
        { 
          currentDailyVolume: '0',
          lastDailyReset: now
        }
      );
      token.currentDailyVolume = '0';
    }

    const currentVolume = BigInt(token.currentDailyVolume);
    const dailyLimit = BigInt(token.dailyLimit);
    const remainingLimit = dailyLimit - currentVolume;

    return {
      isWithinLimit: currentVolume < dailyLimit,
      currentVolume: currentVolume.toString(),
      dailyLimit: dailyLimit.toString(),
      remainingLimit: remainingLimit > 0n ? remainingLimit.toString() : '0'
    };
  }

  static async estimateProcessingTime(destinationChain: string): Promise<number> {
    // Get average processing time for the destination chain
    const recentRequests = await BridgeRequest.find({
      destinationChain,
      status: 1, // Completed
      completedAt: { $exists: true },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).limit(50);

    if (recentRequests.length === 0) {
      return 30 * 60; // Default 30 minutes
    }

    const totalTime = recentRequests.reduce((sum, request) => {
      const processingTime = request.completedAt!.getTime() - request.createdAt.getTime();
      return sum + processingTime;
    }, 0);

    const averageTime = totalTime / recentRequests.length;
    return Math.round(averageTime / 1000); // Return in seconds
  }
}









