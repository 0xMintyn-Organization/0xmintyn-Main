import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.mode";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import ReviewModel from "../models/review.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Get instructor statistics
export const getInstructorStats = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { instructorId } = req.params;

            // Get instructor basic info
            const instructor = await UserModel.findById(instructorId).select('-password');
            if (!instructor) {
                return next(new ErrorHandler("Instructor not found", 404));
            }

            // Get instructor's courses
            const courses = await CourseModel.find({ createdBy: instructorId });
            const totalCourses = courses.length;

            // Get total students enrolled in instructor's courses
            const totalStudents = await OrderModel.countDocuments({
                courseId: { $in: courses.map(course => course._id) },
                status: 'completed'
            });

            // Get total reviews for instructor's courses
            const totalReviews = await ReviewModel.countDocuments({
                courseId: { $in: courses.map(course => course._id) }
            });

            // Calculate average rating
            const reviews = await ReviewModel.find({
                courseId: { $in: courses.map(course => course._id) }
            });
            const averageRating = reviews.length > 0 
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                : 0;

            // Get total revenue
            const orders = await OrderModel.find({
                courseId: { $in: courses.map(course => course._id) },
                status: 'completed'
            });
            const totalRevenue = orders.reduce((sum, order) => sum + order.coursePrice, 0);

            res.status(200).json({
                success: true,
                instructor: {
                    _id: instructor._id,
                    firstName: instructor.firstName,
                    lastName: instructor.lastName,
                    email: instructor.email,
                    avatar: instructor.avatar,
                    bio: instructor.bio,
                    instructorHeadline: instructor.instructorHeadline,
                    instructorBio: instructor.instructorBio,
                    isVerified: instructor.isVerified,
                    website: instructor.website
                },
                stats: {
                    totalCourses,
                    totalStudents,
                    totalReviews,
                    averageRating: Math.round(averageRating * 10) / 10,
                    totalRevenue
                }
            });

        } catch (error: any) {
            console.error("Get Instructor Stats Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch instructor stats", 500));
        }
    }
);
