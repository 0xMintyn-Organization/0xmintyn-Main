import { Connection, Cluster, clusterApiUrl, Commitment } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import Redis from 'ioredis';
import { redis } from '../../utils/redis';

export interface SolanaConnectionConfig {
  clusters: {
    mainnet: string[];
    devnet: string[];
    testnet: string[];
  };
  maxRetries: number;
  retryDelayMs: number;
  requestTimeoutMs: number;
  rateLimitPerSecond: number;
  commitment: Commitment;
}

export class SolanaConnectionManager {
  private connections: Map<Cluster, Connection[]> = new Map();
  private currentConnectionIndex: Map<Cluster, number> = new Map();
  private failedConnections: Set<string> = new Set();
  private config: SolanaConnectionConfig;
  private redis: Redis;

  constructor(config: SolanaConnectionConfig) {
    this.config = config;
    this.redis = redis;
    this.initializeConnections();
  }

  private initializeConnections(): void {
    // Initialize mainnet connections
    const mainnetConnections = this.config.clusters.mainnet.map(url => 
      new Connection(url, {
        commitment: this.config.commitment,
        wsEndpoint: url.replace('https://', 'wss://').replace('http://', 'ws://'),
        httpAgent: undefined,
        fetch: undefined,
        fetchMiddleware: undefined,
        disableRetryOnRateLimit: false,
        confirmTransactionInitialTimeout: this.config.requestTimeoutMs,
      })
    );
    this.connections.set('mainnet-beta', mainnetConnections);
    this.currentConnectionIndex.set('mainnet-beta', 0);

    // Initialize devnet connections
    const devnetConnections = this.config.clusters.devnet.map(url => 
      new Connection(url, {
        commitment: this.config.commitment,
        disableRetryOnRateLimit: false,
        confirmTransactionInitialTimeout: this.config.requestTimeoutMs,
      })
    );
    this.connections.set('devnet', devnetConnections);
    this.currentConnectionIndex.set('devnet', 0);

    // Initialize testnet connections
    const testnetConnections = this.config.clusters.testnet.map(url => 
      new Connection(url, {
        commitment: this.config.commitment,
        disableRetryOnRateLimit: false,
        confirmTransactionInitialTimeout: this.config.requestTimeoutMs,
      })
    );
    this.connections.set('testnet', testnetConnections);
    this.currentConnectionIndex.set('testnet', 0);
  }

  public getConnection(cluster: Cluster = 'devnet'): Connection {
    const connections = this.connections.get(cluster);
    if (!connections || connections.length === 0) {
      throw new Error(`No connections available for cluster: ${cluster}`);
    }

    const currentIndex = this.currentConnectionIndex.get(cluster) || 0;
    const connection = connections[currentIndex];

    // Round-robin to next connection
    this.currentConnectionIndex.set(cluster, (currentIndex + 1) % connections.length);

    return connection;
  }

  public async getHealthyConnection(cluster: Cluster = 'devnet'): Promise<Connection> {
    const connections = this.connections.get(cluster);
    if (!connections || connections.length === 0) {
      throw new Error(`No connections available for cluster: ${cluster}`);
    }

    // Try each connection until we find a healthy one
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      const url = connection.rpcEndpoint;

      if (this.failedConnections.has(url)) {
        continue;
      }

      try {
        // Quick health check - get slot
        await connection.getSlot();
        return connection;
      } catch (error) {
        console.warn(`Connection failed for ${url}:`, error);
        this.failedConnections.add(url);
        
        // Remove from failed connections after 5 minutes
        setTimeout(() => {
          this.failedConnections.delete(url);
        }, 5 * 60 * 1000);
      }
    }

    // If all connections failed, reset and try again
    this.failedConnections.clear();
    return connections[0];
  }

  public async executeWithRetry<T>(
    operation: (connection: Connection) => Promise<T>,
    cluster: Cluster = 'devnet',
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries || this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const connection = await this.getHealthyConnection(cluster);
        
        // Rate limiting check
        await this.checkRateLimit(connection.rpcEndpoint);
        
        const result = await operation(connection);
        
        // Cache successful operation (if applicable)
        await this.updateConnectionStats(connection.rpcEndpoint, true);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          await this.updateConnectionStats('unknown', false);
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelayMs * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  private async checkRateLimit(endpoint: string): Promise<void> {
    const key = `rate_limit:${endpoint}`;
    const currentCount = await this.redis.get(key);
    
    if (currentCount && parseInt(currentCount) >= this.config.rateLimitPerSecond) {
      throw new Error('Rate limit exceeded');
    }
    
    await this.redis.incr(key);
    await this.redis.expire(key, 1); // 1 second window
  }

  private async updateConnectionStats(endpoint: string, success: boolean): Promise<void> {
    const key = `connection_stats:${endpoint}`;
    const stats = await this.redis.get(key);
    
    let currentStats = stats ? JSON.parse(stats) : { success: 0, failure: 0 };
    
    if (success) {
      currentStats.success++;
    } else {
      currentStats.failure++;
    }
    
    await this.redis.setex(key, 3600, JSON.stringify(currentStats)); // 1 hour TTL
  }

  public async getConnectionStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [cluster, connections] of this.connections.entries()) {
      stats[cluster] = [];
      
      for (const connection of connections) {
        const key = `connection_stats:${connection.rpcEndpoint}`;
        const connectionStats = await this.redis.get(key);
        
        stats[cluster].push({
          endpoint: connection.rpcEndpoint,
          stats: connectionStats ? JSON.parse(connectionStats) : { success: 0, failure: 0 },
          isFailed: this.failedConnections.has(connection.rpcEndpoint)
        });
      }
    }
    
    return stats;
  }

  public getProvider(cluster: Cluster = 'devnet'): AnchorProvider {
    const connection = this.getConnection(cluster);
    return new AnchorProvider(connection, {} as any, { commitment: this.config.commitment });
  }
}

// Default configuration
export const defaultSolanaConfig: SolanaConnectionConfig = {
  clusters: {
    mainnet: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ],
    devnet: [
      'https://api.devnet.solana.com',
      'https://rpc.ankr.com/solana_devnet'
    ],
    testnet: [
      'https://api.testnet.solana.com'
    ]
  },
  maxRetries: 3,
  retryDelayMs: 1000,
  requestTimeoutMs: 30000,
  rateLimitPerSecond: 10,
  commitment: 'confirmed'
};

// Global instance
export const solanaConnectionManager = new SolanaConnectionManager(defaultSolanaConfig);

