import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
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

    // Check if seller exists
    const sellerId = (order.sellerId as any)?._id || order.sellerId;
    
    const seller = await MarketplaceSellerModel.findById(sellerId);
    if (!seller) {
      return res.status(200).json({
        success: true,
        hasReviewed: false,
        canReview: order.orderStatus === 'completed'
      });
    }

    // Check if user already reviewed this order
    const existingReview = seller.reviews?.find(
      r => r.orderId?.toString() === orderId && r.buyerId.toString() === userId.toString()
    );

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
    const seller = await MarketplaceSellerModel.findById(sellerId);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    // Check if user already reviewed this order
    const existingReview = seller.reviews?.find(r => r.orderId?.toString() === orderId);
    if (existingReview) {
      return next(new ErrorHandler("You have already reviewed this order", 400));
    }

    // Add review to seller's reviews array
    const newReview = {
      orderId: new mongoose.Types.ObjectId(orderId),
      buyerId: userId,
      rating,
      review: review.trim(),
      createdAt: new Date()
    };

    // Update seller with new review
    const updatedSeller = await MarketplaceSellerModel.findByIdAndUpdate(
      sellerId,
      {
        $push: { reviews: newReview },
        $inc: { reviewCount: 1 }
      },
      { new: true }
    );

    if (!updatedSeller) {
      return next(new ErrorHandler("Failed to add review", 500));
    }

    // Calculate new average rating
    const totalRating = updatedSeller.reviews?.reduce((sum, r) => sum + r.rating, 0) || 0;
    const avgRating = updatedSeller.reviews && updatedSeller.reviews.length > 0
      ? totalRating / updatedSeller.reviews.length
      : 0;

    // Update seller rating
    await MarketplaceSellerModel.findByIdAndUpdate(
      sellerId,
      { rating: avgRating }
    );

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

    const seller = await MarketplaceSellerModel.findById(sellerId)
      .populate({
        path: 'reviews.buyerId',
        select: 'firstName lastName avatar'
      });

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    // Paginate reviews
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedReviews = seller.reviews?.slice(startIndex, endIndex) || [];

    res.status(200).json({
      success: true,
      reviews: paginatedReviews,
      totalReviews: seller.reviews?.length || 0,
      averageRating: seller.rating,
      currentPage: Number(page),
      totalPages: Math.ceil((seller.reviews?.length || 0) / Number(limit))
    });

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});
