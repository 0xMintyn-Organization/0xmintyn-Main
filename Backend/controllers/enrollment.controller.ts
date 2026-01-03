import { Request, Response, NextFunction } from "express";
import { CourseModel } from "../models/course.model";
import UserModel from "../models/user.mode";
import OrderModel from "../models/order.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { 
  checkMintynBalance, 
  submitSignedTransaction,
  RPC_URL 
} from "../utils/mintynPayment";
import { Connection, PublicKey } from "@solana/web3.js";

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

      // Verify course has a price
      if (!course.price || course.price <= 0) {
        return next(new ErrorHandler("This course is not available for enrollment. Please contact support.", 400));
      }

      // Get user's wallet address
      const user = await UserModel.findById(userId).select("walletAddress");
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (!user.walletAddress) {
        return next(new ErrorHandler("Wallet address not found. Please connect your wallet first.", 400));
      }

      // Get instructor wallet address
      const instructor = await UserModel.findById(course.createdBy._id).select("walletAddress");
      if (!instructor || !instructor.walletAddress) {
        return next(new ErrorHandler("Instructor wallet address not found. The instructor needs to connect their wallet to receive payments.", 400));
      }

      // Get signed transaction from frontend
      const { signedTransaction } = req.body;
      if (!signedTransaction) {
        return next(new ErrorHandler("Signed transaction is required. Please complete the payment in your wallet.", 400));
      }

      // Submit signed transaction to blockchain
      let transactionSignature: string;
      let instructorAmount: number;
      let adminAmount: number;

      try {
        const paymentResult = await submitSignedTransaction(
          signedTransaction,
          user.walletAddress,
          instructor.walletAddress,
          course.price
        );

        transactionSignature = paymentResult.signature;
        instructorAmount = paymentResult.instructorAmount;
        adminAmount = paymentResult.adminAmount;

        console.log("✅ Payment successful!");
        console.log(`Transaction: ${transactionSignature}`);
        console.log(`Instructor receives: ${instructorAmount} 0XM`);
        console.log(`Admin receives: ${adminAmount} 0XM`);
      } catch (error: any) {
        console.error("❌ Payment error:", error);
        return next(new ErrorHandler(
          error.message || "Payment failed. Please try again.",
          400
        ));
      }

      // Create order for enrollment (use amounts from payment result)
      const orderData = {
        courseId: courseId,
        userId: userId,
        courseName: course.name,
        coursePrice: course.price,
        courseThumbnail: course.thumbnail,
        instructorId: course.createdBy._id.toString(),
        instructorName: `${(course.createdBy as any).firstName} ${(course.createdBy as any).lastName}`,
        status: 'completed',
        payment_info: {
          paymentMethod: 'mintyn',
          paymentStatus: 'completed',
          amount: course.price,
          currency: '0XM',
          transactionSignature: transactionSignature,
          instructorAmount: instructorAmount,
          adminAmount: adminAmount,
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
          
          // Skip if course was deleted
          if (!course) return null;
          
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

      // Filter out null values (deleted courses)
      const validCourses = coursesWithDetails.filter(course => course !== null);

      res.status(200).json({
        success: true,
        message: "Enrolled courses fetched successfully",
        courses: validCourses
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

// Check course access (instructor, admin, or enrolled student)
export const checkCourseAccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if course exists
      const course = await CourseModel.findById(courseId).populate("createdBy", "firstName lastName username");
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Check if user is admin
      const isAdmin = userRole === 'admin';
      
      // Check if user is the course instructor
      const isInstructor = course.createdBy._id.toString() === userId.toString();
      
      // Check if user is enrolled
      const enrollment = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: { $in: ['completed'] }
      });
      const isEnrolled = !!enrollment;

      // Determine access level
      let accessLevel = 'none';
      let hasAccess = false;

      if (isAdmin) {
        accessLevel = 'admin';
        hasAccess = true;
      } else if (isInstructor) {
        accessLevel = 'instructor';
        hasAccess = true;
      } else if (isEnrolled) {
        accessLevel = 'student';
        hasAccess = true;
      }

      res.status(200).json({
        success: true,
        hasAccess,
        accessLevel,
        isAdmin,
        isInstructor,
        isEnrolled,
        course: {
          _id: course._id,
          name: course.name,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          level: course.level,
          createdBy: course.createdBy
        },
        enrollment: enrollment ? {
          orderId: enrollment._id,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status
        } : null
      });
    } catch (error: any) {
      console.error("Check Course Access Error:", error);
      return next(new ErrorHandler("Failed to check course access", 500));
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

// Mark lecture as completed
export const markLectureComplete = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lectureId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if user is enrolled in the course
      const enrollment = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: 'completed'
      });

      if (!enrollment) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }

      // Check if lecture exists in the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const lectureExists = course.courseData
        .flatMap(section => section.videos)
        .some(video => video._id.toString() === lectureId);

      if (!lectureExists) {
        return next(new ErrorHandler("Lecture not found", 404));
      }

      // Add lecture to completed lectures if not already there
      if (!enrollment.completedLectures) {
        enrollment.completedLectures = [];
      }

      if (!enrollment.completedLectures.includes(lectureId)) {
        enrollment.completedLectures.push(lectureId);
        await enrollment.save();
      }

      res.status(200).json({
        success: true,
        message: "Lecture marked as completed",
        completedLectures: enrollment.completedLectures
      });

    } catch (error: any) {
      console.error("Mark Lecture Complete Error:", error);
      return next(new ErrorHandler("Failed to mark lecture as complete", 500));
    }
  }
);

// Check user's Mintyn balance for a course
export const checkUserBalance = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Get course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Get user's wallet address
      const user = await UserModel.findById(userId).select("walletAddress");
      if (!user || !user.walletAddress) {
        return res.status(200).json({
          success: true,
          balance: 0,
          hasEnough: false,
          required: course.price,
          message: "Wallet not connected"
        });
      }

      // Check balance
      const connection = new Connection(RPC_URL, "confirmed");
      const userWallet = new PublicKey(user.walletAddress);
      const balanceCheck = await checkMintynBalance(userWallet, course.price, connection);

      res.status(200).json({
        success: true,
        balance: balanceCheck.balance,
        hasEnough: balanceCheck.hasEnough,
        required: course.price,
        coursePrice: course.price
      });
    } catch (error: any) {
      console.error("Check Balance Error:", error);
      return next(new ErrorHandler("Failed to check balance", 500));
    }
  }
);

// Get course progress
export const getCourseProgress = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if user is enrolled in the course
      const enrollment = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: 'completed'
      });

      if (!enrollment) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }

      // Get course details
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Calculate progress
      const totalLectures = course.courseData
        .flatMap(section => section.videos)
        .length;

      const completedLectures = enrollment.completedLectures?.length || 0;
      const progressPercentage = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

      res.status(200).json({
        success: true,
        progress: {
          totalLectures,
          completedLectures,
          progressPercentage: Math.round(progressPercentage),
          completedLectureIds: enrollment.completedLectures || []
        }
      });

    } catch (error: any) {
      console.error("Get Course Progress Error:", error);
      return next(new ErrorHandler("Failed to get course progress", 500));
    }
  }
);
