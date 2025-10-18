import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceReviewModel } from "../../models/marketplace/MarketplaceReview.model";
import mongoose from "mongoose";

// Interface for review
interface IReview {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

// Check if user has already reviewed an order
export const checkUserReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      isActive: true
    }).populate('sellerId');

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Check if user already reviewed this order
    const existingReview = await MarketplaceReviewModel.findOne({
      orderId: orderId,
      buyerId: userId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      hasReviewed: !!existingReview,
      canReview: order.orderStatus === 'completed' && !existingReview,
      review: existingReview || null
    });

  } catch (error: any) {
    console.error('Error checking user review:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Create a new review
export const createReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, sellerId, rating, review } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Validate required fields
    if (!orderId || !sellerId || !rating || !review) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      orderStatus: 'completed',
      isActive: true
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or not completed", 404));
    }

    // Check if review already exists for this order
    const existingReview = await MarketplaceReviewModel.findOne({
      orderId: orderId,
      buyerId: userId,
      isActive: true
    });

    if (existingReview) {
      return next(new ErrorHandler("You have already reviewed this order", 400));
    }

    // Create new review
    const newReview = await MarketplaceReviewModel.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      buyerId: userId,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      serviceId: order.serviceId ? new mongoose.Types.ObjectId(order.serviceId) : undefined,
      productId: order.productId ? new mongoose.Types.ObjectId(order.productId) : undefined,
      rating,
      review: review.trim()
    });

    // Update seller's overall rating and review count
    const sellerReviews = await MarketplaceReviewModel.find({
      sellerId: sellerId,
      isActive: true
    });

    const sellerTotalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
    const sellerAvgRating = sellerReviews.length > 0 ? sellerTotalRating / sellerReviews.length : 0;

    await MarketplaceSellerModel.findByIdAndUpdate(
      sellerId,
      { 
        rating: sellerAvgRating,
        reviewCount: sellerReviews.length
      }
    );

    // Update service rating if applicable
    if (order.serviceId) {
      const serviceReviews = await MarketplaceReviewModel.find({
        serviceId: order.serviceId,
        isActive: true
      });

      const serviceTotalRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0);
      const serviceAvgRating = serviceReviews.length > 0 ? serviceTotalRating / serviceReviews.length : 0;

      await MarketplaceServiceModel.findByIdAndUpdate(
        order.serviceId,
        { 
          rating: serviceAvgRating,
          reviewCount: serviceReviews.length
        }
      );
    }

    // Update product rating if applicable
    if (order.productId) {
      const productReviews = await MarketplaceReviewModel.find({
        productId: order.productId,
        isActive: true
      });

      const productTotalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const productAvgRating = productReviews.length > 0 ? productTotalRating / productReviews.length : 0;

      await MarketplaceProductModel.findByIdAndUpdate(
        order.productId,
        { 
          rating: productAvgRating,
          reviewCount: productReviews.length
        }
      );
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newReview
    });

  } catch (error: any) {
    console.error('Error creating review:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get seller reviews
export const getSellerReviews = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const seller = await MarketplaceSellerModel.findById(sellerId);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    // Get reviews for this seller
    const reviews = await MarketplaceReviewModel.find({
      sellerId: sellerId,
      isActive: true
    })
    .populate({
      path: 'buyerId',
      select: 'firstName lastName avatar'
    })
    .populate({
      path: 'serviceId',
      select: 'title'
    })
    .populate({
      path: 'productId',
      select: 'title'
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

    const totalReviews = await MarketplaceReviewModel.countDocuments({
      sellerId: sellerId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      reviews: reviews,
      totalReviews: totalReviews,
      averageRating: seller.rating,
      currentPage: Number(page),
      totalPages: Math.ceil(totalReviews / Number(limit))
    });

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get service reviews
export const getServiceReviews = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const service = await MarketplaceServiceModel.findById(serviceId);
    if (!service) {
      return next(new ErrorHandler("Service not found", 404));
    }

    // Get reviews for this service
    const reviews = await MarketplaceReviewModel.find({
      serviceId: serviceId,
      isActive: true
    })
    .populate({
      path: 'buyerId',
      select: 'firstName lastName avatar'
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

    const totalReviews = await MarketplaceReviewModel.countDocuments({
      serviceId: serviceId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      reviews: reviews,
      totalReviews: totalReviews,
      averageRating: service.rating,
      currentPage: Number(page),
      totalPages: Math.ceil(totalReviews / Number(limit))
    });

  } catch (error: any) {
    console.error('Error fetching service reviews:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get product reviews
export const getProductReviews = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const product = await MarketplaceProductModel.findById(productId);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Get reviews for this product
    const reviews = await MarketplaceReviewModel.find({
      productId: productId,
      isActive: true
    })
    .populate({
      path: 'buyerId',
      select: 'firstName lastName avatar'
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

    const totalReviews = await MarketplaceReviewModel.countDocuments({
      productId: productId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      reviews: reviews,
      totalReviews: totalReviews,
      averageRating: product.rating,
      currentPage: Number(page),
      totalPages: Math.ceil(totalReviews / Number(limit))
    });

  } catch (error: any) {
    console.error('Error fetching product reviews:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});
