/**
 * Caching utilities for improved performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set cache item with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache item if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Check if cache item exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache item
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired items
   */
  cleanExpired(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const cache = new CacheManager();

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: (conversationId: string) => `messages_${conversationId}`,
  OFFERS: (conversationId: string) => `offers_${conversationId}`,
  PRODUCTS: (query: string) => `products_${query}`,
  SERVICES: (query: string) => `services_${query}`,
  USER_PROFILE: 'user_profile',
  SELLER_PROFILE: 'seller_profile',
  CATEGORY_STATS: 'category_stats',
  MARKETPLACE_STATS: 'marketplace_stats',
} as const;

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Higher-order function to add caching to API calls
 */
export function withCache<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return async (): Promise<T> => {
    // Check cache first
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedData;
    }

    console.log(`Cache miss for ${cacheKey}, fetching data...`);
    
    try {
      const data = await apiCall();
      cache.set(cacheKey, data, ttl);
      return data;
    } catch (error) {
      console.error(`API call failed for ${cacheKey}:`, error);
      throw error;
    }
  };
}

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  /**
   * Invalidate conversations cache
   */
  invalidateConversations: () => {
    cache.delete(CACHE_KEYS.CONVERSATIONS);
    console.log('Conversations cache invalidated');
  },

  /**
   * Invalidate messages cache for specific conversation
   */
  invalidateMessages: (conversationId: string) => {
    cache.delete(CACHE_KEYS.MESSAGES(conversationId));
    console.log(`Messages cache invalidated for conversation ${conversationId}`);
  },

  /**
   * Invalidate offers cache for specific conversation
   */
  invalidateOffers: (conversationId: string) => {
    cache.delete(CACHE_KEYS.OFFERS(conversationId));
    console.log(`Offers cache invalidated for conversation ${conversationId}`);
  },

  /**
   * Invalidate all marketplace data
   */
  invalidateMarketplace: () => {
    cache.delete(CACHE_KEYS.CATEGORY_STATS);
    cache.delete(CACHE_KEYS.MARKETPLACE_STATS);
    console.log('Marketplace cache invalidated');
  },

  /**
   * Invalidate user-related cache
   */
  invalidateUser: () => {
    cache.delete(CACHE_KEYS.USER_PROFILE);
    cache.delete(CACHE_KEYS.SELLER_PROFILE);
    console.log('User cache invalidated');
  }
};

/**
 * React hook for cached API calls
 */
export function useCachedApi<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  ttl: number = CACHE_TTL.MEDIUM,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const cachedData = cache.get<T>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        const result = await apiCall();
        cache.set(cacheKey, result, ttl);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = React.useCallback(async () => {
    cache.delete(cacheKey);
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      cache.set(cacheKey, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, cacheKey, ttl]);

  return { data, loading, error, refetch };
}

// Clean expired cache items every 5 minutes
setInterval(() => {
  cache.cleanExpired();
}, 5 * 60 * 1000);
