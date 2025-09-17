import { Request, Response, NextFunction } from "express";
import { CourseModel } from "../models/course.model";
import UserModel from "../models/user.mode";
import OrderModel from "../models/order.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Enroll in a course
export const enrollInCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if course exists
      const course = await CourseModel.findById(courseId).populate("createdBy", "firstName lastName username");
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Check if user is already enrolled
      const existingOrder = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: { $in: ['pending', 'completed'] }
      });

      if (existingOrder) {
        return next(new ErrorHandler("You are already enrolled in this course", 400));
      }

      // Check if user is trying to enroll in their own course
      if (course.createdBy._id.toString() === userId.toString()) {
        return next(new ErrorHandler("You cannot enroll in your own course", 400));
      }

      // Create order for enrollment
      const orderData = {
        courseId: courseId,
        userId: userId,
        courseName: course.name,
        coursePrice: course.price,
        courseThumbnail: course.thumbnail,
        instructorId: course.createdBy._id.toString(),
        instructorName: `${course.createdBy.firstName} ${course.createdBy.lastName}`,
        status: 'completed', // For now, auto-complete enrollment (payment will be handled later)
        payment_info: {
          paymentMethod: 'free_enrollment', // Temporary for free courses
          paymentStatus: 'completed',
          amount: course.price,
          currency: 'USD'
        },
        enrolledAt: new Date(),
        completedAt: new Date()
      };

      const order = await OrderModel.create(orderData);

      res.status(201).json({
        success: true,
        message: "Successfully enrolled in course!",
        order: {
          _id: order._id,
          courseId: order.courseId,
          courseName: order.courseName,
          coursePrice: order.coursePrice,
          status: order.status,
          enrolledAt: order.enrolledAt
        }
      });
    } catch (error: any) {
      console.error("Enrollment Error:", error);
      return next(new ErrorHandler("Failed to enroll in course", 500));
    }
  }
);

// Get user's enrolled courses
export const getUserEnrolledCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const enrolledCourses = await OrderModel.find({
        userId: userId,
        status: { $in: ['completed'] }
      }).sort({ enrolledAt: -1 });

      // Get course details for each enrollment
      const coursesWithDetails = await Promise.all(
        enrolledCourses.map(async (order) => {
          const course = await CourseModel.findById(order.courseId)
            .populate("createdBy", "firstName lastName username avatar");
          
          return {
            orderId: order._id,
            courseId: order.courseId,
            courseName: order.courseName,
            courseThumbnail: order.courseThumbnail,
            coursePrice: order.coursePrice,
            instructor: course?.createdBy,
            enrolledAt: order.enrolledAt,
            status: order.status,
            course: course
          };
        })
      );

      res.status(200).json({
        success: true,
        message: "Enrolled courses fetched successfully",
        courses: coursesWithDetails
      });
    } catch (error: any) {
      console.error("Get Enrolled Courses Error:", error);
      return next(new ErrorHandler("Failed to fetch enrolled courses", 500));
    }
  }
);

// Check if user is enrolled in a course
export const checkEnrollment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const enrollment = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: { $in: ['completed'] }
      });

      res.status(200).json({
        success: true,
        isEnrolled: !!enrollment,
        enrollment: enrollment ? {
          orderId: enrollment._id,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status
        } : null
      });
    } catch (error: any) {
      console.error("Check Enrollment Error:", error);
      return next(new ErrorHandler("Failed to check enrollment", 500));
    }
  }
);

// Get all orders (Admin only)
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, status, courseId, userId } = req.query;
      
      // Build query
      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      if (courseId) {
        query.courseId = courseId;
      }
      if (userId) {
        query.userId = userId;
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [orders, totalOrders] = await Promise.all([
        OrderModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        OrderModel.countDocuments(query)
      ]);

      // Get order statistics
      const orderStats = await OrderModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalRevenue = await OrderModel.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$coursePrice' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalOrders / Number(limit)),
          totalOrders,
          hasNext: skip + Number(limit) < totalOrders,
          hasPrev: Number(page) > 1
        },
        statistics: {
          orderStats: orderStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {} as Record<string, number>),
          totalRevenue: totalRevenue[0]?.total || 0
        }
      });
    } catch (error: any) {
      console.error("Get Orders Error:", error);
      return next(new ErrorHandler("Failed to fetch orders", 500));
    }
  }
);

// Get order details
export const getOrderDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      const order = await OrderModel.findById(orderId);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Check if user can view this order
      if (userRole !== 'admin' && order.userId !== userId) {
        return next(new ErrorHandler("Not authorized to view this order", 403));
      }

      // Get course and user details
      const [course, user] = await Promise.all([
        CourseModel.findById(order.courseId).populate("createdBy", "firstName lastName username avatar"),
        UserModel.findById(order.userId).select("-password")
      ]);

      res.status(200).json({
        success: true,
        message: "Order details fetched successfully",
        order: {
          ...order.toObject(),
          course,
          user
        }
      });
    } catch (error: any) {
      console.error("Get Order Details Error:", error);
      return next(new ErrorHandler("Failed to fetch order details", 500));
    }
  }
);

// Update order status (Admin only)
export const updateOrderStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!['pending', 'completed', 'cancelled', 'refunded'].includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
      }
      await order.save();

      res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
      });
    } catch (error: any) {
      console.error("Update Order Status Error:", error);
      return next(new ErrorHandler("Failed to update order status", 500));
    }
  }
);
