import { Request, Response, NextFunction } from "express";
import ReviewModel from "../models/review.model";
import OrderModel from "../models/order.model";
// Import mongoose for ObjectId
import mongoose from "mongoose";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { CourseModel } from "../models/course.model";


// Get all reviews for a course
export const getCourseReviews = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get reviews with pagination
      const reviews = await ReviewModel.find({ courseId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const totalReviews = await ReviewModel.countDocuments({ courseId });

      // Calculate rating statistics
      const ratingStats = await ReviewModel.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: "$rating"
            }
          }
        }
      ]);

      // Calculate rating distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      if (ratingStats.length > 0 && ratingStats[0].ratingDistribution) {
        ratingStats[0].ratingDistribution.forEach((rating: number) => {
          distribution[rating as keyof typeof distribution]++;
        });
      }

      const stats = ratingStats[0] || {
        averageRating: 0,
        totalReviews: 0
      };

      res.status(200).json({
        success: true,
        reviews,
        stats: {
          averageRating: Math.round(stats.averageRating * 10) / 10,
          totalReviews: stats.totalReviews,
          distribution
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNextPage: page < Math.ceil(totalReviews / limit),
          hasPrevPage: page > 1
        }
      });

    } catch (error: any) {
      console.error("Get Course Reviews Error:", error);
      return next(new ErrorHandler(error.message || "Failed to fetch reviews", 500));
    }
  }
);

// Create a new review
export const createReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, rating, comment } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if course exists
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Check if user has purchased the course
      const enrollment = await OrderModel.findOne({
        userId,
        courseId,
        status: "completed"
      });

      if (!enrollment) {
        return next(new ErrorHandler("You must purchase this course before writing a review", 403));
      }

      // Check if user has already reviewed this course
      const existingReview = await ReviewModel.findOne({ userId, courseId });
      if (existingReview) {
        return next(new ErrorHandler("You have already reviewed this course", 400));
      }

      // Create review
      const review = await ReviewModel.create({
        userId,
        courseId,
        rating,
        comment,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userAvatar: req.user.avatar?.url || req.user.avatar,
        isVerified: true
      });

      // Update course rating statistics
      await updateCourseRatingStats(courseId);

      res.status(201).json({
        success: true,
        message: "Review created successfully",
        review
      });

    } catch (error: any) {
      console.error("Create Review Error:", error);
      return next(new ErrorHandler(error.message || "Failed to create review", 500));
    }
  }
);

// Update a review
export const updateReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Find the review
      const review = await ReviewModel.findOne({ _id: reviewId, userId });
      if (!review) {
        return next(new ErrorHandler("Review not found or you don't have permission to update it", 404));
      }

      // Update the review
      review.rating = rating;
      review.comment = comment;
      await review.save();

      // Update course rating statistics
      await updateCourseRatingStats(review.courseId);

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review
      });

    } catch (error: any) {
      console.error("Update Review Error:", error);
      return next(new ErrorHandler(error.message || "Failed to update review", 500));
    }
  }
);

// Delete a review
export const deleteReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Find the review
      const review = await ReviewModel.findOne({ _id: reviewId, userId });
      if (!review) {
        return next(new ErrorHandler("Review not found or you don't have permission to delete it", 404));
      }

      const courseId = review.courseId;

      // Delete the review
      await ReviewModel.findByIdAndDelete(reviewId);

      // Update course rating statistics
      await updateCourseRatingStats(courseId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully"
      });

    } catch (error: any) {
      console.error("Delete Review Error:", error);
      return next(new ErrorHandler(error.message || "Failed to delete review", 500));
    }
  }
);

// Check if user can review a course
export const canUserReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if user has purchased the course
      const enrollment = await OrderModel.findOne({
        userId,
        courseId,
        status: "completed"
      });

      // Check if user has already reviewed this course
      const existingReview = await ReviewModel.findOne({ userId, courseId });

      res.status(200).json({
        success: true,
        canReview: !!enrollment && !existingReview,
        hasPurchased: !!enrollment,
        hasReviewed: !!existingReview,
        existingReview: existingReview || null
      });

    } catch (error: any) {
      console.error("Can User Review Error:", error);
      return next(new ErrorHandler(error.message || "Failed to check review eligibility", 500));
    }
  }
);

// Helper function to update course rating statistics
async function updateCourseRatingStats(courseId: string) {
  try {
    const stats = await ReviewModel.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await CourseModel.findByIdAndUpdate(courseId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews
      });
    }
  } catch (error) {
    console.error("Error updating course rating stats:", error);
  }
}


