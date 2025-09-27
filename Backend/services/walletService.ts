import { PublicKey, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { getConnectionPool } from './solana/connection';
import { getBlockchainService } from './blockchain.service';
import { logger } from '../utils/logger';
import * as nacl from 'tweetnacl';

export interface WalletValidationData {
  publicKey: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface WalletInfo {
  solBalance: number;
  splTokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
  }>;
  governanceTokens: {
    total: number;
    details: Array<{
      mint: string;
      amount: number;
      decimals: number;
    }>;
    votingPower: number;
  };
  ubiCredits: {
    availableCredits: number;
    totalEarned: number;
    lastClaim: string | null;
    claimableAmount: number;
  };
  nftAssets: Array<{
    mint: string;
    name: string;
    image: string;
    collection: string;
  }>;
  lastUpdated: number;
}

export interface WalletStats {
  totalTransactions: number;
  totalVolume: number;
  firstTransaction: string | null;
  lastTransaction: string | null;
  averageTransactionValue: number;
}

export class WalletService {
  private connectionPool = getConnectionPool();
  private blockchainService = getBlockchainService();

  constructor() {
    logger.info('Wallet Service initialized');
  }

  // Validate wallet signature and authenticate
  async validateAndAuthenticateWallet(walletData: WalletValidationData): Promise<{
    authenticated: boolean;
    publicKey?: string;
    walletInfo?: WalletInfo;
    error?: string;
  }> {
    try {
      const { publicKey, signature, message, timestamp } = walletData;
      
      // Validate public key format
      const pubKey = new PublicKey(publicKey);
      
      // Verify signature authenticity
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
      const publicKeyBytes = pubKey.toBytes();
      
      const signatureValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
      
      if (!signatureValid) {
        throw new Error('Invalid signature');
      }
      
      // Check timestamp to prevent replay attacks (5 minutes tolerance)
      const now = Date.now();
      if (Math.abs(now - timestamp) > 300000) {
        throw new Error('Signature expired');
      }
      
      // Fetch comprehensive wallet data
      const walletInfo = await this.getCompleteWalletInfo(pubKey);
      
      return {
        authenticated: true,
        publicKey: publicKey,
        walletInfo
      };
      
    } catch (error: any) {
      logger.error('Wallet validation failed:', error);
      return { 
        authenticated: false, 
        error: error.message 
      };
    }
  }

  // Get comprehensive wallet information
  async getCompleteWalletInfo(publicKey: PublicKey): Promise<WalletInfo> {
    try {
      const [
        solBalance,
        splTokens,
        governanceTokens,
        ubiCredits,
        nftAssets
      ] = await Promise.all([
        this.getSOLBalance(publicKey),
        this.getSPLTokenBalances(publicKey),
        this.getGovernanceTokenBalance(publicKey),
        this.getUBICredits(publicKey),
        this.getNFTAssets(publicKey)
      ]);

      return {
        solBalance,
        splTokens,
        governanceTokens,
        ubiCredits,
        nftAssets,
        lastUpdated: Date.now()
      };

    } catch (error) {
      logger.error('Failed to fetch wallet info:', error);
      throw error;
    }
  }

  // Get SOL balance
  async getSOLBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connectionPool.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      logger.error(`Failed to get SOL balance for ${publicKey.toString()}:`, error);
      return 0;
    }
  }

  // Get SPL token balances
  async getSPLTokenBalances(publicKey: PublicKey): Promise<WalletInfo['splTokens']> {
    try {
      const tokenAccounts = await this.connectionPool.executeWithRetry(async (connection) => {
        return connection.getTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );
      });

      const balances = [];

      for (const tokenAccount of tokenAccounts.value) {
        try {
          const balance = await this.connectionPool.executeWithRetry(async (connection) => {
            return connection.getTokenAccountBalance(tokenAccount.pubkey);
          });
          
          if (balance.value.uiAmount && balance.value.uiAmount > 0) {
            balances.push({
              mint: balance.value.mint,
              amount: balance.value.uiAmount,
              decimals: balance.value.decimals,
              tokenAccount: tokenAccount.pubkey.toString()
            });
          }
        } catch (error) {
          logger.warn(`Failed to get balance for token account ${tokenAccount.pubkey.toString()}:`, error);
        }
      }

      return balances;

    } catch (error) {
      logger.error(`Failed to get SPL token balances for ${publicKey.toString()}:`, error);
      return [];
    }
  }

  // Get governance token balance
  async getGovernanceTokenBalance(publicKey: PublicKey): Promise<WalletInfo['governanceTokens']> {
    try {
      const governanceService = this.blockchainService?.getGovernanceService();
      if (!governanceService) {
        return { total: 0, details: [], votingPower: 0 };
      }

      // Get governance token accounts
      const governanceProgramId = new PublicKey(process.env.GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111');
      const governanceAccounts = await this.connectionPool.executeWithRetry(async (connection) => {
        return connection.getTokenAccountsByOwner(
          publicKey,
          { programId: governanceProgramId }
        );
      });

      let totalGovernanceTokens = 0;
      const tokenDetails = [];

      for (const account of governanceAccounts.value) {
        try {
          const tokenAmount = await this.connectionPool.executeWithRetry(async (connection) => {
            return connection.getTokenAccountBalance(account.pubkey);
          });
          
          if (tokenAmount.value.uiAmount) {
            totalGovernanceTokens += tokenAmount.value.uiAmount;
            
            tokenDetails.push({
              mint: tokenAmount.value.mint,
              amount: tokenAmount.value.uiAmount,
              decimals: tokenAmount.value.decimals
            });
          }
        } catch (error) {
          logger.warn(`Failed to get governance token balance for account ${account.pubkey.toString()}:`, error);
        }
      }

      // Calculate voting power (simplified - in production this would be more complex)
      const votingPower = totalGovernanceTokens;

      return {
        total: totalGovernanceTokens,
        details: tokenDetails,
        votingPower
      };

    } catch (error) {
      logger.error(`Failed to get governance token balance for ${publicKey.toString()}:`, error);
      return { total: 0, details: [], votingPower: 0 };
    }
  }

  // Get UBI credits
  async getUBICredits(publicKey: PublicKey): Promise<WalletInfo['ubiCredits']> {
    try {
      const ubiService = this.blockchainService?.getUbiService();
      if (!ubiService) {
        return {
          availableCredits: 0,
          totalEarned: 0,
          lastClaim: null,
          claimableAmount: 0
        };
      }

      // Get user profile from UBI service
      const userProfile = await ubiService.getUserProfile(publicKey);
      
      if (!userProfile) {
        return {
          availableCredits: 0,
          totalEarned: 0,
          lastClaim: null,
          claimableAmount: 0
        };
      }

      // Calculate claimable amount
      const canClaimInitial = await ubiService.canClaimInitialUbi(publicKey);
      const canClaimMonthly = await ubiService.canClaimMonthlyUbi(publicKey);
      
      let claimableAmount = 0;
      if (canClaimInitial) {
        claimableAmount += 1000; // Initial UBI amount
      }
      if (canClaimMonthly) {
        claimableAmount += 100; // Monthly UBI amount
      }

      return {
        availableCredits: userProfile.totalClaimed.toNumber(),
        totalEarned: userProfile.totalClaimed.toNumber(),
        lastClaim: userProfile.lastMonthlyClaim.toNumber() > 0 
          ? new Date(userProfile.lastMonthlyClaim.toNumber() * 1000).toISOString()
          : null,
        claimableAmount
      };

    } catch (error) {
      logger.error(`Failed to get UBI credits for ${publicKey.toString()}:`, error);
      return {
        availableCredits: 0,
        totalEarned: 0,
        lastClaim: null,
        claimableAmount: 0
      };
    }
  }

  // Get NFT assets
  async getNFTAssets(publicKey: PublicKey): Promise<WalletInfo['nftAssets']> {
    try {
      // This is a simplified implementation
      // In production, you would integrate with Metaplex or other NFT standards
      const nftAssets = [];
      
      // Placeholder for NFT detection
      // You would implement actual NFT detection logic here
      
      return nftAssets;

    } catch (error) {
      logger.error(`Failed to get NFT assets for ${publicKey.toString()}:`, error);
      return [];
    }
  }

  // Get wallet statistics
  async getWalletStats(publicKey: PublicKey): Promise<WalletStats> {
    try {
      // Get transaction history
      const signatures = await this.connectionPool.executeWithRetry(async (connection) => {
        return connection.getSignaturesForAddress(publicKey, { limit: 1000 });
      });

      if (signatures.length === 0) {
        return {
          totalTransactions: 0,
          totalVolume: 0,
          firstTransaction: null,
          lastTransaction: null,
          averageTransactionValue: 0
        };
      }

      let totalVolume = 0;
      const firstTransaction = signatures[signatures.length - 1].signature;
      const lastTransaction = signatures[0].signature;

      // Calculate total volume (simplified)
      for (const sig of signatures) {
        try {
          const transaction = await this.connectionPool.executeWithRetry(async (connection) => {
            return connection.getTransaction(sig.signature);
          });
          
          if (transaction?.meta?.preBalances && transaction?.meta?.postBalances) {
            const balanceChange = Math.abs(
              transaction.meta.preBalances[0] - transaction.meta.postBalances[0]
            );
            totalVolume += balanceChange / 1e9; // Convert to SOL
          }
        } catch (error) {
          // Skip failed transaction fetches
        }
      }

      const averageTransactionValue = totalVolume / signatures.length;

      return {
        totalTransactions: signatures.length,
        totalVolume,
        firstTransaction,
        lastTransaction,
        averageTransactionValue
      };

    } catch (error) {
      logger.error(`Failed to get wallet stats for ${publicKey.toString()}:`, error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        firstTransaction: null,
        lastTransaction: null,
        averageTransactionValue: 0
      };
    }
  }

  // Monitor wallet changes
  async monitorWalletChanges(publicKey: PublicKey, callback: (update: any) => void): Promise<{
    solSubscription: number;
    tokenSubscription: number;
    unsubscribe: () => void;
  }> {
    try {
      const connection = this.connectionPool.getConnection();
      
      // Monitor SOL balance changes
      const solSubscription = connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          callback({
            type: 'SOL_BALANCE_CHANGE',
            balance: accountInfo.lamports / 1e9,
            timestamp: Date.now()
          });
        }
      );

      // Monitor SPL token changes
      const tokenSubscription = connection.onProgramAccountChange(
        TOKEN_PROGRAM_ID,
        (accountInfo) => {
          callback({
            type: 'TOKEN_BALANCE_CHANGE',
            accountInfo,
            timestamp: Date.now()
          });
        }
      );

      return {
        solSubscription,
        tokenSubscription,
        unsubscribe: () => {
          connection.removeAccountChangeListener(solSubscription);
          connection.removeAccountChangeListener(tokenSubscription);
        }
      };

    } catch (error) {
      logger.error('Wallet monitoring setup failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    connection: boolean;
    services: boolean;
    error?: string;
  }> {
    try {
      // Check connection pool
      const connectionStats = this.connectionPool.getStats();
      const connectionHealthy = connectionStats.healthyEndpoints > 0;

      // Check blockchain service
      const blockchainHealth = await this.blockchainService?.healthCheck();
      const servicesHealthy = blockchainHealth?.healthy || false;

      return {
        healthy: connectionHealthy && servicesHealthy,
        connection: connectionHealthy,
        services: servicesHealthy
      };

    } catch (error: any) {
      logger.error('Wallet service health check failed:', error);
      return {
        healthy: false,
        connection: false,
        services: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let walletService: WalletService | null = null;

export const getWalletService = (): WalletService => {
  if (!walletService) {
    walletService = new WalletService();
  }
  return walletService;
};

export default WalletService;
