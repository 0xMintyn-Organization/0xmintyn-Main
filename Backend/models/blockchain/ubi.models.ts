import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../../utils/logger';

// UBI Configuration Schema
export interface IUbiConfig extends Document {
  proposalId: string;
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
  onChainSlot: number;
  lastSyncAt: Date;
}

const UbiConfigSchema = new Schema<IUbiConfig>({
  proposalId: { type: String, required: true, unique: true },
  admin: { type: String, required: true },
  tokenMint: { type: String, required: true },
  welcomeBonusAmount: { type: String, required: true },
  initialUbiAmount: { type: String, required: true },
  monthlyUbiAmount: { type: String, required: true },
  maxUsers: { type: Number, required: true },
  totalUsers: { type: Number, required: true, default: 0 },
  totalDistributed: { type: String, required: true, default: '0' },
  isActive: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  onChainSlot: { type: Number, required: true },
  lastSyncAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'ubi_configs'
});

// User Profile Schema
export interface IUserProfile extends Document {
  user: string;
  identityHash: number[];
  registeredAt: Date;
  welcomeBonusClaimed: boolean;
  initialUbiClaimed: boolean;
  lastMonthlyClaim: Date;
  totalClaimed: string;
  isVerified: boolean;
  isSuspended: boolean;
  referralCode?: string;
  verificationScore: number;
  createdAt: Date;
  updatedAt: Date;
  onChainSlot: number;
  lastSyncAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  user: { type: String, required: true, unique: true },
  identityHash: [{ type: Number, required: true }],
  registeredAt: { type: Date, required: true },
  welcomeBonusClaimed: { type: Boolean, required: true, default: false },
  initialUbiClaimed: { type: Boolean, required: true, default: false },
  lastMonthlyClaim: { type: Date, required: true },
  totalClaimed: { type: String, required: true, default: '0' },
  isVerified: { type: Boolean, required: true, default: false },
  isSuspended: { type: Boolean, required: true, default: false },
  referralCode: { type: String },
  verificationScore: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  onChainSlot: { type: Number, required: true },
  lastSyncAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'user_profiles'
});

// Fraud Detection Schema
export interface IFraudDetection extends Document {
  user: string;
  identityHash: number[];
  registrationTimestamp: Date;
  verificationAttempts: number;
  isFlagged: boolean;
  riskScore: number;
  lastActivity: Date;
  reports: Array<{
    reporter: string;
    reason: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;
  createdAt: Date;
  updatedAt: Date;
  onChainSlot: number;
  lastSyncAt: Date;
}

const FraudDetectionSchema = new Schema<IFraudDetection>({
  user: { type: String, required: true, unique: true },
  identityHash: [{ type: Number, required: true }],
  registrationTimestamp: { type: Date, required: true },
  verificationAttempts: { type: Number, required: true, default: 0 },
  isFlagged: { type: Boolean, required: true, default: false },
  riskScore: { type: Number, required: true, default: 0 },
  lastActivity: { type: Date, required: true, default: Date.now },
  reports: [{
    reporter: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true, default: 'medium' }
  }],
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  onChainSlot: { type: Number, required: true },
  lastSyncAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'fraud_detections'
});

// Treasury Schema
export interface ITreasury extends Document {
  authority: string;
  tokenMint: string;
  totalFunded: string;
  totalDistributed: string;
  availableBalance: string;
  pendingDistributions: string;
  fundingHistory: Array<{
    amount: string;
    funder: string;
    timestamp: Date;
    transactionHash: string;
  }>;
  distributionHistory: Array<{
    amount: string;
    recipient: string;
    type: 'initial' | 'monthly' | 'welcome_bonus';
    timestamp: Date;
    transactionHash: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  onChainSlot: number;
  lastSyncAt: Date;
}

const TreasurySchema = new Schema<ITreasury>({
  authority: { type: String, required: true },
  tokenMint: { type: String, required: true },
  totalFunded: { type: String, required: true, default: '0' },
  totalDistributed: { type: String, required: true, default: '0' },
  availableBalance: { type: String, required: true, default: '0' },
  pendingDistributions: { type: String, required: true, default: '0' },
  fundingHistory: [{
    amount: { type: String, required: true },
    funder: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    transactionHash: { type: String, required: true }
  }],
  distributionHistory: [{
    amount: { type: String, required: true },
    recipient: { type: String, required: true },
    type: { type: String, enum: ['initial', 'monthly', 'welcome_bonus'], required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    transactionHash: { type: String, required: true }
  }],
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  onChainSlot: { type: Number, required: true },
  lastSyncAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'treasuries'
});

// UBI Transaction Schema
export interface IUbiTransaction extends Document {
  user: string;
  type: 'initial' | 'monthly' | 'welcome_bonus';
  amount: string;
  transactionHash: string;
  blockTime: number;
  slot: number;
  status: 'pending' | 'confirmed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UbiTransactionSchema = new Schema<IUbiTransaction>({
  user: { type: String, required: true },
  type: { type: String, enum: ['initial', 'monthly', 'welcome_bonus'], required: true },
  amount: { type: String, required: true },
  transactionHash: { type: String, required: true, unique: true },
  blockTime: { type: Number, required: true },
  slot: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], required: true, default: 'pending' },
  errorMessage: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'ubi_transactions'
});

// Create indexes for better performance
UbiConfigSchema.index({ proposalId: 1 });
UbiConfigSchema.index({ isActive: 1 });
UbiConfigSchema.index({ lastSyncAt: 1 });

UserProfileSchema.index({ user: 1 });
UserProfileSchema.index({ isVerified: 1 });
UserProfileSchema.index({ isSuspended: 1 });
UserProfileSchema.index({ lastSyncAt: 1 });
UserProfileSchema.index({ registeredAt: 1 });

FraudDetectionSchema.index({ user: 1 });
FraudDetectionSchema.index({ isFlagged: 1 });
FraudDetectionSchema.index({ riskScore: 1 });
FraudDetectionSchema.index({ lastSyncAt: 1 });

TreasurySchema.index({ authority: 1 });
TreasurySchema.index({ tokenMint: 1 });
TreasurySchema.index({ lastSyncAt: 1 });

UbiTransactionSchema.index({ user: 1 });
UbiTransactionSchema.index({ type: 1 });
UbiTransactionSchema.index({ status: 1 });
UbiTransactionSchema.index({ transactionHash: 1 });
UbiTransactionSchema.index({ blockTime: 1 });
UbiTransactionSchema.index({ createdAt: 1 });

// Export models
export const UbiConfig = mongoose.model<IUbiConfig>('UbiConfig', UbiConfigSchema);
export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
export const FraudDetection = mongoose.model<IFraudDetection>('FraudDetection', FraudDetectionSchema);
export const Treasury = mongoose.model<ITreasury>('Treasury', TreasurySchema);
export const UbiTransaction = mongoose.model<IUbiTransaction>('UbiTransaction', UbiTransactionSchema);

// Helper functions for syncing with blockchain
export class UbiSyncHelper {
  static async syncUbiConfig(blockchainData: any, slot: number): Promise<void> {
    try {
      await UbiConfig.findOneAndUpdate(
        { proposalId: 'main' },
        {
          admin: blockchainData.admin.toString(),
          tokenMint: blockchainData.tokenMint.toString(),
          welcomeBonusAmount: blockchainData.welcomeBonusAmount.toString(),
          initialUbiAmount: blockchainData.initialUbiAmount.toString(),
          monthlyUbiAmount: blockchainData.monthlyUbiAmount.toString(),
          maxUsers: blockchainData.maxUsers,
          totalUsers: blockchainData.totalUsers,
          totalDistributed: blockchainData.totalDistributed.toString(),
          isActive: blockchainData.isActive,
          onChainSlot: slot,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.debug('UBI config synced successfully');
    } catch (error) {
      logger.error('Failed to sync UBI config:', error);
      throw error;
    }
  }

  static async syncUserProfile(user: string, blockchainData: any, slot: number): Promise<void> {
    try {
      await UserProfile.findOneAndUpdate(
        { user },
        {
          identityHash: blockchainData.identityHash,
          registeredAt: new Date(blockchainData.registeredAt.toNumber() * 1000),
          welcomeBonusClaimed: blockchainData.welcomeBonusClaimed,
          initialUbiClaimed: blockchainData.initialUbiClaimed,
          lastMonthlyClaim: new Date(blockchainData.lastMonthlyClaim.toNumber() * 1000),
          totalClaimed: blockchainData.totalClaimed.toString(),
          isVerified: blockchainData.isVerified,
          isSuspended: blockchainData.isSuspended,
          referralCode: blockchainData.referralCode,
          verificationScore: blockchainData.verificationScore,
          onChainSlot: slot,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.debug(`User profile synced for ${user}`);
    } catch (error) {
      logger.error(`Failed to sync user profile for ${user}:`, error);
      throw error;
    }
  }

  static async syncFraudDetection(user: string, blockchainData: any, slot: number): Promise<void> {
    try {
      await FraudDetection.findOneAndUpdate(
        { user },
        {
          identityHash: blockchainData.identityHash,
          registrationTimestamp: new Date(blockchainData.registrationTimestamp.toNumber() * 1000),
          verificationAttempts: blockchainData.verificationAttempts,
          isFlagged: blockchainData.isFlagged,
          riskScore: blockchainData.riskScore,
          lastActivity: new Date(blockchainData.lastActivity.toNumber() * 1000),
          onChainSlot: slot,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.debug(`Fraud detection synced for ${user}`);
    } catch (error) {
      logger.error(`Failed to sync fraud detection for ${user}:`, error);
      throw error;
    }
  }

  static async syncTreasury(blockchainData: any, slot: number): Promise<void> {
    try {
      const availableBalance = blockchainData.totalFunded.sub(blockchainData.totalDistributed);
      
      await Treasury.findOneAndUpdate(
        { authority: blockchainData.authority.toString() },
        {
          tokenMint: blockchainData.tokenMint.toString(),
          totalFunded: blockchainData.totalFunded.toString(),
          totalDistributed: blockchainData.totalDistributed.toString(),
          availableBalance: availableBalance.toString(),
          onChainSlot: slot,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.debug('Treasury synced successfully');
    } catch (error) {
      logger.error('Failed to sync treasury:', error);
      throw error;
    }
  }

  static async recordUbiTransaction(
    user: string,
    type: 'initial' | 'monthly' | 'welcome_bonus',
    amount: string,
    transactionHash: string,
    blockTime: number,
    slot: number,
    status: 'pending' | 'confirmed' | 'failed' = 'pending',
    errorMessage?: string
  ): Promise<void> {
    try {
      await UbiTransaction.create({
        user,
        type,
        amount,
        transactionHash,
        blockTime,
        slot,
        status,
        errorMessage,
      });
      logger.debug(`UBI transaction recorded: ${transactionHash}`);
    } catch (error) {
      logger.error(`Failed to record UBI transaction ${transactionHash}:`, error);
      throw error;
    }
  }
}

export default {
  UbiConfig,
  UserProfile,
  FraudDetection,
  Treasury,
  UbiTransaction,
  UbiSyncHelper,
};
