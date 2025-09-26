import Redis from 'ioredis';
import { logger } from '../../utils/logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
};

// Create Redis clients
const redis = new Redis(redisConfig);
const pubRedis = new Redis(redisConfig);
const subRedis = new Redis(redisConfig);

// Cache key prefixes
export const CACHE_KEYS = {
  UBI_CONFIG: 'ubi:config',
  USER_PROFILE: 'ubi:user:',
  FRAUD_DETECTION: 'ubi:fraud:',
  TREASURY: 'ubi:treasury',
  GOVERNANCE_CONFIG: 'gov:config',
  PROPOSAL: 'gov:proposal:',
  PROPOSALS_LIST: 'gov:proposals',
  USER_VOTES: 'gov:votes:',
  USER_DELEGATIONS: 'gov:delegations:',
  MARKETPLACE_PRODUCTS: 'market:products',
  P2P_ORDER_BOOK: 'p2p:orderbook:',
  BRIDGE_CONFIG: 'bridge:config',
  BRIDGE_HEALTH: 'bridge:health',
  CONNECTION_STATS: 'connection:stats',
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  UBI_CONFIG: 300, // 5 minutes
  USER_PROFILE: 600, // 10 minutes
  FRAUD_DETECTION: 300, // 5 minutes
  TREASURY: 180, // 3 minutes
  GOVERNANCE_CONFIG: 300, // 5 minutes
  PROPOSAL: 180, // 3 minutes
  PROPOSALS_LIST: 60, // 1 minute
  USER_VOTES: 300, // 5 minutes
  USER_DELEGATIONS: 600, // 10 minutes
  MARKETPLACE_PRODUCTS: 120, // 2 minutes
  P2P_ORDER_BOOK: 30, // 30 seconds
  BRIDGE_CONFIG: 300, // 5 minutes
  BRIDGE_HEALTH: 60, // 1 minute
  CONNECTION_STATS: 30, // 30 seconds
} as const;

// Queue names
export const QUEUE_NAMES = {
  UBI_MONTHLY_DISTRIBUTION: 'ubi:monthly_distribution',
  UBI_ELIGIBILITY_CHECK: 'ubi:eligibility_check',
  PROPOSAL_EXECUTION: 'gov:proposal_execution',
  ESCROW_SETTLEMENT: 'market:escrow_settlement',
  BRIDGE_PROCESSING: 'bridge:processing',
  FRAUD_DETECTION: 'ubi:fraud_detection',
  NOTIFICATION_SEND: 'notification:send',
  ANALYTICS_UPDATE: 'analytics:update',
} as const;

// Event channels for pub/sub
export const EVENT_CHANNELS = {
  UBI_CLAIM: 'events:ubi:claim',
  UBI_REGISTRATION: 'events:ubi:registration',
  PROPOSAL_CREATED: 'events:gov:proposal_created',
  PROPOSAL_VOTED: 'events:gov:proposal_voted',
  PROPOSAL_EXECUTED: 'events:gov:proposal_executed',
  MARKETPLACE_PURCHASE: 'events:market:purchase',
  P2P_TRADE: 'events:p2p:trade',
  BRIDGE_TRANSACTION: 'events:bridge:transaction',
  FRAUD_REPORTED: 'events:fraud:reported',
  SYSTEM_ALERT: 'events:system:alert',
} as const;

// Redis Service Class
export class RedisService {
  private redis: Redis;
  private pubRedis: Redis;
  private subRedis: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.redis = redis;
    this.pubRedis = pubRedis;
    this.subRedis = subRedis;
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.redis.connect();
      await this.pubRedis.connect();
      await this.subRedis.connect();
      this.isConnected = true;
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  // Basic cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Failed to set cache key ${key}:`, error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`Failed to delete cache key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check existence of cache key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      logger.error(`Failed to set expiry for cache key ${key}:`, error);
      throw error;
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      logger.error(`Failed to hset cache key ${key}:`, error);
      throw error;
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to hget cache key ${key}:`, error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value) as T;
      }
      return result;
    } catch (error) {
      logger.error(`Failed to hgetall cache key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.redis.hdel(key, field);
    } catch (error) {
      logger.error(`Failed to hdel cache key ${key}:`, error);
      throw error;
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<void> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      await this.redis.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error(`Failed to lpush cache key ${key}:`, error);
      throw error;
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.rpop(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to rpop cache key ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.redis.llen(key);
    } catch (error) {
      logger.error(`Failed to llen cache key ${key}:`, error);
      return 0;
    }
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<void> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      await this.redis.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error(`Failed to sadd cache key ${key}:`, error);
      throw error;
    }
  }

  async smembers<T>(key: string): Promise<T[]> {
    try {
      const members = await this.redis.smembers(key);
      return members.map(m => JSON.parse(m) as T);
    } catch (error) {
      logger.error(`Failed to smembers cache key ${key}:`, error);
      return [];
    }
  }

  async srem(key: string, ...members: any[]): Promise<void> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      await this.redis.srem(key, ...serializedMembers);
    } catch (error) {
      logger.error(`Failed to srem cache key ${key}:`, error);
      throw error;
    }
  }

  // Queue operations
  async enqueue(queueName: string, job: any, priority: number = 0): Promise<void> {
    try {
      const jobData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data: job,
        priority,
        timestamp: Date.now(),
      };
      await this.redis.zadd(`${queueName}:queue`, priority, JSON.stringify(jobData));
      logger.debug(`Job enqueued in ${queueName}: ${jobData.id}`);
    } catch (error) {
      logger.error(`Failed to enqueue job in ${queueName}:`, error);
      throw error;
    }
  }

  async dequeue<T>(queueName: string): Promise<T | null> {
    try {
      const result = await this.redis.zpopmax(`${queueName}:queue`);
      if (!result || result.length === 0) return null;
      
      const jobData = JSON.parse(result[0]);
      return jobData.data as T;
    } catch (error) {
      logger.error(`Failed to dequeue job from ${queueName}:`, error);
      return null;
    }
  }

  async getQueueLength(queueName: string): Promise<number> {
    try {
      return await this.redis.zcard(`${queueName}:queue`);
    } catch (error) {
      logger.error(`Failed to get queue length for ${queueName}:`, error);
      return 0;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: any): Promise<void> {
    try {
      const serializedMessage = JSON.stringify(message);
      await this.pubRedis.publish(channel, serializedMessage);
      logger.debug(`Message published to channel ${channel}`);
    } catch (error) {
      logger.error(`Failed to publish message to channel ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subRedis.subscribe(channel);
      this.subRedis.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            logger.error(`Failed to parse message from channel ${channel}:`, error);
          }
        }
      });
      logger.debug(`Subscribed to channel ${channel}`);
    } catch (error) {
      logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subRedis.unsubscribe(channel);
      logger.debug(`Unsubscribed from channel ${channel}`);
    } catch (error) {
      logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
      throw error;
    }
  }

  // Cache management operations
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Cleared ${keys.length} keys matching pattern ${pattern}`);
      }
    } catch (error) {
      logger.error(`Failed to clear cache pattern ${pattern}:`, error);
      throw error;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    info: any;
    queueLengths: Record<string, number>;
  }> {
    try {
      const memory = await this.redis.memory('usage');
      const info = await this.redis.info('memory');
      
      const queueLengths: Record<string, number> = {};
      for (const queueName of Object.values(QUEUE_NAMES)) {
        queueLengths[queueName] = await this.getQueueLength(queueName);
      }

      return {
        connected: this.isConnected,
        memory,
        info,
        queueLengths,
      };
    } catch (error) {
      logger.error('Failed to get Redis stats:', error);
      return {
        connected: false,
        memory: null,
        info: null,
        queueLengths: {},
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      await this.pubRedis.disconnect();
      await this.subRedis.disconnect();
      this.isConnected = false;
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Failed to disconnect Redis:', error);
    }
  }
}

// Singleton instance
export const redisService = new RedisService();

// Helper functions for common cache operations
export class CacheHelper {
  // UBI cache operations
  static async cacheUbiConfig(config: any): Promise<void> {
    await redisService.set(CACHE_KEYS.UBI_CONFIG, config, CACHE_TTL.UBI_CONFIG);
  }

  static async getUbiConfig(): Promise<any> {
    return await redisService.get(CACHE_KEYS.UBI_CONFIG);
  }

  static async cacheUserProfile(user: string, profile: any): Promise<void> {
    await redisService.set(`${CACHE_KEYS.USER_PROFILE}${user}`, profile, CACHE_TTL.USER_PROFILE);
  }

  static async getUserProfile(user: string): Promise<any> {
    return await redisService.get(`${CACHE_KEYS.USER_PROFILE}${user}`);
  }

  // Governance cache operations
  static async cacheProposal(proposalId: string, proposal: any): Promise<void> {
    await redisService.set(`${CACHE_KEYS.PROPOSAL}${proposalId}`, proposal, CACHE_TTL.PROPOSAL);
  }

  static async getProposal(proposalId: string): Promise<any> {
    return await redisService.get(`${CACHE_KEYS.PROPOSAL}${proposalId}`);
  }

  static async cacheProposalsList(proposals: any[]): Promise<void> {
    await redisService.set(CACHE_KEYS.PROPOSALS_LIST, proposals, CACHE_TTL.PROPOSALS_LIST);
  }

  static async getProposalsList(): Promise<any[]> {
    return await redisService.get(CACHE_KEYS.PROPOSALS_LIST) || [];
  }

  // Queue operations
  static async enqueueUbiMonthlyDistribution(): Promise<void> {
    await redisService.enqueue(QUEUE_NAMES.UBI_MONTHLY_DISTRIBUTION, {
      type: 'monthly_distribution',
      timestamp: Date.now(),
    });
  }

  static async enqueueProposalExecution(proposalId: string, executionData: string): Promise<void> {
    await redisService.enqueue(QUEUE_NAMES.PROPOSAL_EXECUTION, {
      proposalId,
      executionData,
      timestamp: Date.now(),
    });
  }

  static async enqueueFraudDetection(user: string, reason: string): Promise<void> {
    await redisService.enqueue(QUEUE_NAMES.FRAUD_DETECTION, {
      user,
      reason,
      timestamp: Date.now(),
    });
  }

  // Event publishing
  static async publishUbiClaim(user: string, amount: string, type: string): Promise<void> {
    await redisService.publish(EVENT_CHANNELS.UBI_CLAIM, {
      user,
      amount,
      type,
      timestamp: Date.now(),
    });
  }

  static async publishProposalVoted(proposalId: string, voter: string, voteType: string): Promise<void> {
    await redisService.publish(EVENT_CHANNELS.PROPOSAL_VOTED, {
      proposalId,
      voter,
      voteType,
      timestamp: Date.now(),
    });
  }

  static async publishSystemAlert(level: string, message: string, data?: any): Promise<void> {
    await redisService.publish(EVENT_CHANNELS.SYSTEM_ALERT, {
      level,
      message,
      data,
      timestamp: Date.now(),
    });
  }
}

export default redisService;
