import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorHandler';
import P2POfferModel from '../../models/p2p/p2pOffer.model';
import UserModel from '../../models/user.mode';
import { logger } from '../../utils/logger';

// Get all active P2P offers (for public P2P market)
export const getAllP2POffers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { asset, side, minPrice, maxPrice, paymentMethod } = req.query;

      // Build query
      const query: any = {
        isActive: true,
        isOnline: true,
      };

      if (asset) {
        query.asset = asset;
      }

      if (side && (side === 'buy' || side === 'sell')) {
        query.side = side;
      }

      if (minPrice) {
        query.price = { ...query.price, $gte: Number(minPrice) };
      }

      if (maxPrice) {
        query.price = { ...query.price, ...(query.price ? {} : {}), $lte: Number(maxPrice) };
      }

      if (minPrice && maxPrice) {
        query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
      } else if (minPrice) {
        query.price = { $gte: Number(minPrice) };
      } else if (maxPrice) {
        query.price = { $lte: Number(maxPrice) };
      }

      if (paymentMethod) {
        query.paymentMethods = { $in: [paymentMethod] };
      }

      // Debug logging to help diagnose visibility issues
      logger.info('🔍 P2P Offers Query:', JSON.stringify(query, null, 2));
      
      // First, let's check total offers in DB
      const totalOffers = await P2POfferModel.countDocuments({});
      logger.info(`📊 Total offers in database: ${totalOffers}`);
      
      // Check offers matching asset (any side)
      if (asset) {
        const assetOffers = await P2POfferModel.countDocuments({ asset, isActive: true });
        logger.info(`📊 Offers for asset ${asset} (any side, active): ${assetOffers}`);
      }
      
      // Check offers matching side (any asset)
      if (side) {
        const sideOffers = await P2POfferModel.countDocuments({ side, isActive: true, isOnline: true });
        logger.info(`📊 Offers for side ${side} (any asset, active, online): ${sideOffers}`);
      }
      
      const offers = await P2POfferModel.find(query)
        .populate('traderId', 'firstName lastName username email avatar isVerified kycStatus')
        .sort({ createdAt: -1 })
        .limit(100); // Limit to prevent overload

      logger.info(`✅ Found ${offers.length} offers matching query for asset: ${asset}, side: ${side}`);
      
      // Log sample of offers for debugging
      if (offers.length > 0) {
        logger.info(`📋 Sample offer: ${JSON.stringify({
          id: offers[0]._id,
          asset: offers[0].asset,
          side: offers[0].side,
          isActive: offers[0].isActive,
          isOnline: offers[0].isOnline,
          traderId: offers[0].traderId,
        }, null, 2)}`);
      } else {
        logger.warn(`⚠️ No offers found matching query. Checking all active offers...`);
        const allActive = await P2POfferModel.find({ isActive: true, isOnline: true }).limit(5);
        logger.info(`📋 Sample of all active offers: ${allActive.map(o => ({
          id: o._id,
          asset: o.asset,
          side: o.side,
          isActive: o.isActive,
          isOnline: o.isOnline,
        }))}`);
      }

      // Transform to match frontend format
      const transformedOffers = offers.map((offer) => {
        const trader = offer.traderId as any;
        // User model has firstName, lastName, username - not "name"
        const traderName = trader 
          ? (trader.firstName && trader.lastName 
              ? `${trader.firstName} ${trader.lastName}`.trim()
              : trader.username || trader.email || 'Trader')
          : 'Trader';
        
        return {
          id: offer._id.toString(),
          traderName,
          traderId: trader?._id?.toString() || trader?.id || '',
          traderRating: offer.traderRating || 0,
          completedTrades: offer.completedTrades || 0,
          completionRate: offer.completionRate || 0,
          responseRate: offer.responseRate || 0,
          responseTime: offer.responseTime || 15,
          price: offer.price,
          available: offer.available,
          minLimit: offer.minLimit,
          maxLimit: offer.maxLimit,
          paymentMethods: offer.paymentMethods,
          side: offer.side,
          timeLimit: offer.timeLimit,
          isVerified: trader?.isVerified || false,
          isOnline: offer.isOnline,
          requiresVerification: false,
          asset: offer.asset,
          createdAt: offer.createdAt?.toISOString(),
        };
      });

      res.status(200).json({
        success: true,
        offers: transformedOffers,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get single P2P offer by ID
export const getP2POfferById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { offerId } = req.params;

      const offer = await P2POfferModel.findOne({
        _id: offerId,
        isActive: true,
      }).populate('traderId', 'firstName lastName username email avatar isVerified kycStatus');

      if (!offer) {
        return next(new ErrorHandler('Offer not found', 404));
      }

      const trader = offer.traderId as any;
      const traderName = trader 
        ? (trader.firstName && trader.lastName 
            ? `${trader.firstName} ${trader.lastName}`.trim()
            : trader.username || trader.email || 'Trader')
        : 'Trader';
      
      const transformedOffer = {
        id: offer._id.toString(),
        traderName,
        traderId: trader?._id?.toString() || trader?.id || '',
        traderRating: offer.traderRating || 0,
        completedTrades: offer.completedTrades || 0,
        completionRate: offer.completionRate || 0,
        responseRate: offer.responseRate || 0,
        responseTime: offer.responseTime || 15,
        price: offer.price,
        available: offer.available,
        minLimit: offer.minLimit,
        maxLimit: offer.maxLimit,
        paymentMethods: offer.paymentMethods,
        side: offer.side,
        timeLimit: offer.timeLimit,
        isVerified: trader?.isVerified || false,
        isOnline: offer.isOnline,
        requiresVerification: false,
        asset: offer.asset,
        createdAt: offer.createdAt?.toISOString(),
      };

      res.status(200).json({
        success: true,
        offer: transformedOffer,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

