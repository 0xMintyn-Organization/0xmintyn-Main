import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { BookmarkModel } from "../models/bookmark.model";
import { CourseModel } from "../models/course.model";

// Add bookmark
export const addBookmark = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      if (!courseId) {
        return next(new ErrorHandler("Course ID is required", 400));
      }

      // Check if course exists
      const course = await CourseModel.findById(courseId).populate("createdBy", "firstName lastName");
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Check if already bookmarked
      const existingBookmark = await BookmarkModel.findOne({
        userId: userId,
        courseId: courseId
      });

      if (existingBookmark) {
        return next(new ErrorHandler("Course already bookmarked", 400));
      }

      // Create bookmark
      const bookmark = await BookmarkModel.create({
        userId: userId,
        courseId: courseId,
        courseName: course.name,
        courseDescription: course.description || "No description available",
        courseThumbnail: course.thumbnail?.url || course.thumbnail || "https://via.placeholder.com/300x200?text=No+Image",
        instructorName: `${course.createdBy.firstName} ${course.createdBy.lastName}`,
        coursePrice: course.price || 0,
        courseCategory: course.category || "General",
        courseLevel: course.level || "Beginner",
        courseDuration: course.duration || "0 hours"
      });

      res.status(201).json({
        success: true,
        message: "Course bookmarked successfully",
        bookmark
      });

    } catch (error: any) {
      console.error("Add Bookmark Error:", error);
      return next(new ErrorHandler("Failed to add bookmark", 500));
    }
  }
);

// Remove bookmark
export const removeBookmark = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const bookmark = await BookmarkModel.findOneAndDelete({
        userId: userId,
        courseId: courseId
      });

      if (!bookmark) {
        return next(new ErrorHandler("Bookmark not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Bookmark removed successfully"
      });

    } catch (error: any) {
      console.error("Remove Bookmark Error:", error);
      return next(new ErrorHandler("Failed to remove bookmark", 500));
    }
  }
);

// Get user bookmarks
export const getUserBookmarks = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const bookmarks = await BookmarkModel.find({ userId: userId })
        .sort({ createdAt: -1 });

      // Group bookmarks by category
      const categorizedBookmarks = bookmarks.reduce((acc: any, bookmark) => {
        const category = bookmark.courseCategory || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(bookmark);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        bookmarks,
        categorizedBookmarks,
        totalBookmarks: bookmarks.length
      });

    } catch (error: any) {
      console.error("Get User Bookmarks Error:", error);
      return next(new ErrorHandler("Failed to get bookmarks", 500));
    }
  }
);

// Check if course is bookmarked
export const checkBookmarkStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const bookmark = await BookmarkModel.findOne({
        userId: userId,
        courseId: courseId
      });

      res.status(200).json({
        success: true,
        isBookmarked: !!bookmark
      });

    } catch (error: any) {
      console.error("Check Bookmark Status Error:", error);
      return next(new ErrorHandler("Failed to check bookmark status", 500));
    }
  }
);

// Get bookmark count
export const getBookmarkCount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const count = await BookmarkModel.countDocuments({ userId: userId });

      res.status(200).json({
        success: true,
        count
      });

    } catch (error: any) {
      console.error("Get Bookmark Count Error:", error);
      return next(new ErrorHandler("Failed to get bookmark count", 500));
    }
  }
);
