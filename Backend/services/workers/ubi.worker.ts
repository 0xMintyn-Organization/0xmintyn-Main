import { logger } from '../../utils/logger';
import { redisService, QUEUE_NAMES, CacheHelper } from '../cache/redis.service';
import { UbiSyncHelper } from '../../models/blockchain/ubi.models';
import { UbiService } from '../solana/ubi.service';
import { getConnectionPool } from '../solana/connection';
import { PublicKey, Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export class UbiWorker {
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private ubiService: UbiService | null = null;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      const connectionPool = getConnectionPool();
      const connection = connectionPool.getConnection();
      
      // Create a mock provider for the worker
      // In production, you would use a service account or admin wallet
      const mockWallet = {
        publicKey: new PublicKey(process.env.ADMIN_WALLET_PUBLIC_KEY || '11111111111111111111111111111111'),
        signTransaction: async () => { throw new Error('Worker cannot sign transactions'); },
        signAllTransactions: async () => { throw new Error('Worker cannot sign transactions'); },
      };

      // Note: In production, you would need a proper AnchorProvider setup
      // this.ubiService = new UbiService(provider);
      
      logger.info('UBI Worker services initialized');
    } catch (error) {
      logger.error('Failed to initialize UBI Worker services:', error);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('UBI Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting UBI Worker...');

    // Start processing queues
    this.startQueueProcessing();
    
    // Start scheduled tasks
    this.startScheduledTasks();

    logger.info('UBI Worker started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('UBI Worker is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('UBI Worker stopped');
  }

  private startQueueProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.processUbiQueues();
      } catch (error) {
        logger.error('Error processing UBI queues:', error);
      }
    }, 5000); // Process every 5 seconds
  }

  private startScheduledTasks(): void {
    // Monthly UBI distribution - run at the beginning of each month
    this.scheduleMonthlyDistribution();
    
    // Eligibility checks - run every hour
    this.scheduleEligibilityChecks();
    
    // Fraud detection analysis - run every 30 minutes
    this.scheduleFraudDetection();
  }

  private async processUbiQueues(): Promise<void> {
    // Process monthly distribution queue
    await this.processMonthlyDistributionQueue();
    
    // Process eligibility check queue
    await this.processEligibilityCheckQueue();
    
    // Process fraud detection queue
    await this.processFraudDetectionQueue();
  }

  private async processMonthlyDistributionQueue(): Promise<void> {
    try {
      const job = await redisService.dequeue(QUEUE_NAMES.UBI_MONTHLY_DISTRIBUTION);
      if (!job) return;

      logger.info('Processing monthly UBI distribution job:', job);

      // Get all eligible users
      const eligibleUsers = await this.getEligibleUsersForMonthlyUbi();
      
      for (const user of eligibleUsers) {
        try {
          await this.processMonthlyUbiClaim(user);
        } catch (error) {
          logger.error(`Failed to process monthly UBI for user ${user}:`, error);
        }
      }

      logger.info(`Monthly UBI distribution completed for ${eligibleUsers.length} users`);
    } catch (error) {
      logger.error('Error processing monthly distribution queue:', error);
    }
  }

  private async processEligibilityCheckQueue(): Promise<void> {
    try {
      const job = await redisService.dequeue(QUEUE_NAMES.UBI_ELIGIBILITY_CHECK);
      if (!job) return;

      logger.info('Processing eligibility check job:', job);

      const { user } = job;
      await this.checkUserEligibility(user);
    } catch (error) {
      logger.error('Error processing eligibility check queue:', error);
    }
  }

  private async processFraudDetectionQueue(): Promise<void> {
    try {
      const job = await redisService.dequeue(QUEUE_NAMES.FRAUD_DETECTION);
      if (!job) return;

      logger.info('Processing fraud detection job:', job);

      const { user, reason } = job;
      await this.analyzeFraudReport(user, reason);
    } catch (error) {
      logger.error('Error processing fraud detection queue:', error);
    }
  }

  private async getEligibleUsersForMonthlyUbi(): Promise<string[]> {
    try {
      // In production, this would query the database for eligible users
      // For now, return mock data
      const eligibleUsers: string[] = [];
      
      // Query database for users who:
      // 1. Have claimed initial UBI
      // 2. Are verified
      // 3. Are not suspended
      // 4. Haven't claimed monthly UBI in the last 30 days
      
      logger.debug(`Found ${eligibleUsers.length} eligible users for monthly UBI`);
      return eligibleUsers;
    } catch (error) {
      logger.error('Failed to get eligible users for monthly UBI:', error);
      return [];
    }
  }

  private async processMonthlyUbiClaim(user: string): Promise<void> {
    try {
      logger.info(`Processing monthly UBI claim for user ${user}`);

      // Check if user is still eligible
      const isEligible = await this.checkUserEligibility(user);
      if (!isEligible) {
        logger.warn(`User ${user} is no longer eligible for monthly UBI`);
        return;
      }

      // In production, this would:
      // 1. Create the transaction
      // 2. Sign it with admin wallet
      // 3. Send it to the blockchain
      // 4. Record the transaction in database
      // 5. Update user profile
      // 6. Update treasury records
      // 7. Publish event notification

      // Mock implementation
      const mockTxHash = `monthly_ubi_${Date.now()}_${user}`;
      
      // Record transaction
      await UbiSyncHelper.recordUbiTransaction(
        user,
        'monthly',
        '1000000000', // 1000 tokens
        mockTxHash,
        Math.floor(Date.now() / 1000),
        Date.now(),
        'confirmed'
      );

      // Publish event
      await CacheHelper.publishUbiClaim(user, '1000000000', 'monthly');

      logger.info(`Monthly UBI claim processed for user ${user}. TX: ${mockTxHash}`);
    } catch (error) {
      logger.error(`Failed to process monthly UBI claim for user ${user}:`, error);
      throw error;
    }
  }

  private async checkUserEligibility(user: string): Promise<boolean> {
    try {
      // Check cached eligibility first
      const cachedEligibility = await CacheHelper.getUserProfile(user);
      if (cachedEligibility) {
        return cachedEligibility.isEligible;
      }

      // In production, this would:
      // 1. Fetch user profile from blockchain
      // 2. Check verification status
      // 3. Check suspension status
      // 4. Check last claim time
      // 5. Cache the result

      // Mock implementation
      const isEligible = true; // Mock eligibility check
      
      // Cache the result
      await CacheHelper.cacheUserProfile(user, { isEligible });

      logger.debug(`User ${user} eligibility: ${isEligible}`);
      return isEligible;
    } catch (error) {
      logger.error(`Failed to check eligibility for user ${user}:`, error);
      return false;
    }
  }

  private async analyzeFraudReport(user: string, reason: string): Promise<void> {
    try {
      logger.info(`Analyzing fraud report for user ${user}: ${reason}`);

      // In production, this would:
      // 1. Fetch user's fraud detection data
      // 2. Analyze the report
      // 3. Update risk score
      // 4. Check if user should be flagged
      // 5. Notify admins if necessary
      // 6. Update database

      // Mock implementation
      const riskScore = Math.floor(Math.random() * 100);
      const shouldFlag = riskScore > 70;

      if (shouldFlag) {
        logger.warn(`User ${user} flagged for fraud with risk score: ${riskScore}`);
        
        // Publish system alert
        await CacheHelper.publishSystemAlert('warning', `User ${user} flagged for fraud`, {
          user,
          reason,
          riskScore,
        });
      }

      logger.debug(`Fraud analysis completed for user ${user}. Risk score: ${riskScore}`);
    } catch (error) {
      logger.error(`Failed to analyze fraud report for user ${user}:`, error);
      throw error;
    }
  }

  private scheduleMonthlyDistribution(): void {
    // Schedule monthly distribution for the 1st of each month at 00:00 UTC
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const timeUntilNext = nextMonth.getTime() - now.getTime();

    setTimeout(async () => {
      if (this.isRunning) {
        await CacheHelper.enqueueUbiMonthlyDistribution();
        logger.info('Monthly UBI distribution scheduled');
      }
      
      // Schedule the next month
      this.scheduleMonthlyDistribution();
    }, timeUntilNext);

    logger.info(`Monthly UBI distribution scheduled for ${nextMonth.toISOString()}`);
  }

  private scheduleEligibilityChecks(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Get all active users and check their eligibility
        const activeUsers = await this.getActiveUsers();
        
        for (const user of activeUsers) {
          await redisService.enqueue(QUEUE_NAMES.UBI_ELIGIBILITY_CHECK, { user });
        }

        logger.debug(`Scheduled eligibility checks for ${activeUsers.length} users`);
      } catch (error) {
        logger.error('Error scheduling eligibility checks:', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private scheduleFraudDetection(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Analyze recent fraud reports
        const recentReports = await this.getRecentFraudReports();
        
        for (const report of recentReports) {
          await redisService.enqueue(QUEUE_NAMES.FRAUD_DETECTION, report);
        }

        logger.debug(`Scheduled fraud detection analysis for ${recentReports.length} reports`);
      } catch (error) {
        logger.error('Error scheduling fraud detection:', error);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  private async getActiveUsers(): Promise<string[]> {
    try {
      // In production, this would query the database for active users
      // For now, return mock data
      return [];
    } catch (error) {
      logger.error('Failed to get active users:', error);
      return [];
    }
  }

  private async getRecentFraudReports(): Promise<any[]> {
    try {
      // In production, this would query the database for recent fraud reports
      // For now, return mock data
      return [];
    } catch (error) {
      logger.error('Failed to get recent fraud reports:', error);
      return [];
    }
  }

  // Public methods for manual operations
  async triggerMonthlyDistribution(): Promise<void> {
    logger.info('Manually triggering monthly UBI distribution');
    await CacheHelper.enqueueUbiMonthlyDistribution();
  }

  async triggerEligibilityCheck(user: string): Promise<void> {
    logger.info(`Manually triggering eligibility check for user ${user}`);
    await redisService.enqueue(QUEUE_NAMES.UBI_ELIGIBILITY_CHECK, { user });
  }

  async triggerFraudAnalysis(user: string, reason: string): Promise<void> {
    logger.info(`Manually triggering fraud analysis for user ${user}`);
    await redisService.enqueue(QUEUE_NAMES.FRAUD_DETECTION, { user, reason });
  }

  // Health check
  async healthCheck(): Promise<{
    isRunning: boolean;
    queueLengths: Record<string, number>;
    lastProcessed: Date;
  }> {
    const queueLengths = {
      [QUEUE_NAMES.UBI_MONTHLY_DISTRIBUTION]: await redisService.getQueueLength(QUEUE_NAMES.UBI_MONTHLY_DISTRIBUTION),
      [QUEUE_NAMES.UBI_ELIGIBILITY_CHECK]: await redisService.getQueueLength(QUEUE_NAMES.UBI_ELIGIBILITY_CHECK),
      [QUEUE_NAMES.FRAUD_DETECTION]: await redisService.getQueueLength(QUEUE_NAMES.FRAUD_DETECTION),
    };

    return {
      isRunning: this.isRunning,
      queueLengths,
      lastProcessed: new Date(), // In production, track actual last processed time
    };
  }
}

// Singleton instance
export const ubiWorker = new UbiWorker();

export default ubiWorker;
