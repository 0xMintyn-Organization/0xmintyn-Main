import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../../../../middleware/catchAsyncError';
import ErrorHandler from '../../../../utils/errorHandler';
import { logger } from '../../../../utils/logger';

// User interface is already declared globally

/**
 * Require seller or admin role
 */
export const requireSellerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      logger.error('Authentication required for seller/admin access', {
        route: req.route?.path,
        method: req.method,
        ip: req.ip
      });
      return next(new ErrorHandler('Authentication required', 401));
    }

    const { role } = req.user;
    if (!['seller', 'admin'].includes(role)) {
      logger.warn('Insufficient permissions for seller/admin access', {
        userId: req.user._id,
        role,
        route: req.route?.path,
        method: req.method
      });
      return next(new ErrorHandler('Access denied. Seller or admin role required', 403));
    }

    logger.info('Seller/admin access granted', {
      userId: req.user._id,
      role,
      route: req.route?.path
    });

    next();
  } catch (error: any) {
    logger.error('Error in requireSellerOrAdmin middleware', {
      error: error.message,
      route: req.route?.path,
      method: req.method
    });
    next(new ErrorHandler('Authorization error', 500));
  }
};

/**
 * Check if user owns the shop
 */
export const checkShopOwner = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shopId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      // Admin can access any shop
      if (userRole === 'admin') {
        logger.info('Admin accessing shop', {
          adminId: userId,
          shopId,
          route: req.route?.path
        });
        return next();
      }

      // Import shop model dynamically to avoid circular dependencies
      const { default: ShopModel } = await import('../models/market.shop.model');
      
      const shop = await ShopModel.findById(shopId);
      if (!shop) {
        logger.warn('Shop not found', {
          userId,
          shopId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Shop not found', 404));
      }

      if (shop.ownerId.toString() !== userId) {
        logger.warn('Unauthorized shop access attempt', {
          userId,
          shopId,
          ownerId: shop.ownerId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Access denied. You can only access your own shop', 403));
      }

      logger.info('Shop owner access granted', {
        userId,
        shopId,
        route: req.route?.path
      });

      next();
    } catch (error: any) {
      logger.error('Error in checkShopOwner middleware', {
        error: error.message,
        userId: req.user?._id,
        shopId: req.params.shopId,
        route: req.route?.path
      });
      next(new ErrorHandler('Authorization error', 500));
    }
  }
);

/**
 * Check if user has access to the order
 */
export const checkOrderAccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      // Admin can access any order
      if (userRole === 'admin') {
        logger.info('Admin accessing order', {
          adminId: userId,
          orderId,
          route: req.route?.path
        });
        return next();
      }

      // Import order model dynamically to avoid circular dependencies
      const { default: OrderModel } = await import('../models/market.order.model');
      
      const order = await OrderModel.findById(orderId);
      if (!order) {
        logger.warn('Order not found', {
          userId,
          orderId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Order not found', 404));
      }

      // Check if user is buyer or seller
      const isBuyer = order.buyerId.toString() === userId;
      const isSeller = order.sellerId.toString() === userId;

      if (!isBuyer && !isSeller) {
        logger.warn('Unauthorized order access attempt', {
          userId,
          orderId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Access denied. You can only access your own orders', 403));
      }

      logger.info('Order access granted', {
        userId,
        orderId,
        accessType: isBuyer ? 'buyer' : 'seller',
        route: req.route?.path
      });

      next();
    } catch (error: any) {
      logger.error('Error in checkOrderAccess middleware', {
        error: error.message,
        userId: req.user?._id,
        orderId: req.params.orderId,
        route: req.route?.path
      });
      next(new ErrorHandler('Authorization error', 500));
    }
  }
);

/**
 * Check if user has access to the thread
 */
export const checkThreadAccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { threadId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      // Admin can access any thread
      if (userRole === 'admin') {
        logger.info('Admin accessing thread', {
          adminId: userId,
          threadId,
          route: req.route?.path
        });
        return next();
      }

      // Import thread model dynamically to avoid circular dependencies
      const { default: ThreadModel } = await import('../models/market.thread.model');
      
      const thread = await ThreadModel.findById(threadId);
      if (!thread) {
        logger.warn('Thread not found', {
          userId,
          threadId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Thread not found', 404));
      }

      // Check if user is a participant
      const isParticipant = thread.participants.some(
        participantId => participantId.toString() === userId
      );

      if (!isParticipant) {
        logger.warn('Unauthorized thread access attempt', {
          userId,
          threadId,
          participants: thread.participants,
          route: req.route?.path
        });
        return next(new ErrorHandler('Access denied. You can only access threads you participate in', 403));
      }

      logger.info('Thread access granted', {
        userId,
        threadId,
        route: req.route?.path
      });

      next();
    } catch (error: any) {
      logger.error('Error in checkThreadAccess middleware', {
        error: error.message,
        userId: req.user?._id,
        threadId: req.params.threadId,
        route: req.route?.path
      });
      next(new ErrorHandler('Authorization error', 500));
    }
  }
);

/**
 * Check if user can access the asset
 */
export const checkAssetAccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      // Admin can access any asset
      if (userRole === 'admin') {
        logger.info('Admin accessing asset', {
          adminId: userId,
          assetId,
          route: req.route?.path
        });
        return next();
      }

      // Import asset model dynamically to avoid circular dependencies
      const { default: AssetModel } = await import('../models/market.asset.model');
      
      const asset = await AssetModel.findById(assetId);
      if (!asset) {
        logger.warn('Asset not found', {
          userId,
          assetId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Asset not found', 404));
      }

      // Check if user owns the asset
      if (asset.ownerId.toString() !== userId) {
        logger.warn('Unauthorized asset access attempt', {
          userId,
          assetId,
          ownerId: asset.ownerId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Access denied. You can only access your own assets', 403));
      }

      logger.info('Asset access granted', {
        userId,
        assetId,
        route: req.route?.path
      });

      next();
    } catch (error: any) {
      logger.error('Error in checkAssetAccess middleware', {
        error: error.message,
        userId: req.user?._id,
        assetId: req.params.assetId,
        route: req.route?.path
      });
      next(new ErrorHandler('Authorization error', 500));
    }
  }
);

/**
 * Check if user can access the offer
 */
export const checkOfferAccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { offerId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      // Admin can access any offer
      if (userRole === 'admin') {
        logger.info('Admin accessing offer', {
          adminId: userId,
          offerId,
          route: req.route?.path
        });
        return next();
      }

      // Import offer model dynamically to avoid circular dependencies
      const { default: OfferModel } = await import('../models/market.offer.model');
      
      const offer = await OfferModel.findById(offerId);
      if (!offer) {
        logger.warn('Offer not found', {
          userId,
          offerId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Offer not found', 404));
      }

      // Check if user is sender or recipient
      const isSender = offer.fromSellerId.toString() === userId;
      const isRecipient = offer.toUserId.toString() === userId;

      if (!isSender && !isRecipient) {
        logger.warn('Unauthorized offer access attempt', {
          userId,
          offerId,
          fromSellerId: offer.fromSellerId,
          toUserId: offer.toUserId,
          route: req.route?.path
        });
        return next(new ErrorHandler('Access denied. You can only access your own offers', 403));
      }

      logger.info('Offer access granted', {
        userId,
        offerId,
        accessType: isSender ? 'sender' : 'recipient',
        route: req.route?.path
      });

      next();
    } catch (error: any) {
      logger.error('Error in checkOfferAccess middleware', {
        error: error.message,
        userId: req.user?._id,
        offerId: req.params.offerId,
        route: req.route?.path
      });
      next(new ErrorHandler('Authorization error', 500));
    }
  }
);
