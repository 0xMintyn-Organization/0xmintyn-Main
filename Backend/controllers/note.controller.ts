import { Request, Response, NextFunction } from "express";
import NoteModel from "../models/note.model";
import OrderModel from "../models/order.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Get user's note for a course
export const getCourseNote = CatchAsyncError(
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

      if (!enrollment) {
        return next(new ErrorHandler("You must purchase this course to access notes", 403));
      }

      // Get the note
      const note = await NoteModel.findOne({ userId, courseId });

      res.status(200).json({
        success: true,
        note: note || null
      });

    } catch (error: any) {
      console.error("Get Course Note Error:", error);
      return next(new ErrorHandler(error.message || "Failed to fetch note", 500));
    }
  }
);

// Create or update user's note for a course
export const saveCourseNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, content } = req.body;
      const userId = req.user?._id;


      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      if (!content || content.trim().length === 0) {
        return next(new ErrorHandler("Note content cannot be empty", 400));
      }

      // Check if user has purchased the course
      const enrollment = await OrderModel.findOne({
        userId,
        courseId,
        status: "completed"
      });

      if (!enrollment) {
        return next(new ErrorHandler("You must purchase this course to save notes", 403));
      }

      // Create or update the note
      const note = await NoteModel.findOneAndUpdate(
        { userId, courseId },
        { content: content.trim() },
        { upsert: true, new: true, runValidators: true }
      );


      res.status(200).json({
        success: true,
        message: "Note saved successfully",
        note
      });

    } catch (error: any) {
      console.error("Save Course Note Error:", error);
      return next(new ErrorHandler(error.message || "Failed to save note", 500));
    }
  }
);

// Delete user's note for a course
export const deleteCourseNote = CatchAsyncError(
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

      if (!enrollment) {
        return next(new ErrorHandler("You must purchase this course to manage notes", 403));
      }

      // Delete the note
      const result = await NoteModel.findOneAndDelete({ userId, courseId });

      if (!result) {
        return next(new ErrorHandler("Note not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Note deleted successfully"
      });

    } catch (error: any) {
      console.error("Delete Course Note Error:", error);
      return next(new ErrorHandler(error.message || "Failed to delete note", 500));
    }
  }
);
