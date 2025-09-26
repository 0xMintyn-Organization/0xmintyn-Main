import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../../../../utils/logger';
import { RATE_LIMITS, RATE_LIMIT_BUCKETS } from '../utils/market.constants';

// Custom key generator for rate limiting
const generateKey = (req: Request): string => {
  const userId = req.user?._id || req.ip;
  const route = req.route?.path || req.path;
  return `${userId}:${route}`;
};

// Custom skip function for authenticated users
const skipSuccessfulRequests = false; // Simplified for now

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  const userId = req.user?._id || 'anonymous';
  const ip = req.ip;
  const route = req.route?.path || req.path;
  
  logger.warn('Rate limit exceeded', {
    userId,
    ip,
    route,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: 60 // Simplified for now
  });
};

// Messaging rate limiter (60 messages per minute)
export const messagingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMITS.MESSAGING,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent, please slow down'
  }
});

// Offers rate limiter (10 offers per minute)
export const offersRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMITS.OFFERS,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many offers sent, please slow down'
  }
});

// Uploads rate limiter (20 uploads per minute)
export const uploadsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMITS.UPLOADS,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many uploads, please slow down'
  }
});

// Auth rate limiter (100 requests per 15 minutes)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: RATE_LIMITS.AUTH,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

// Strict rate limiter for sensitive operations (5 requests per minute)
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this sensitive operation, please slow down'
  }
});

// Order creation rate limiter (10 orders per hour)
export const orderCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many orders created, please slow down'
  }
});

// Review creation rate limiter (5 reviews per hour)
export const reviewCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many reviews created, please slow down'
  }
});

// Dispute creation rate limiter (3 disputes per day)
export const disputeCreationRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many disputes created, please contact support'
  }
});

// Search rate limiter (100 searches per minute)
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many search requests, please slow down'
  }
});

// Admin operations rate limiter (50 requests per minute)
export const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  keyGenerator: generateKey,
  skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin operations, please slow down'
  }
});

// Dynamic rate limiter factory
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    keyGenerator: generateKey,
    skipSuccessfulRequests: options.skipSuccessfulRequests || skipSuccessfulRequests,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message || 'Rate limit exceeded, please try again later'
    }
  });
};

// Rate limit status middleware
export const rateLimitStatus = (req: Request, res: Response, next: any) => {
  const rateLimitInfo = {
    limit: 100, // Default limit
    remaining: 99, // Default remaining
    reset: Date.now() + 60000, // Default reset time
    retryAfter: 60 // Default retry after
  };

  res.set({
    'X-RateLimit-Limit': rateLimitInfo.limit?.toString(),
    'X-RateLimit-Remaining': rateLimitInfo.remaining?.toString(),
    'X-RateLimit-Reset': rateLimitInfo.reset?.toString(),
    'X-RateLimit-Retry-After': rateLimitInfo.retryAfter.toString()
  });

  next();
};
