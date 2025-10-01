import { logger } from '../utils/logger';
import { getConnectionPool } from './solana/connection';
import { GovernanceService } from './solana/governance.service';
import { redisService } from './cache/redis.service';
import { initializeWebSocketService } from './websocket/websocket.service';
import { Server as HTTPServer } from 'http';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';

// Types
export interface BlockchainServiceConfig {
  rpcUrls: string[];
  programIds: {
    governance: string;
  };
  adminWallet?: Keypair;
  enableWorkers: boolean;
  enableWebSocket: boolean;
}

export interface ServiceStats {
  connection: {
    healthy: boolean;
    activeEndpoints: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
  redis: {
    connected: boolean;
    memory: any;
    queueLengths: Record<string, number>;
  };
  workers: {
    // Removed UBI worker
  };
  websocket: {
    connected: boolean;
    clients: number;
    rooms: number;
  };
  programs: {
    governance: boolean;
  };
}

// Blockchain Service Manager
export class BlockchainService {
  private config: BlockchainServiceConfig;
  private connectionPool = getConnectionPool();
  private governanceService: GovernanceService | null = null;
  private webSocketService: any = null;
  private isInitialized: boolean = false;
  private adminProvider: AnchorProvider | null = null;

  constructor(config: BlockchainServiceConfig) {
    this.config = config;
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('Initializing Blockchain Service...');

      // Initialize connection pool
      await this.initializeConnectionPool();

      // Initialize admin provider if admin wallet is provided
      if (this.config.adminWallet) {
        await this.initializeAdminProvider();
      }

      // Initialize program services
      await this.initializeProgramServices();

      // Initialize Redis
      await this.initializeRedis();

      // Initialize workers
      if (this.config.enableWorkers) {
        await this.initializeWorkers();
      }

      this.isInitialized = true;
      logger.info('Blockchain Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Blockchain Service:', error);
      throw error;
    }
  }

  private async initializeConnectionPool(): Promise<void> {
    try {
      // Connection pool is already initialized in the import
      // Just verify it's working
      const connection = this.connectionPool.getConnection();
      await connection.getLatestBlockhash();
      logger.info('Connection pool initialized and verified');
    } catch (error) {
      logger.error('Failed to initialize connection pool:', error);
      throw error;
    }
  }

  private async initializeAdminProvider(): Promise<void> {
    try {
      if (!this.config.adminWallet) {
        logger.warn('No admin wallet provided, skipping admin provider initialization');
        return;
      }

      const mockWallet: Wallet = {
        publicKey: this.config.adminWallet.publicKey,
        signTransaction: async (tx) => {
          tx.sign(this.config.adminWallet!);
          return tx;
        },
        signAllTransactions: async (txs) => {
          txs.forEach(tx => tx.sign(this.config.adminWallet!));
          return txs;
        },
      };

      this.adminProvider = this.connectionPool.createProvider(mockWallet);
      logger.info('Admin provider initialized');
    } catch (error) {
      logger.error('Failed to initialize admin provider:', error);
      throw error;
    }
  }

  private async initializeProgramServices(): Promise<void> {
    try {
      // Initialize Governance service
      if (this.adminProvider) {
        this.governanceService = new GovernanceService(this.adminProvider);
        logger.info('Governance service initialized');
      }

      logger.info('Program services initialized');
    } catch (error) {
      logger.error('Failed to initialize program services:', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const isHealthy = await redisService.healthCheck();
      if (!isHealthy) {
        throw new Error('Redis health check failed');
      }
      logger.info('Redis service initialized and verified');
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  private async initializeWorkers(): Promise<void> {
    try {
      // Removed UBI worker initialization
      logger.info('Background workers initialized');
    } catch (error) {
      logger.error('Failed to initialize workers:', error);
      throw error;
    }
  }

  public async initializeWebSocket(httpServer: HTTPServer): Promise<void> {
    try {
      if (!this.config.enableWebSocket) {
        logger.info('WebSocket disabled in configuration');
        return;
      }

      this.webSocketService = initializeWebSocketService(httpServer);
      logger.info('WebSocket service initialized');
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  // Public methods for accessing services

  public getGovernanceService(): GovernanceService | null {
    return this.governanceService;
  }

  public getConnectionPool() {
    return this.connectionPool;
  }

  public getRedisService() {
    return redisService;
  }

  public getWebSocketService() {
    return this.webSocketService;
  }

  // Removed UBI worker access

  // Health check and monitoring

  public async healthCheck(): Promise<{
    healthy: boolean;
    services: ServiceStats;
    errors: string[];
  }> {
    const errors: string[] = [];
    let healthy = true;

    try {
      // Check connection pool
      const connectionStats = this.connectionPool.getStats();
      if (connectionStats.healthyEndpoints === 0) {
        errors.push('No healthy RPC endpoints available');
        healthy = false;
      }

      // Check Redis
      const redisHealthy = await redisService.healthCheck();
      if (!redisHealthy) {
        errors.push('Redis connection failed');
        healthy = false;
      }

      // Removed UBI worker health check

      // Check WebSocket
      const wsHealthy = this.webSocketService ? this.webSocketService.healthCheck() : true;
      if (!wsHealthy) {
        errors.push('WebSocket service is not healthy');
        healthy = false;
      }

      const services: ServiceStats = {
        connection: {
          healthy: connectionStats.healthyEndpoints > 0,
          activeEndpoints: connectionStats.healthyEndpoints,
          totalRequests: connectionStats.totalRequests,
          successfulRequests: connectionStats.successfulRequests,
          failedRequests: connectionStats.failedRequests,
          avgResponseTime: connectionStats.avgResponseTime,
        },
        redis: {
          connected: redisHealthy,
          memory: await redisService.getStats().then(s => s.memory),
          queueLengths: await redisService.getStats().then(s => s.queueLengths),
        },
        workers: {
          // Removed UBI worker
        },
        websocket: {
          connected: wsHealthy,
          clients: this.webSocketService ? this.webSocketService.getStats().connectedClients : 0,
          rooms: this.webSocketService ? this.webSocketService.getStats().activeRooms : 0,
        },
        programs: {
          governance: !!this.governanceService,
        },
      };

      return { healthy, services, errors };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        healthy: false,
        services: {} as ServiceStats,
        errors: ['Health check failed: ' + (error as Error).message],
      };
    }
  }

  // Event handling - Removed UBI events

  public async handleGovernanceEvent(event: any): Promise<void> {
    try {
      logger.info('Handling Governance event:', event);
      
      // Process the event based on type
      switch (event.type) {
        case 'ProposalCreated':
          await this.handleProposalCreated(event);
          break;
        case 'VoteCast':
          await this.handleVoteCast(event);
          break;
        case 'ProposalExecuted':
          await this.handleProposalExecuted(event);
          break;
        default:
          logger.warn('Unknown Governance event type:', event.type);
      }
    } catch (error) {
      logger.error('Failed to handle Governance event:', error);
    }
  }

  // Event handlers - Removed UBI event handlers

  private async handleProposalCreated(event: any): Promise<void> {
    // Update database, cache, and notify clients
    if (this.webSocketService) {
      this.webSocketService.broadcastToEvent('proposal_created', event);
    }
  }

  private async handleVoteCast(event: any): Promise<void> {
    // Update database, cache, and notify clients
    if (this.webSocketService) {
      this.webSocketService.broadcastVoteCast(event.proposal, event.voter, event.voteType);
    }
  }

  private async handleProposalExecuted(event: any): Promise<void> {
    // Update database, cache, and notify clients
    if (this.webSocketService) {
      this.webSocketService.broadcastToEvent('proposal_executed', event);
    }
  }

  // Cleanup

  public async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up Blockchain Service...');

      // Removed UBI worker cleanup

      // Disconnect WebSocket
      if (this.webSocketService) {
        this.webSocketService.disconnect();
      }

      // Disconnect Redis
      await redisService.disconnect();

      // Destroy connection pool
      this.connectionPool.destroy();

      this.isInitialized = false;
      logger.info('Blockchain Service cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup Blockchain Service:', error);
    }
  }
}

// Default configuration
const defaultConfig: BlockchainServiceConfig = {
  rpcUrls: [
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'https://api.mainnet-beta.solana.com',
  ],
  programIds: {
    governance: process.env.GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111',
  },
  enableWorkers: process.env.ENABLE_WORKERS !== 'false',
  enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
};

// Singleton instance
let blockchainService: BlockchainService | null = null;

export const initializeBlockchainService = (config?: Partial<BlockchainServiceConfig>): BlockchainService => {
  if (!blockchainService) {
    const finalConfig = { ...defaultConfig, ...config };
    blockchainService = new BlockchainService(finalConfig);
  }
  return blockchainService;
};

export const getBlockchainService = (): BlockchainService | null => {
  return blockchainService;
};

export default BlockchainService;
