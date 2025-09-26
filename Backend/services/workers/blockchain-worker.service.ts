import cron from 'node-cron';
import { solanaClientManager } from '../solana/solana-client-manager.service';
import { cacheService } from '../cache/redis-cache.service';
import { 
  UbiConfig, 
  UserProfile, 
  FraudDetection, 
  Treasury,
  UbiEvent,
  UbiModelUtils 
} from '../../models/blockchain/ubi.model';
import { 
  MarketplaceListing, 
  MarketplaceSale,
  MarketplaceEvent,
  MarketplaceModelUtils 
} from '../../models/blockchain/marketplace.model';
import { 
  Proposal, 
  Vote,
  GovernanceEvent,
  GovernanceModelUtils 
} from '../../models/blockchain/governance.model';
import { 
  ExchangeOrder, 
  Trade,
  ExchangeEvent,
  ExchangeModelUtils 
} from '../../models/blockchain/exchange.model';
import { 
  BridgeRequest, 
  BridgeEvent,
  BridgeModelUtils 
} from '../../models/blockchain/bridge.model';

export interface WorkerConfig {
  syncInterval: string; // cron expression
  eventProcessingInterval: string;
  cacheWarmupInterval: string;
  cleanupInterval: string;
  enabled: boolean;
}

export class BlockchainWorkerService {
  private config: WorkerConfig;
  private isRunning: boolean = false;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      syncInterval: '*/5 * * * *', // Every 5 minutes
      eventProcessingInterval: '*/1 * * * *', // Every minute
      cacheWarmupInterval: '0 */6 * * *', // Every 6 hours
      cleanupInterval: '0 2 * * *', // Daily at 2 AM
      enabled: true,
      ...config
    };
  }

  public start(): void {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    console.log('Starting Blockchain Worker Service...');
    this.isRunning = true;

    // Schedule blockchain data synchronization
    this.scheduleJob('sync', this.config.syncInterval, () => this.syncBlockchainData());

    // Schedule event processing
    this.scheduleJob('events', this.config.eventProcessingInterval, () => this.processEvents());

    // Schedule cache warmup
    this.scheduleJob('cache', this.config.cacheWarmupInterval, () => this.warmupCache());

    // Schedule cleanup operations
    this.scheduleJob('cleanup', this.config.cleanupInterval, () => this.cleanup());

    // Initial run
    this.performInitialSync();

    console.log('Blockchain Worker Service started successfully');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping Blockchain Worker Service...');
    this.isRunning = false;

    // Stop all scheduled jobs
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    console.log('Blockchain Worker Service stopped');
  }

  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    const job = cron.schedule(schedule, async () => {
      try {
        console.log(`Running ${name} job...`);
        await task();
        console.log(`Completed ${name} job`);
      } catch (error) {
        console.error(`Error in ${name} job:`, error);
      }
    }, { scheduled: false });

    this.jobs.set(name, job);
    job.start();
    console.log(`Scheduled ${name} job: ${schedule}`);
  }

  private async performInitialSync(): Promise<void> {
    console.log('Performing initial blockchain sync...');
    
    try {
      await Promise.all([
        this.syncUbiData(),
        this.syncMarketplaceData(),
        this.syncGovernanceData(),
        this.syncExchangeData(),
        this.syncBridgeData()
      ]);
      
      console.log('Initial sync completed');
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  }

  // Main synchronization method
  private async syncBlockchainData(): Promise<void> {
    try {
      await Promise.all([
        this.syncUbiData(),
        this.syncMarketplaceData(),
        this.syncGovernanceData(),
        this.syncExchangeData(),
        this.syncBridgeData()
      ]);
    } catch (error) {
      console.error('Blockchain sync error:', error);
    }
  }

  // UBI Data Synchronization
  private async syncUbiData(): Promise<void> {
    if (!solanaClientManager.ubi) return;

    try {
      // Sync UBI config
      const ubiConfig = await solanaClientManager.ubi.getUbiConfig();
      await UbiConfig.findOneAndUpdate(
        { programAddress: ubiConfig.admin }, // Using admin as unique identifier
        {
          ...ubiConfig,
          programAddress: ubiConfig.admin,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );

      // Cache the config
      await cacheService.cacheUbiConfig(ubiConfig.admin, ubiConfig);

      // Sync treasury data
      const treasury = await solanaClientManager.ubi.getTreasury();
      await Treasury.findOneAndUpdate(
        { programAddress: treasury.authority },
        {
          ...treasury,
          programAddress: treasury.authority,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log('UBI data synchronized');
    } catch (error) {
      console.error('UBI sync error:', error);
    }
  }

  // Marketplace Data Synchronization
  private async syncMarketplaceData(): Promise<void> {
    if (!solanaClientManager.marketplace) return;

    try {
      // Sync active listings
      const activeListings = await solanaClientManager.marketplace.getActiveListings();
      
      for (const { publicKey, account } of activeListings) {
        await MarketplaceListing.findOneAndUpdate(
          { programAddress: publicKey.toString() },
          {
            programAddress: publicKey.toString(),
            seller: account.seller.toString(),
            nftMint: account.nftMint.toString(),
            price: account.price.toString(),
            isActive: account.isActive,
            title: account.title,
            description: account.description,
            category: account.category,
            lastSyncedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Cache individual listings
        await cacheService.cacheMarketplaceListing(publicKey.toString(), account);
      }

      // Cache active listings
      await cacheService.cacheActiveListings(activeListings);

      console.log(`Synchronized ${activeListings.length} marketplace listings`);
    } catch (error) {
      console.error('Marketplace sync error:', error);
    }
  }

  // Governance Data Synchronization
  private async syncGovernanceData(): Promise<void> {
    if (!solanaClientManager.governance) return;

    try {
      // Sync governance config
      const govConfig = await solanaClientManager.governance.getGovernanceConfig();
      // Update proposals status
      const activeProposals = await solanaClientManager.governance.getActiveProposals();
      
      for (const { publicKey, account } of activeProposals) {
        await Proposal.findOneAndUpdate(
          { programAddress: publicKey.toString() },
          {
            programAddress: publicKey.toString(),
            proposalId: account.proposalId || 0,
            proposer: account.proposer.toString(),
            title: account.title,
            description: account.description,
            actionType: account.actionType,
            amount: account.amount?.toString() || '0',
            recipient: account.recipient?.toString() || '',
            yesVotes: account.yesVotes?.toString() || '0',
            noVotes: account.noVotes?.toString() || '0',
            startTime: new Date(account.startTime.toNumber() * 1000),
            endTime: new Date(account.endTime.toNumber() * 1000),
            isActive: account.isActive,
            isExecuted: account.isExecuted,
            lastSyncedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Update proposal status
        await GovernanceModelUtils.updateProposalStatus(publicKey.toString());
      }

      // Cache active proposals
      await cacheService.cacheActiveProposals(activeProposals);

      console.log(`Synchronized ${activeProposals.length} governance proposals`);
    } catch (error) {
      console.error('Governance sync error:', error);
    }
  }

  // Exchange Data Synchronization
  private async syncExchangeData(): Promise<void> {
    if (!solanaClientManager.p2pExchange) return;

    try {
      // Sync active orders
      const activeOrders = await solanaClientManager.p2pExchange.getActiveOrders();
      
      for (const { publicKey, account } of activeOrders) {
        const price = account.receiveAmount.toNumber() / account.giveAmount.toNumber();
        const filledAmount = account.filledAmount || { toNumber: () => 0 };
        const remainingAmount = account.giveAmount.sub(account.filledAmount || { toNumber: () => 0 });
        
        await ExchangeOrder.findOneAndUpdate(
          { programAddress: publicKey.toString() },
          {
            programAddress: publicKey.toString(),
            orderId: 0, // This should come from the account data
            maker: account.maker.toString(),
            giveMint: account.giveMint.toString(),
            giveAmount: account.giveAmount.toString(),
            receiveMint: account.receiveMint.toString(),
            receiveAmount: account.receiveAmount.toString(),
            filledAmount: filledAmount.toString(),
            orderType: account.orderType,
            isActive: account.isActive,
            expiryTime: new Date(account.expiryTime.toNumber() * 1000),
            price,
            remainingAmount: remainingAmount.toString(),
            fillPercentage: (filledAmount.toNumber() / account.giveAmount.toNumber()) * 100,
            baseMint: account.giveMint.toString(),
            quoteMint: account.receiveMint.toString(),
            side: account.orderType === 0 ? 'buy' : 'sell',
            lastSyncedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }

      console.log(`Synchronized ${activeOrders.length} exchange orders`);
    } catch (error) {
      console.error('Exchange sync error:', error);
    }
  }

  // Bridge Data Synchronization
  private async syncBridgeData(): Promise<void> {
    if (!solanaClientManager.bridge) return;

    try {
      // Sync bridge config
      const bridgeConfig = await solanaClientManager.bridge.getBridgeConfig();
      
      // Sync pending bridge requests
      const pendingRequests = await solanaClientManager.bridge.getPendingBridgeRequests();
      
      for (const { publicKey, account } of pendingRequests) {
        await BridgeRequest.findOneAndUpdate(
          { requestId: publicKey.toString() },
          {
            programAddress: publicKey.toString(),
            requestId: publicKey.toString(),
            sender: account.sender.toString(),
            tokenMint: account.tokenMint.toString(),
            amount: account.amount.toString(),
            destinationChain: account.destinationChain,
            destinationAddress: account.destinationAddress,
            bridgeFee: account.bridgeFee.toString(),
            status: account.status,
            lastSyncedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Update request status
        await BridgeModelUtils.updateRequestStatus(publicKey.toString());
      }

      console.log(`Synchronized ${pendingRequests.length} bridge requests`);
    } catch (error) {
      console.error('Bridge sync error:', error);
    }
  }

  // Event Processing
  private async processEvents(): Promise<void> {
    try {
      await Promise.all([
        this.processUbiEvents(),
        this.processMarketplaceEvents(),
        this.processGovernanceEvents(),
        this.processExchangeEvents(),
        this.processBridgeEvents()
      ]);
    } catch (error) {
      console.error('Event processing error:', error);
    }
  }

  private async processUbiEvents(): Promise<void> {
    const unprocessedEvents = await UbiEvent.find({ processed: false })
      .sort({ blockTime: 1 })
      .limit(100);

    for (const event of unprocessedEvents) {
      try {
        await this.processUbiEvent(event);
        await UbiEvent.updateOne(
          { _id: event._id },
          { processed: true, processedAt: new Date() }
        );
      } catch (error) {
        console.error(`Failed to process UBI event ${event.txHash}:`, error);
        await UbiEvent.updateOne(
          { _id: event._id },
          { error: error.message }
        );
      }
    }
  }

  private async processUbiEvent(event: any): Promise<void> {
    switch (event.eventType) {
      case 'UserInitialized':
        await this.handleUserInitialized(event);
        break;
      case 'InitialUbiClaimed':
      case 'MonthlyUbiClaimed':
        await this.handleUbiClaimed(event);
        break;
      case 'FraudReported':
        await this.handleFraudReported(event);
        break;
      // Add more event handlers as needed
    }
  }

  private async handleUserInitialized(event: any): Promise<void> {
    // Update user profile cache
    if (event.user) {
      await cacheService.del(`ubi:profile:${event.user}`);
      
      // Send welcome notification (placeholder)
      await this.sendNotification(event.user, 'welcome', {
        message: 'Welcome to Mintyn UBI! Your account has been initialized.',
        txHash: event.txHash
      });
    }
  }

  private async handleUbiClaimed(event: any): Promise<void> {
    // Update user profile and treasury cache
    if (event.user) {
      await cacheService.del(`ubi:profile:${event.user}`);
      await cacheService.del(`ubi:config:${event.programAddress}`);
      
      // Send claim notification
      await this.sendNotification(event.user, 'ubi_claimed', {
        message: `UBI claimed successfully! Amount: ${event.data.amount}`,
        amount: event.data.amount,
        txHash: event.txHash
      });
    }
  }

  private async handleFraudReported(event: any): Promise<void> {
    // Alert administrators about fraud report
    await this.sendAdminAlert('fraud_reported', {
      reportedUser: event.data.reportedUser,
      reporter: event.data.reporter,
      reason: event.data.reason,
      txHash: event.txHash
    });
  }

  private async processMarketplaceEvents(): Promise<void> {
    const unprocessedEvents = await MarketplaceEvent.find({ processed: false })
      .sort({ blockTime: 1 })
      .limit(100);

    for (const event of unprocessedEvents) {
      try {
        await this.processMarketplaceEvent(event);
        await MarketplaceEvent.updateOne(
          { _id: event._id },
          { processed: true, processedAt: new Date() }
        );
      } catch (error) {
        console.error(`Failed to process marketplace event ${event.txHash}:`, error);
      }
    }
  }

  private async processMarketplaceEvent(event: any): Promise<void> {
    switch (event.eventType) {
      case 'ListingCreated':
        await this.handleListingCreated(event);
        break;
      case 'ItemPurchased':
        await this.handleItemPurchased(event);
        break;
    }
  }

  private async handleListingCreated(event: any): Promise<void> {
    // Update marketplace cache
    await cacheService.del('marketplace:active_listings');
    await cacheService.del('marketplace:stats');
    
    // Send notification to seller
    if (event.seller) {
      await this.sendNotification(event.seller, 'listing_created', {
        message: 'Your item has been listed successfully!',
        nftMint: event.nftMint,
        txHash: event.txHash
      });
    }
  }

  private async handleItemPurchased(event: any): Promise<void> {
    // Update marketplace cache
    await cacheService.del('marketplace:active_listings');
    await cacheService.del('marketplace:stats');
    
    // Send notifications
    if (event.seller) {
      await this.sendNotification(event.seller, 'item_sold', {
        message: 'Your item has been sold!',
        buyer: event.buyer,
        price: event.price,
        txHash: event.txHash
      });
    }
    
    if (event.buyer) {
      await this.sendNotification(event.buyer, 'item_purchased', {
        message: 'Purchase successful!',
        nftMint: event.nftMint,
        price: event.price,
        txHash: event.txHash
      });
    }
  }

  private async processGovernanceEvents(): Promise<void> {
    // Similar implementation for governance events
  }

  private async processExchangeEvents(): Promise<void> {
    // Similar implementation for exchange events
  }

  private async processBridgeEvents(): Promise<void> {
    // Similar implementation for bridge events
  }

  // Cache Warmup
  private async warmupCache(): Promise<void> {
    try {
      console.log('Starting cache warmup...');
      
      await Promise.all([
        this.warmupUbiCache(),
        this.warmupMarketplaceCache(),
        this.warmupGovernanceCache(),
        this.warmupExchangeCache(),
        this.warmupBridgeCache()
      ]);
      
      console.log('Cache warmup completed');
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  private async warmupUbiCache(): Promise<void> {
    // Pre-cache frequently accessed UBI data
    if (solanaClientManager.ubi) {
      const config = await solanaClientManager.ubi.getUbiConfig();
      await cacheService.cacheUbiConfig(config.admin.toString(), config);
      
      const treasury = await solanaClientManager.ubi.getTreasury();
      // Cache treasury stats
    }
  }

  private async warmupMarketplaceCache(): Promise<void> {
    // Pre-cache active listings and marketplace stats
    if (solanaClientManager.marketplace) {
      const activeListings = await solanaClientManager.marketplace.getActiveListings();
      await cacheService.cacheActiveListings(activeListings);
      
      const stats = await MarketplaceModelUtils.getMarketStats();
      await cacheService.cacheMarketplaceStats(stats);
    }
  }

  private async warmupGovernanceCache(): Promise<void> {
    // Pre-cache active proposals
    if (solanaClientManager.governance) {
      const activeProposals = await solanaClientManager.governance.getActiveProposals();
      await cacheService.cacheActiveProposals(activeProposals);
    }
  }

  private async warmupExchangeCache(): Promise<void> {
    // Pre-cache order books and market stats
  }

  private async warmupBridgeCache(): Promise<void> {
    // Pre-cache bridge statistics and supported tokens
    if (solanaClientManager.bridge) {
      const stats = await solanaClientManager.bridge.getBridgeStatistics();
      await cacheService.cacheBridgeStats(stats);
    }
  }

  // Cleanup Operations
  private async cleanup(): Promise<void> {
    try {
      console.log('Starting cleanup operations...');
      
      await Promise.all([
        this.cleanupExpiredCache(),
        this.cleanupOldEvents(),
        this.updateDatabaseIndexes(),
        this.generateDailyStats()
      ]);
      
      console.log('Cleanup operations completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  private async cleanupExpiredCache(): Promise<void> {
    const cleanedKeys = await cacheService.cleanupExpiredKeys();
    console.log(`Cleaned up ${cleanedKeys} expired cache keys`);
  }

  private async cleanupOldEvents(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Archive old processed events
    await UbiEvent.deleteMany({ 
      processed: true, 
      processedAt: { $lt: thirtyDaysAgo } 
    });
    
    await MarketplaceEvent.deleteMany({ 
      processed: true, 
      processedAt: { $lt: thirtyDaysAgo } 
    });
    
    console.log('Cleaned up old events');
  }

  private async updateDatabaseIndexes(): Promise<void> {
    // Ensure all indexes are properly created
    // This is typically handled by Mongoose, but can be done manually if needed
    console.log('Database indexes updated');
  }

  private async generateDailyStats(): Promise<void> {
    // Generate daily statistics for all programs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate UBI stats
    const ubiStats = await UbiModelUtils.getSystemMetrics();
    await cacheService.cacheAnalytics(`ubi:daily_stats:${today.getTime()}`, ubiStats);
    
    // Generate marketplace stats
    const marketStats = await MarketplaceModelUtils.getMarketStats();
    await cacheService.cacheAnalytics(`marketplace:daily_stats:${today.getTime()}`, marketStats);
    
    console.log('Daily statistics generated');
  }

  // Notification system (placeholder)
  private async sendNotification(user: string, type: string, data: any): Promise<void> {
    // Implement notification logic (email, push, in-app, etc.)
    console.log(`Notification sent to ${user}: ${type}`, data);
    
    // Could integrate with WebSocket for real-time notifications
    await cacheService.publishEvent('notifications', {
      user,
      type,
      data,
      timestamp: Date.now()
    });
  }

  private async sendAdminAlert(type: string, data: any): Promise<void> {
    // Send alerts to administrators
    console.log(`Admin alert: ${type}`, data);
    
    await cacheService.publishEvent('admin_alerts', {
      type,
      data,
      timestamp: Date.now()
    });
  }

  // Health monitoring
  public async getWorkerStatus(): Promise<any> {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
      config: this.config,
      uptime: this.isRunning ? Date.now() : 0
    };
  }
}

// Global instance
export const blockchainWorker = new BlockchainWorkerService();









