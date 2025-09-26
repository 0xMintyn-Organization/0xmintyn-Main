import { Connection, PublicKey, Commitment, SendOptions, Transaction, VersionedTransaction } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// Types
export interface RpcEndpoint {
  url: string;
  weight: number;
  priority: number;
  isHealthy: boolean;
  lastUsed: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
}

export interface ConnectionConfig {
  commitment: Commitment;
  confirmTransactionInitialTimeout: number;
  skipPreflight: boolean;
  preflightCommitment: Commitment;
  maxRetries: number;
  retryDelay: number;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit: number;
  windowSize: number;
}

export interface ConnectionStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  activeConnections: number;
  healthyEndpoints: number;
  lastHealthCheck: number;
}

// Rate limiter class
class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowSize;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);

    // Check if we can make a request
    return this.requests.length < this.config.requestsPerSecond;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    return this.config.windowSize - (Date.now() - oldestRequest);
  }
}

// Connection pool manager
class ConnectionPool extends EventEmitter {
  private endpoints: RpcEndpoint[] = [];
  private connections: Map<string, Connection> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private config: ConnectionConfig;
  private stats: ConnectionStats;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: ConnectionConfig) {
    super();
    this.config = config;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      activeConnections: 0,
      healthyEndpoints: 0,
      lastHealthCheck: 0,
    };

    this.initializeEndpoints();
    this.startHealthCheck();
  }

  private initializeEndpoints(): void {
    // Primary endpoints from environment
    this.endpoints = [
      {
        url: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        weight: 10,
        priority: 1,
        isHealthy: true,
        lastUsed: 0,
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
      },
      {
        url: 'https://api.mainnet-beta.solana.com',
        weight: 8,
        priority: 2,
        isHealthy: true,
        lastUsed: 0,
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
      },
      {
        url: 'https://solana-api.projectserum.com',
        weight: 6,
        priority: 3,
        isHealthy: true,
        lastUsed: 0,
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
      },
      {
        url: 'https://rpc.ankr.com/solana',
        weight: 5,
        priority: 4,
        isHealthy: true,
        lastUsed: 0,
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
      },
    ];

    // Initialize connections and rate limiters
    this.endpoints.forEach(endpoint => {
      const connection = new Connection(endpoint.url, {
        commitment: this.config.commitment,
        confirmTransactionInitialTimeout: this.config.confirmTransactionInitialTimeout,
      });
      
      this.connections.set(endpoint.url, connection);
      
      const rateLimiter = new RateLimiter({
        requestsPerSecond: 10,
        burstLimit: 20,
        windowSize: 1000,
      });
      
      this.rateLimiters.set(endpoint.url, rateLimiter);
    });

    this.stats.activeConnections = this.connections.size;
    logger.info(`Initialized ${this.connections.size} RPC connections`);
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    const healthCheckPromises = this.endpoints.map(async (endpoint) => {
      try {
        const startTime = Date.now();
        const connection = this.connections.get(endpoint.url);
        
        if (!connection) {
          endpoint.isHealthy = false;
          return;
        }

        // Simple health check - get latest blockhash
        await connection.getLatestBlockhash();
        
        const responseTime = Date.now() - startTime;
        endpoint.avgResponseTime = (endpoint.avgResponseTime + responseTime) / 2;
        endpoint.isHealthy = true;
        endpoint.errorCount = Math.max(0, endpoint.errorCount - 1);
        
      } catch (error) {
        logger.warn(`Health check failed for ${endpoint.url}:`, error);
        endpoint.isHealthy = false;
        endpoint.errorCount++;
        
        // Mark as unhealthy if too many errors
        if (endpoint.errorCount > 5) {
          endpoint.isHealthy = false;
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
    
    this.stats.healthyEndpoints = this.endpoints.filter(e => e.isHealthy).length;
    this.stats.lastHealthCheck = Date.now();
    
    this.emit('healthCheck', this.stats);
    logger.debug(`Health check completed. Healthy endpoints: ${this.stats.healthyEndpoints}/${this.endpoints.length}`);
  }

  private selectBestEndpoint(): RpcEndpoint | null {
    const healthyEndpoints = this.endpoints
      .filter(e => e.isHealthy)
      .sort((a, b) => {
        // Sort by priority first, then by weight, then by last used
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.weight !== b.weight) return b.weight - a.weight;
        return a.lastUsed - b.lastUsed;
      });

    return healthyEndpoints[0] || null;
  }

  private async waitForRateLimit(endpoint: RpcEndpoint): Promise<void> {
    const rateLimiter = this.rateLimiters.get(endpoint.url);
    if (!rateLimiter) return;

    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    rateLimiter.recordRequest();
  }

  async executeWithRetry<T>(
    operation: (connection: Connection) => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const endpoint = this.selectBestEndpoint();
      
      if (!endpoint) {
        throw new Error('No healthy RPC endpoints available');
      }

      try {
        await this.waitForRateLimit(endpoint);
        
        const connection = this.connections.get(endpoint.url);
        if (!connection) {
          throw new Error(`Connection not found for ${endpoint.url}`);
        }

        const startTime = Date.now();
        const result = await operation(connection);
        const responseTime = Date.now() - startTime;

        // Update stats
        endpoint.lastUsed = Date.now();
        endpoint.requestCount++;
        endpoint.avgResponseTime = (endpoint.avgResponseTime + responseTime) / 2;
        
        this.stats.totalRequests++;
        this.stats.successfulRequests++;
        this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;

        return result;

      } catch (error) {
        lastError = error as Error;
        endpoint.errorCount++;
        
        // Mark endpoint as unhealthy if it fails too many times
        if (endpoint.errorCount > 3) {
          endpoint.isHealthy = false;
        }

        this.stats.failedRequests++;
        logger.warn(`Request failed on attempt ${attempt + 1}:`, error);

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  // Wrapper methods for common operations
  async getBalance(publicKey: PublicKey): Promise<number> {
    return this.executeWithRetry(async (connection) => {
      return connection.getBalance(publicKey);
    });
  }

  async getAccountInfo(publicKey: PublicKey): Promise<any> {
    return this.executeWithRetry(async (connection) => {
      return connection.getAccountInfo(publicKey);
    });
  }

  async getLatestBlockhash(): Promise<any> {
    return this.executeWithRetry(async (connection) => {
      return connection.getLatestBlockhash();
    });
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: SendOptions
  ): Promise<string> {
    return this.executeWithRetry(async (connection) => {
      return connection.sendTransaction(transaction, options);
    });
  }

  async confirmTransaction(
    signature: string,
    commitment?: Commitment
  ): Promise<any> {
    return this.executeWithRetry(async (connection) => {
      return connection.confirmTransaction(signature, commitment);
    });
  }

  async getTransaction(
    signature: string,
    options?: any
  ): Promise<any> {
    return this.executeWithRetry(async (connection) => {
      return connection.getTransaction(signature, options);
    });
  }

  // Provider creation for Anchor programs
  createProvider(wallet: Wallet): AnchorProvider {
    const endpoint = this.selectBestEndpoint();
    if (!endpoint) {
      throw new Error('No healthy RPC endpoints available');
    }

    const connection = this.connections.get(endpoint.url);
    if (!connection) {
      throw new Error(`Connection not found for ${endpoint.url}`);
    }

    return new AnchorProvider(connection, wallet, {
      commitment: this.config.commitment,
      preflightCommitment: this.config.preflightCommitment,
      skipPreflight: this.config.skipPreflight,
    });
  }

  // Get connection for direct use
  getConnection(): Connection {
    const endpoint = this.selectBestEndpoint();
    if (!endpoint) {
      throw new Error('No healthy RPC endpoints available');
    }

    const connection = this.connections.get(endpoint.url);
    if (!connection) {
      throw new Error(`Connection not found for ${endpoint.url}`);
    }

    return connection;
  }

  // Statistics and monitoring
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  getEndpoints(): RpcEndpoint[] {
    return [...this.endpoints];
  }

  // Manual health check
  async checkHealth(): Promise<void> {
    await this.performHealthCheck();
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.removeAllListeners();
    logger.info('Connection pool destroyed');
  }
}

// Default configuration
const defaultConfig: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  skipPreflight: false,
  preflightCommitment: 'confirmed',
  maxRetries: 3,
  retryDelay: 1000,
};

// Singleton instance
let connectionPool: ConnectionPool | null = null;

export const getConnectionPool = (config?: Partial<ConnectionConfig>): ConnectionPool => {
  if (!connectionPool) {
    const finalConfig = { ...defaultConfig, ...config };
    connectionPool = new ConnectionPool(finalConfig);
  }
  return connectionPool;
};

export const destroyConnectionPool = (): void => {
  if (connectionPool) {
    connectionPool.destroy();
    connectionPool = null;
  }
};

// Export types and classes
export { ConnectionPool, RateLimiter };
export default getConnectionPool;
