import express from 'express';
import { logger } from '../../../../utils/logger';

// Import all marketplace route modules
import sellerRoutes from './market.seller.routes';
import shopRoutes from './market.shop.routes';
import productRoutes from './market.product.routes';
import serviceRoutes from './market.service.routes';
import offerRoutes from './market.offer.routes';
import orderRoutes from './market.order.routes';
import messageRoutes from './market.message.routes';
import threadRoutes from './market.thread.routes';
import deliveryRoutes from './market.delivery.routes';
import reviewRoutes from './market.review.routes';
import disputeRoutes from './market.dispute.routes';
import categoryRoutes from './market.category.routes';
import assetRoutes from './market.asset.routes';
import payoutRoutes from './market.payout.routes';

// Import rate limiting middleware
import {
  messagingRateLimit,
  offersRateLimit,
  uploadsRateLimit,
  authRateLimit,
  strictRateLimit,
  orderCreationRateLimit,
  reviewCreationRateLimit,
  disputeCreationRateLimit,
  searchRateLimit,
  adminRateLimit,
  rateLimitStatus
} from '../middleware/market.rate-limit';

const router = express.Router();

// Apply rate limiting middleware to all routes
router.use(rateLimitStatus);

// Log all marketplace requests
router.use((req, res, next) => {
  logger.info('Marketplace request', {
    method: req.method,
    path: req.path,
    userId: req.user?._id || 'anonymous',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Mount all marketplace routes with appropriate rate limiting

// Seller routes (auth rate limiting)
router.use('/seller', authRateLimit, sellerRoutes);

// Shop routes (search rate limiting for public routes)
router.use('/shop', searchRateLimit, shopRoutes);

// Product routes (search rate limiting for public routes)
router.use('/products', searchRateLimit, productRoutes);

// Service routes (search rate limiting for public routes)
router.use('/services', searchRateLimit, serviceRoutes);

// Offer routes (offers rate limiting)
router.use('/offers', offersRateLimit, offerRoutes);

// Order routes (order creation rate limiting)
router.use('/orders', orderCreationRateLimit, orderRoutes);

// Message routes (messaging rate limiting)
router.use('/messages', messagingRateLimit, messageRoutes);

// Thread routes (messaging rate limiting)
router.use('/threads', messagingRateLimit, threadRoutes);

// Delivery routes (strict rate limiting)
router.use('/deliveries', strictRateLimit, deliveryRoutes);

// Review routes (review creation rate limiting)
router.use('/reviews', reviewCreationRateLimit, reviewRoutes);

// Dispute routes (dispute creation rate limiting)
router.use('/disputes', disputeCreationRateLimit, disputeRoutes);

// Category routes (admin rate limiting for admin operations)
router.use('/categories', categoryRoutes);

// Asset routes (uploads rate limiting)
router.use('/assets', uploadsRateLimit, assetRoutes);

// Payout routes (strict rate limiting)
router.use('/payouts', strictRateLimit, payoutRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Marketplace API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler for marketplace routes
router.use('*', (req, res) => {
  logger.warn('Marketplace route not found', {
    method: req.method,
    path: req.originalUrl,
    userId: req.user?._id || 'anonymous',
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: 'Marketplace route not found',
    availableRoutes: [
      '/seller',
      '/shop',
      '/products',
      '/services',
      '/offers',
      '/orders',
      '/messages',
      '/threads',
      '/deliveries',
      '/reviews',
      '/disputes',
      '/categories',
      '/assets',
      '/payouts',
      '/health'
    ]
  });
});

export default router;
