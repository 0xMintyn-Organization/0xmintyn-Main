import { redis } from '../../utils/redis';
import { PublicKey } from '@solana/web3.js';

export interface CacheConfig {
  defaultTTL: number;
  shortTTL: number;
  longTTL: number;
  keyPrefix: string;
}

export interface BlockchainDataCache {
  accountData: any;
  timestamp: number;
  blockNumber?: number;
  signature?: string;
}

export class RedisCacheService {
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 300, // 5 minutes
      shortTTL: 60, // 1 minute
      longTTL: 3600, // 1 hour
      keyPrefix: 'mintyn:',
      ...config
    };
  }

  // Generic cache methods
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.config.defaultTTL;
      await redis.setex(this.getKey(key), expiry, serialized);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await redis.expire(this.getKey(key), ttl);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  // Blockchain-specific caching methods

  // UBI Program Caching
  async cacheUbiConfig(programAddress: string, config: any): Promise<void> {
    const key = `ubi:config:${programAddress}`;
    await this.set(key, config, this.config.longTTL);
  }

  async getUbiConfig(programAddress: string): Promise<any> {
    const key = `ubi:config:${programAddress}`;
    return await this.get(key);
  }

  async cacheUserProfile(user: string, profile: any): Promise<void> {
    const key = `ubi:profile:${user}`;
    await this.set(key, profile, this.config.defaultTTL);
  }

  async getUserProfile(user: string): Promise<any> {
    const key = `ubi:profile:${user}`;
    return await this.get(key);
  }

  async cacheFraudDetection(user: string, fraudData: any): Promise<void> {
    const key = `ubi:fraud:${user}`;
    await this.set(key, fraudData, this.config.defaultTTL);
  }

  async getFraudDetection(user: string): Promise<any> {
    const key = `ubi:fraud:${user}`;
    return await this.get(key);
  }

  // Marketplace Caching
  async cacheMarketplaceListing(listingId: string, listing: any): Promise<void> {
    const key = `marketplace:listing:${listingId}`;
    await this.set(key, listing, this.config.defaultTTL);
  }

  async getMarketplaceListing(listingId: string): Promise<any> {
    const key = `marketplace:listing:${listingId}`;
    return await this.get(key);
  }

  async cacheActiveListings(listings: any[]): Promise<void> {
    const key = 'marketplace:active_listings';
    await this.set(key, listings, this.config.shortTTL);
  }

  async getActiveListings(): Promise<any[]> {
    const key = 'marketplace:active_listings';
    return await this.get(key) || [];
  }

  async cacheMarketplaceStats(stats: any): Promise<void> {
    const key = 'marketplace:stats';
    await this.set(key, stats, this.config.defaultTTL);
  }

  async getMarketplaceStats(): Promise<any> {
    const key = 'marketplace:stats';
    return await this.get(key);
  }

  // Governance Caching
  async cacheProposal(proposalId: string, proposal: any): Promise<void> {
    const key = `governance:proposal:${proposalId}`;
    await this.set(key, proposal, this.config.defaultTTL);
  }

  async getProposal(proposalId: string): Promise<any> {
    const key = `governance:proposal:${proposalId}`;
    return await this.get(key);
  }

  async cacheActiveProposals(proposals: any[]): Promise<void> {
    const key = 'governance:active_proposals';
    await this.set(key, proposals, this.config.defaultTTL);
  }

  async getActiveProposals(): Promise<any[]> {
    const key = 'governance:active_proposals';
    return await this.get(key) || [];
  }

  async cacheVotingPower(user: string, votingPower: string): Promise<void> {
    const key = `governance:voting_power:${user}`;
    await this.set(key, votingPower, this.config.defaultTTL);
  }

  async getVotingPower(user: string): Promise<string | null> {
    const key = `governance:voting_power:${user}`;
    return await this.get(key);
  }

  // P2P Exchange Caching
  async cacheOrderBook(baseMint: string, quoteMint: string, orderBook: any): Promise<void> {
    const key = `exchange:orderbook:${baseMint}:${quoteMint}`;
    await this.set(key, orderBook, this.config.shortTTL);
  }

  async getOrderBook(baseMint: string, quoteMint: string): Promise<any> {
    const key = `exchange:orderbook:${baseMint}:${quoteMint}`;
    return await this.get(key);
  }

  async cacheMarketStats(baseMint: string, quoteMint: string, period: string, stats: any): Promise<void> {
    const key = `exchange:stats:${baseMint}:${quoteMint}:${period}`;
    await this.set(key, stats, this.config.defaultTTL);
  }

  async getMarketStats(baseMint: string, quoteMint: string, period: string): Promise<any> {
    const key = `exchange:stats:${baseMint}:${quoteMint}:${period}`;
    return await this.get(key);
  }

  async cacheUserOrders(user: string, orders: any[]): Promise<void> {
    const key = `exchange:user_orders:${user}`;
    await this.set(key, orders, this.config.defaultTTL);
  }

  async getUserOrders(user: string): Promise<any[]> {
    const key = `exchange:user_orders:${user}`;
    return await this.get(key) || [];
  }

  // Bridge Caching
  async cacheBridgeRequest(requestId: string, request: any): Promise<void> {
    const key = `bridge:request:${requestId}`;
    await this.set(key, request, this.config.defaultTTL);
  }

  async getBridgeRequest(requestId: string): Promise<any> {
    const key = `bridge:request:${requestId}`;
    return await this.get(key);
  }

  async cacheBridgeStats(stats: any): Promise<void> {
    const key = 'bridge:stats';
    await this.set(key, stats, this.config.defaultTTL);
  }

  async getBridgeStats(): Promise<any> {
    const key = 'bridge:stats';
    return await this.get(key);
  }

  async cacheSupportedTokens(tokens: any[]): Promise<void> {
    const key = 'bridge:supported_tokens';
    await this.set(key, tokens, this.config.longTTL);
  }

  async getSupportedTokens(): Promise<any[]> {
    const key = 'bridge:supported_tokens';
    return await this.get(key) || [];
  }

  // Rate Limiting
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowKey = Math.floor(now / windowMs);
    const fullKey = `${key}:${windowKey}`;

    try {
      const current = await redis.incr(this.getKey(fullKey));
      
      if (current === 1) {
        await redis.expire(this.getKey(fullKey), Math.ceil(windowMs / 1000));
      }

      const allowed = current <= limit;
      const remainingRequests = Math.max(0, limit - current);
      const resetTime = (windowKey + 1) * windowMs;

      return { allowed, remainingRequests, resetTime };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remainingRequests: limit, resetTime: now + windowMs };
    }
  }

  // Session Management
  async setSession(sessionId: string, userData: any, ttl?: number): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, userData, ttl || this.config.longTTL);
  }

  async getSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Job Queue Integration
  async addJob(queueName: string, jobData: any, delay?: number): Promise<void> {
    const key = `queue:${queueName}`;
    const job = {
      id: Date.now() + Math.random(),
      data: jobData,
      createdAt: Date.now(),
      executeAt: Date.now() + (delay || 0)
    };

    await redis.lpush(this.getKey(key), JSON.stringify(job));
  }

  async getJob(queueName: string): Promise<any> {
    const key = `queue:${queueName}`;
    const job = await redis.rpop(this.getKey(key));
    return job ? JSON.parse(job) : null;
  }

  async getQueueLength(queueName: string): Promise<number> {
    const key = `queue:${queueName}`;
    return await redis.llen(this.getKey(key));
  }

  // Pub/Sub for Real-time Updates
  async publishEvent(channel: string, data: any): Promise<void> {
    try {
      await redis.publish(`${this.config.keyPrefix}events:${channel}`, JSON.stringify(data));
    } catch (error) {
      console.error('Redis publish error:', error);
    }
  }

  async subscribeToEvents(channel: string, callback: (data: any) => void): Promise<void> {
    try {
      const subscriber = redis.duplicate();
      await subscriber.subscribe(`${this.config.keyPrefix}events:${channel}`);
      
      subscriber.on('message', (receivedChannel, message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error('Error parsing published message:', error);
        }
      });
    } catch (error) {
      console.error('Redis subscribe error:', error);
    }
  }

  // Analytics Caching
  async cacheAnalytics(key: string, data: any, ttl?: number): Promise<void> {
    const analyticsKey = `analytics:${key}`;
    await this.set(analyticsKey, data, ttl || this.config.longTTL);
  }

  async getAnalytics(key: string): Promise<any> {
    const analyticsKey = `analytics:${key}`;
    return await this.get(analyticsKey);
  }

  // Pattern-based operations
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(this.getKey(pattern));
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Redis delete pattern error:', error);
      return 0;
    }
  }

  async getKeysPattern(pattern: string): Promise<string[]> {
    try {
      const keys = await redis.keys(this.getKey(pattern));
      return keys.map(key => key.replace(this.config.keyPrefix, ''));
    } catch (error) {
      console.error('Redis get keys pattern error:', error);
      return [];
    }
  }

  // Cache warming utilities
  async warmUserCache(user: string): Promise<void> {
    // This method would be called to pre-populate cache for a user
    // Implementation would depend on specific needs
    console.log(`Warming cache for user: ${user}`);
  }

  async warmMarketplaceCache(): Promise<void> {
    // Pre-populate frequently accessed marketplace data
    console.log('Warming marketplace cache...');
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const testKey = 'health_check';
      const testValue = Date.now().toString();
      
      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      if (retrieved === testValue) {
        return {
          status: 'healthy',
          details: {
            read: true,
            write: true,
            delete: true,
            timestamp: Date.now()
          }
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            error: 'Data integrity check failed',
            timestamp: Date.now()
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: Date.now()
        }
      };
    }
  }

  // Memory usage and stats
  async getMemoryStats(): Promise<any> {
    try {
      const info = await redis.info('memory');
      const lines = info.split('\r\n');
      const memoryStats: any = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memoryStats[key] = value;
        }
      });
      
      return memoryStats;
    } catch (error) {
      console.error('Redis memory stats error:', error);
      return {};
    }
  }

  // Cleanup utilities
  async cleanupExpiredKeys(): Promise<number> {
    // Redis automatically handles TTL cleanup, but this can be used for manual cleanup
    try {
      const expiredKeys = await this.getKeysPattern('*');
      let cleanedCount = 0;
      
      for (const key of expiredKeys) {
        const ttl = await redis.ttl(this.getKey(key));
        if (ttl === -2) { // Key doesn't exist
          cleanedCount++;
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Redis cleanup error:', error);
      return 0;
    }
  }
}

// Create global instance
export const cacheService = new RedisCacheService();









