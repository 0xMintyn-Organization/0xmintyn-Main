import mongoose, { Document, Schema } from 'mongoose';

// UBI Config Schema
export interface UbiConfigDocument extends Document {
  programAddress: string;
  admin: string;
  tokenMint: string;
  welcomeBonusAmount: string;
  initialUbiAmount: string;
  monthlyUbiAmount: string;
  maxUsers: number;
  totalUsers: number;
  totalDistributed: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockchainCreatedAt: Date;
  lastSyncedAt: Date;
  bump: number;
}

const UbiConfigSchema = new Schema<UbiConfigDocument>({
  programAddress: { type: String, required: true, unique: true },
  admin: { type: String, required: true, index: true },
  tokenMint: { type: String, required: true, index: true },
  welcomeBonusAmount: { type: String, required: true },
  initialUbiAmount: { type: String, required: true },
  monthlyUbiAmount: { type: String, required: true },
  maxUsers: { type: Number, required: true },
  totalUsers: { type: Number, default: 0, index: true },
  totalDistributed: { type: String, default: '0' },
  isActive: { type: Boolean, default: true, index: true },
  blockchainCreatedAt: { type: Date, required: true },
  lastSyncedAt: { type: Date, default: Date.now },
  bump: { type: Number, required: true }
}, {
  timestamps: true,
  collection: 'ubi_configs'
});

// User Profile Schema
export interface UserProfileDocument extends Document {
  programAddress: string;
  user: string;
  identityHash: string;
  registeredAt: Date;
  welcomeBonusClaimed: boolean;
  initialUbiClaimed: boolean;
  lastMonthlyClaim: Date;
  totalClaimed: string;
  isVerified: boolean;
  isSuspended: boolean;
  referralCode?: string;
  verificationScore: number;
  bump: number;
  // Additional tracking fields
  claimHistory: Array<{
    type: 'welcome' | 'initial' | 'monthly';
    amount: string;
    txHash: string;
    timestamp: Date;
  }>;
  verificationHistory: Array<{
    verificationScore: number;
    verifiedBy: string;
    timestamp: Date;
  }>;
  suspensionHistory: Array<{
    suspended: boolean;
    reason: string;
    suspendedBy: string;
    timestamp: Date;
  }>;
  lastSyncedAt: Date;
}

const UserProfileSchema = new Schema<UserProfileDocument>({
  programAddress: { type: String, required: true },
  user: { type: String, required: true, index: true },
  identityHash: { type: String, required: true, index: true },
  registeredAt: { type: Date, required: true, index: true },
  welcomeBonusClaimed: { type: Boolean, default: false, index: true },
  initialUbiClaimed: { type: Boolean, default: false, index: true },
  lastMonthlyClaim: { type: Date, default: new Date(0), index: true },
  totalClaimed: { type: String, default: '0', index: true },
  isVerified: { type: Boolean, default: false, index: true },
  isSuspended: { type: Boolean, default: false, index: true },
  referralCode: { type: String, sparse: true, index: true },
  verificationScore: { type: Number, default: 0, index: true },
  bump: { type: Number, required: true },
  claimHistory: [{
    type: { type: String, enum: ['welcome', 'initial', 'monthly'], required: true },
    amount: { type: String, required: true },
    txHash: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  verificationHistory: [{
    verificationScore: { type: Number, required: true },
    verifiedBy: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  suspensionHistory: [{
    suspended: { type: Boolean, required: true },
    reason: { type: String, required: true },
    suspendedBy: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'user_profiles'
});

// Fraud Detection Schema
export interface FraudDetectionDocument extends Document {
  programAddress: string;
  user: string;
  identityHash: string;
  registrationTimestamp: Date;
  verificationAttempts: number;
  isFlagged: boolean;
  riskScore: number;
  lastActivity: Date;
  bump: number;
  // Additional tracking
  fraudReports: Array<{
    reporter: string;
    reason: string;
    timestamp: Date;
    newRiskScore: number;
  }>;
  riskScoreHistory: Array<{
    oldScore: number;
    newScore: number;
    reason: string;
    timestamp: Date;
  }>;
  lastSyncedAt: Date;
}

const FraudDetectionSchema = new Schema<FraudDetectionDocument>({
  programAddress: { type: String, required: true },
  user: { type: String, required: true, index: true },
  identityHash: { type: String, required: true, index: true },
  registrationTimestamp: { type: Date, required: true },
  verificationAttempts: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false, index: true },
  riskScore: { type: Number, default: 0, index: true },
  lastActivity: { type: Date, required: true, index: true },
  bump: { type: Number, required: true },
  fraudReports: [{
    reporter: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    newRiskScore: { type: Number, required: true }
  }],
  riskScoreHistory: [{
    oldScore: { type: Number, required: true },
    newScore: { type: Number, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'fraud_detections'
});

// Treasury Schema
export interface TreasuryDocument extends Document {
  programAddress: string;
  authority: string;
  tokenMint: string;
  totalFunded: string;
  totalDistributed: string;
  bump: number;
  fundingHistory: Array<{
    funder: string;
    amount: string;
    txHash: string;
    timestamp: Date;
  }>;
  distributionHistory: Array<{
    recipient: string;
    amount: string;
    type: 'welcome' | 'initial' | 'monthly';
    txHash: string;
    timestamp: Date;
  }>;
  lastSyncedAt: Date;
}

const TreasurySchema = new Schema<TreasuryDocument>({
  programAddress: { type: String, required: true, unique: true },
  authority: { type: String, required: true, index: true },
  tokenMint: { type: String, required: true, index: true },
  totalFunded: { type: String, default: '0' },
  totalDistributed: { type: String, default: '0' },
  bump: { type: Number, required: true },
  fundingHistory: [{
    funder: { type: String, required: true },
    amount: { type: String, required: true },
    txHash: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  distributionHistory: [{
    recipient: { type: String, required: true },
    amount: { type: String, required: true },
    type: { type: String, enum: ['welcome', 'initial', 'monthly'], required: true },
    txHash: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'treasuries'
});

// UBI Events Schema
export interface UbiEventDocument extends Document {
  programAddress: string;
  eventType: 'UserInitialized' | 'InitialUbiClaimed' | 'MonthlyUbiClaimed' | 'FraudReported' | 'UserSuspended' | 'UserVerified' | 'TreasuryFunded' | 'ProgramToggled' | 'UbiAmountsUpdated' | 'WelcomeBonusDistributed';
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  user?: string;
  amount?: string;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

const UbiEventSchema = new Schema<UbiEventDocument>({
  programAddress: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['UserInitialized', 'InitialUbiClaimed', 'MonthlyUbiClaimed', 'FraudReported', 'UserSuspended', 'UserVerified', 'TreasuryFunded', 'ProgramToggled', 'UbiAmountsUpdated', 'WelcomeBonusDistributed'],
    index: true 
  },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  user: { type: String, sparse: true, index: true },
  amount: { type: String, sparse: true },
  data: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date, sparse: true },
  error: { type: String, sparse: true }
}, {
  timestamps: true,
  collection: 'ubi_events'
});

// Indexes for better query performance
UbiConfigSchema.index({ isActive: 1, totalUsers: 1 });
UbiConfigSchema.index({ admin: 1, isActive: 1 });

UserProfileSchema.index({ user: 1, programAddress: 1 }, { unique: true });
UserProfileSchema.index({ isVerified: 1, isSuspended: 1 });
UserProfileSchema.index({ referralCode: 1, isVerified: 1 });
UserProfileSchema.index({ totalClaimed: 1, registeredAt: 1 });
UserProfileSchema.index({ lastMonthlyClaim: 1, isVerified: 1, isSuspended: 1 });

FraudDetectionSchema.index({ user: 1, programAddress: 1 }, { unique: true });
FraudDetectionSchema.index({ isFlagged: 1, riskScore: 1 });
FraudDetectionSchema.index({ identityHash: 1, isFlagged: 1 });

TreasurySchema.index({ authority: 1, tokenMint: 1 });
TreasurySchema.index({ totalFunded: 1, totalDistributed: 1 });

UbiEventSchema.index({ eventType: 1, blockTime: 1 });
UbiEventSchema.index({ user: 1, eventType: 1, blockTime: 1 });
UbiEventSchema.index({ processed: 1, blockTime: 1 });
UbiEventSchema.index({ blockNumber: 1, eventType: 1 });

// Create models
export const UbiConfig = mongoose.model<UbiConfigDocument>('UbiConfig', UbiConfigSchema);
export const UserProfile = mongoose.model<UserProfileDocument>('UserProfile', UserProfileSchema);
export const FraudDetection = mongoose.model<FraudDetectionDocument>('FraudDetection', FraudDetectionSchema);
export const Treasury = mongoose.model<TreasuryDocument>('Treasury', TreasurySchema);
export const UbiEvent = mongoose.model<UbiEventDocument>('UbiEvent', UbiEventSchema);

// Utility functions for UBI models
export class UbiModelUtils {
  static async getUserStats(user: string) {
    const profile = await UserProfile.findOne({ user });
    const fraudDetection = await FraudDetection.findOne({ user });
    
    return {
      profile,
      fraudDetection,
      totalClaims: profile?.claimHistory.length || 0,
      lastClaimDate: profile?.claimHistory.slice(-1)[0]?.timestamp,
      canClaimMonthly: profile ? this.canClaimMonthly(profile) : false
    };
  }

  static canClaimMonthly(profile: UserProfileDocument): boolean {
    if (!profile.isVerified || profile.isSuspended || !profile.initialUbiClaimed) {
      return false;
    }
    
    const now = new Date();
    const monthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const timeSinceLastClaim = now.getTime() - profile.lastMonthlyClaim.getTime();
    
    return timeSinceLastClaim >= monthInMs;
  }

  static async getFraudAlerts(riskThreshold: number = 70) {
    return await FraudDetection.find({
      $or: [
        { isFlagged: true },
        { riskScore: { $gte: riskThreshold } }
      ]
    }).populate('user');
  }

  static async getTreasuryStats(programAddress: string) {
    const treasury = await Treasury.findOne({ programAddress });
    if (!treasury) return null;
    
    const totalFunded = BigInt(treasury.totalFunded);
    const totalDistributed = BigInt(treasury.totalDistributed);
    const remainingBalance = totalFunded - totalDistributed;
    
    return {
      totalFunded: treasury.totalFunded,
      totalDistributed: treasury.totalDistributed,
      remainingBalance: remainingBalance.toString(),
      utilizationRate: totalFunded > 0n ? (Number(totalDistributed * 100n / totalFunded)) : 0,
      fundingHistory: treasury.fundingHistory,
      distributionHistory: treasury.distributionHistory
    };
  }

  static async getSystemMetrics() {
    const config = await UbiConfig.findOne({});
    if (!config) return null;
    
    const totalUsers = await UserProfile.countDocuments({});
    const verifiedUsers = await UserProfile.countDocuments({ isVerified: true });
    const suspendedUsers = await UserProfile.countDocuments({ isSuspended: true });
    const flaggedUsers = await FraudDetection.countDocuments({ isFlagged: true });
    
    const recentClaims = await UbiEvent.countDocuments({
      eventType: { $in: ['InitialUbiClaimed', 'MonthlyUbiClaimed'] },
      blockTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    
    return {
      totalUsers,
      verifiedUsers,
      suspendedUsers,
      flaggedUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
      recentClaims,
      systemActive: config.isActive
    };
  }
}













