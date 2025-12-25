import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorHandler';
import P2PMerchantProfileModel from '../../models/p2p/p2pMerchantProfile.model';
import P2POfferModel from '../../models/p2p/p2pOffer.model';
import UserModel from '../../models/user.mode';

// Get or create merchant profile
export const getMerchantProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      let profile = await P2PMerchantProfileModel.findOne({ userId });

      if (!profile) {
        // Create default profile
        const user = await UserModel.findById(userId);
        profile = await P2PMerchantProfileModel.create({
          userId,
          displayName: user?.name || user?.email || 'Merchant',
          paymentMethods: ['Easypaisa', 'JazzCash'],
          timeLimitMinutes: 15,
          terms: 'Fast response. Please pay within time window and share transaction reference.',
          isActive: true,
        });
      }

      res.status(200).json({
        success: true,
        profile,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update merchant profile
export const updateMerchantProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { displayName, paymentMethods, paymentMethodDetails, timeLimitMinutes, terms } = req.body;

      // Validation
      if (displayName && (displayName.trim().length < 2 || displayName.length > 40)) {
        return next(new ErrorHandler('Display name must be between 2 and 40 characters', 400));
      }

      if (paymentMethods && (!Array.isArray(paymentMethods) || paymentMethods.length === 0)) {
        return next(new ErrorHandler('At least one payment method is required', 400));
      }

      // Validate payment method details
      if (paymentMethods && paymentMethodDetails) {
        // Ensure each selected payment method has details
        for (const method of paymentMethods) {
          const details = paymentMethodDetails.find((d: any) => d.method === method);
          if (!details) {
            return next(
              new ErrorHandler(`Payment details are required for ${method}`, 400)
            );
          }

          // Validate required fields based on payment method
          if (method === 'Easypaisa' || method === 'JazzCash') {
            if (!details.phoneNumber || !details.accountHolderName) {
              return next(
                new ErrorHandler(`${method} requires phone number and account holder name`, 400)
              );
            }
          } else if (method === 'Bank Transfer') {
            if (!details.accountNumber || !details.accountHolderName || !details.bankName) {
              return next(
                new ErrorHandler('Bank Transfer requires account number, account holder name, and bank name', 400)
              );
            }
          } else if (method === 'Wise') {
            if (!details.email || !details.accountHolderName) {
              return next(
                new ErrorHandler('Wise requires email and account holder name', 400)
              );
            }
          } else if (method === 'PayPal') {
            if (!details.email || !details.accountHolderName) {
              return next(
                new ErrorHandler('PayPal requires email and account holder name', 400)
              );
            }
          } else if (method === 'Revolut') {
            if (!details.email || !details.phoneNumber) {
              return next(
                new ErrorHandler('Revolut requires email and phone number', 400)
              );
            }
          }
        }
      }

      if (timeLimitMinutes && (timeLimitMinutes < 5 || timeLimitMinutes > 60)) {
        return next(new ErrorHandler('Time limit must be between 5 and 60 minutes', 400));
      }

      if (terms && terms.length > 500) {
        return next(new ErrorHandler('Terms cannot exceed 500 characters', 400));
      }

      let profile = await P2PMerchantProfileModel.findOne({ userId });

      if (!profile) {
        // Create new profile
        profile = await P2PMerchantProfileModel.create({
          userId,
          displayName: displayName || 'Merchant',
          paymentMethods: paymentMethods || ['Easypaisa', 'JazzCash'],
          timeLimitMinutes: timeLimitMinutes || 15,
          terms: terms || '',
          isActive: true,
        });
      } else {
        // Update existing profile
        if (displayName) profile.displayName = displayName.trim();
        if (paymentMethods) profile.paymentMethods = paymentMethods;
        if (paymentMethodDetails) profile.paymentMethodDetails = paymentMethodDetails;
        if (timeLimitMinutes) profile.timeLimitMinutes = timeLimitMinutes;
        if (terms !== undefined) profile.terms = terms;
        await profile.save();
      }

      res.status(200).json({
        success: true,
        message: 'Merchant profile updated successfully',
        profile,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get merchant's ads
export const getMyAds = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const ads = await P2POfferModel.find({ traderId: userId })
        .sort({ createdAt: -1 })
        .populate('traderId', 'name email avatar');

      res.status(200).json({
        success: true,
        ads,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Create P2P ad
export const createP2PAd = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { asset, side, price, available, minLimit, maxLimit } = req.body;

      // Validation
      if (!asset || !side || !price || !available || !minLimit || !maxLimit) {
        return next(new ErrorHandler('All fields are required', 400));
      }

      if (side !== 'buy' && side !== 'sell') {
        return next(new ErrorHandler('Side must be either "buy" or "sell"', 400));
      }

      if (price <= 0 || available <= 0 || minLimit <= 0 || maxLimit <= 0) {
        return next(new ErrorHandler('All numeric values must be positive', 400));
      }

      if (maxLimit < minLimit) {
        return next(new ErrorHandler('Max limit must be greater than or equal to min limit', 400));
      }

      // Get merchant profile for payment methods and time limit
      const profile = await P2PMerchantProfileModel.findOne({ userId });
      if (!profile || !profile.isActive) {
        return next(
          new ErrorHandler('Please complete your merchant profile first', 400)
        );
      }

      // Create ad
      const ad = await P2POfferModel.create({
        traderId: userId,
        asset,
        side,
        price,
        available,
        minLimit,
        maxLimit,
        paymentMethods: profile.paymentMethods,
        timeLimit: profile.timeLimitMinutes,
        isActive: true,
        isOnline: true,
        completedTrades: 0,
        completionRate: 100,
        responseRate: 100,
        responseTime: 15,
        traderRating: 5.0,
      });

      const populatedAd = await P2POfferModel.findById(ad._id).populate(
        'traderId',
        'firstName lastName username email avatar'
      );
      
      // Log the created ad for debugging
      console.log('✅ P2P Ad created successfully:', {
        id: ad._id,
        asset: ad.asset,
        side: ad.side,
        isActive: ad.isActive,
        isOnline: ad.isOnline,
        traderId: ad.traderId,
        price: ad.price,
        available: ad.available,
      });

      res.status(201).json({
        success: true,
        message: `${side === 'buy' ? 'Buy' : 'Sell'} ad created successfully`,
        ad: populatedAd,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update P2P ad
export const updateP2PAd = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { adId } = req.params;
      const { asset, side, price, available, minLimit, maxLimit } = req.body;

      const ad = await P2POfferModel.findById(adId);
      if (!ad) {
        return next(new ErrorHandler('Ad not found', 404));
      }

      // Check ownership
      if (ad.traderId.toString() !== userId.toString()) {
        return next(new ErrorHandler('You can only update your own ads', 403));
      }

      // Validation
      if (side && side !== 'buy' && side !== 'sell') {
        return next(new ErrorHandler('Side must be either "buy" or "sell"', 400));
      }

      if (price !== undefined && price <= 0) {
        return next(new ErrorHandler('Price must be positive', 400));
      }

      if (available !== undefined && available <= 0) {
        return next(new ErrorHandler('Available amount must be positive', 400));
      }

      if (minLimit !== undefined && minLimit <= 0) {
        return next(new ErrorHandler('Min limit must be positive', 400));
      }

      if (maxLimit !== undefined && maxLimit <= 0) {
        return next(new ErrorHandler('Max limit must be positive', 400));
      }

      if (minLimit !== undefined && maxLimit !== undefined && maxLimit < minLimit) {
        return next(new ErrorHandler('Max limit must be greater than or equal to min limit', 400));
      }

      // Update fields
      if (asset) ad.asset = asset;
      if (side) ad.side = side;
      if (price !== undefined) ad.price = price;
      if (available !== undefined) ad.available = available;
      if (minLimit !== undefined) ad.minLimit = minLimit;
      if (maxLimit !== undefined) ad.maxLimit = maxLimit;

      // Update payment methods and time limit from profile if changed
      const profile = await P2PMerchantProfileModel.findOne({ userId });
      if (profile) {
        ad.paymentMethods = profile.paymentMethods;
        ad.timeLimit = profile.timeLimitMinutes;
      }

      await ad.save();

      const populatedAd = await P2POfferModel.findById(ad._id).populate(
        'traderId',
        'name email avatar'
      );

      res.status(200).json({
        success: true,
        message: 'Ad updated successfully',
        ad: populatedAd,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Toggle ad online/offline status
export const toggleAdStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { adId } = req.params;

      const ad = await P2POfferModel.findById(adId);
      if (!ad) {
        return next(new ErrorHandler('Ad not found', 404));
      }

      // Check ownership
      if (ad.traderId.toString() !== userId.toString()) {
        return next(new ErrorHandler('You can only update your own ads', 403));
      }

      ad.isOnline = !ad.isOnline;
      await ad.save();

      res.status(200).json({
        success: true,
        message: `Ad ${ad.isOnline ? 'activated' : 'paused'} successfully`,
        ad,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete P2P ad
export const deleteP2PAd = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { adId } = req.params;

      const ad = await P2POfferModel.findById(adId);
      if (!ad) {
        return next(new ErrorHandler('Ad not found', 404));
      }

      // Check ownership
      if (ad.traderId.toString() !== userId.toString()) {
        return next(new ErrorHandler('You can only delete your own ads', 403));
      }

      await P2POfferModel.findByIdAndDelete(adId);

      res.status(200).json({
        success: true,
        message: 'Ad deleted successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Duplicate P2P ad
export const duplicateP2PAd = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { adId } = req.params;

      const originalAd = await P2POfferModel.findById(adId);
      if (!originalAd) {
        return next(new ErrorHandler('Ad not found', 404));
      }

      // Check ownership
      if (originalAd.traderId.toString() !== userId.toString()) {
        return next(new ErrorHandler('You can only duplicate your own ads', 403));
      }

      // Create duplicate (paused by default)
      const duplicatedAd = await P2POfferModel.create({
        traderId: userId,
        asset: originalAd.asset,
        side: originalAd.side,
        price: originalAd.price,
        available: originalAd.available,
        minLimit: originalAd.minLimit,
        maxLimit: originalAd.maxLimit,
        paymentMethods: originalAd.paymentMethods,
        timeLimit: originalAd.timeLimit,
        isActive: true,
        isOnline: false, // Start paused
        completedTrades: 0,
        completionRate: 100,
        responseRate: 100,
        responseTime: originalAd.responseTime,
        traderRating: originalAd.traderRating,
      });

      const populatedAd = await P2POfferModel.findById(duplicatedAd._id).populate(
        'traderId',
        'name email avatar'
      );

      res.status(201).json({
        success: true,
        message: 'Ad duplicated successfully (paused). Edit to activate.',
        ad: populatedAd,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get merchant profile by userId (public endpoint for buyers to see payment details)
export const getMerchantProfileByUserId = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return next(new ErrorHandler('User ID is required', 400));
      }

      const profile = await P2PMerchantProfileModel.findOne({ userId })
        .populate('userId', 'firstName lastName username email avatar');

      if (!profile) {
        return next(new ErrorHandler('Merchant profile not found', 404));
      }

      // Only return payment methods and their details (for security, don't expose all profile data)
      res.status(200).json({
        success: true,
        profile: {
          displayName: profile.displayName,
          paymentMethods: profile.paymentMethods,
          paymentMethodDetails: profile.paymentMethodDetails,
          timeLimitMinutes: profile.timeLimitMinutes,
          terms: profile.terms,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

