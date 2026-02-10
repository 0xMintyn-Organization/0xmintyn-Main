import { Request, Response, NextFunction } from "express";
import { CourseModel } from "../models/course.model";
import UserModel from "../models/user.mode";
import OrderModel from "../models/order.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { createCoursePaymentIntent, getPaymentIntent } from "../services/stripePayment.service";
import { getAccountStatus } from "../services/stripeConnect.service";
import { creditEqualUsd, hasCreditedFor, debitEqualUsd, getEqualUsdBalance, getCourseCompletionBonus, hasDebitedForCoursePurchase } from "../services/equalUsd.service";

// Enroll in a course (free only – paid courses use createPaymentIntent + confirmEnroll)
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

      // Paid courses must use payment flow (createPaymentIntent → confirmEnroll)
      if (course.price > 0) {
        return next(new ErrorHandler("This is a paid course. Please use the payment flow.", 400));
      }

      // Create order for enrollment
      const orderData = {
        courseId: courseId,
        userId: userId,
        courseName: course.name,
        coursePrice: course.price,
        courseThumbnail: course.thumbnail,
        instructorId: course.createdBy._id.toString(),
        instructorName: `${(course.createdBy as any).firstName} ${(course.createdBy as any).lastName}`,
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

/** POST /enrollment/create-payment-intent/:courseId – Create PaymentIntent for paid course. */
export const createPaymentIntent = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId } = req.params;
    const { equalUsdToUse } = req.body as { equalUsdToUse?: number };
    const userId = req.user?._id;

    if (!userId) return next(new ErrorHandler("User not authenticated", 401));

    const course = await CourseModel.findById(courseId).populate("createdBy", "firstName lastName stripeConnectAccountId");
    if (!course) return next(new ErrorHandler("Course not found", 404));

    if (course.price <= 0) {
      return next(new ErrorHandler("Use free enrollment for free courses", 400));
    }

    const instructor = course.createdBy as { _id: any; stripeConnectAccountId?: string };
    if (!instructor.stripeConnectAccountId) {
      return next(new ErrorHandler("Instructor has not set up payments yet. Please try again later.", 400));
    }

    const status = await getAccountStatus(instructor.stripeConnectAccountId);
    if ("error" in status) {
      return next(new ErrorHandler("Instructor payment account error", 400));
    }
    if (!status.chargesEnabled) {
      return next(new ErrorHandler("Instructor payment account is not yet ready to receive payments.", 400));
    }

    const existingOrder = await OrderModel.findOne({
      courseId,
      userId,
      status: { $in: ["pending", "completed"] },
    });
    if (existingOrder) {
      return next(new ErrorHandler("You are already enrolled in this course", 400));
    }

    if (course.createdBy._id.toString() === userId.toString()) {
      return next(new ErrorHandler("You cannot purchase your own course", 400));
    }

    // EqualUSD discount: 1 EqualUSD = $1. Cap by course price and user balance.
    const equalUsdAmount = Math.floor(Number(equalUsdToUse) || 0);
    const maxByPrice = Math.floor(course.price);

    const balance = equalUsdAmount > 0 ? await getEqualUsdBalance(userId) : 0;
    const actualEqualUsd = Math.min(Math.max(0, equalUsdAmount), maxByPrice, balance);

    const priceAfterDiscount = Math.max(0, course.price - actualEqualUsd);
    const amountCents = Math.round(priceAfterDiscount * 100);

    // Full EqualUSD payment – no Stripe needed
    if (priceAfterDiscount < 0.01 && actualEqualUsd > 0) {
      const debitResult = await debitEqualUsd(userId, actualEqualUsd, 'course_purchase_discount', {
        referenceType: 'order',
        referenceId: `equalusd-${courseId}-${userId}`,
        description: `Course purchase (full EqualUSD): ${course.name}`,
      });
      if ('error' in debitResult) {
        return next(new ErrorHandler(debitResult.error || 'Failed to apply EqualUSD', 400));
      }
      const orderData = {
        courseId,
        userId,
        courseName: course.name,
        coursePrice: course.price,
        courseThumbnail: course.thumbnail,
        instructorId: course.createdBy._id.toString(),
        instructorName: `${(course.createdBy as any).firstName} ${(course.createdBy as any).lastName}`,
        status: 'completed' as const,
        payment_info: { paymentMethod: 'equalusd_only', paymentStatus: 'completed', amount: 0, currency: 'USD' },
        equalUsdUsed: actualEqualUsd,
        enrolledAt: new Date(),
        completedAt: new Date(),
      };
      const order = await OrderModel.create(orderData);
      return res.status(200).json({
        success: true,
        paidWithEqualUsdOnly: true,
        order: { _id: order._id, courseId, courseName: course.name, coursePrice: course.price, status: 'completed', enrolledAt: order.enrolledAt },
        equalUsdApplied: actualEqualUsd,
        amountDue: 0,
      });
    }

    if (amountCents < 50 && priceAfterDiscount > 0) {
      return next(new ErrorHandler("Amount after EqualUSD discount is below Stripe minimum ($0.50). Use less EqualUSD.", 400));
    }

    const result = await createCoursePaymentIntent(
      amountCents,
      instructor.stripeConnectAccountId,
      {
        courseId,
        userId: userId.toString(),
        courseName: course.name,
        equalUsdToUse: actualEqualUsd,
      }
    );

    if ("error" in result) {
      return next(new ErrorHandler(result.error, 400));
    }

    res.status(200).json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      equalUsdApplied: actualEqualUsd,
      amountDue: priceAfterDiscount,
    });
  }
);

/** POST /enrollment/confirm-enroll/:courseId – Verify payment and complete enrollment. */
export const confirmEnroll = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId } = req.params;
    const { paymentIntentId } = req.body;
    const userId = req.user?._id;

    if (!userId) return next(new ErrorHandler("User not authenticated", 401));
    if (!paymentIntentId) return next(new ErrorHandler("paymentIntentId is required", 400));

    const course = await CourseModel.findById(courseId).populate("createdBy", "firstName lastName");
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const pi = await getPaymentIntent(paymentIntentId);
    if ("error" in pi) {
      return next(new ErrorHandler(pi.error || "Invalid payment", 400));
    }
    if (pi.status !== "succeeded") {
      return next(new ErrorHandler("Payment not completed", 400));
    }

    const metadata = await (async () => {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return intent.metadata;
      } catch {
        return {};
      }
    })();

    if (metadata.courseId !== courseId || metadata.userId !== userId.toString()) {
      return next(new ErrorHandler("Payment does not match this course or user", 400));
    }

    const equalUsdUsed = Math.floor(Number(metadata.equalUsdToUse) || 0);

    // Debit EqualUSD exactly once – idempotent by paymentIntentId (prevents double debit when confirmEnroll called twice)
    if (equalUsdUsed > 0) {
      const alreadyDebited = await hasDebitedForCoursePurchase(paymentIntentId);
      if (!alreadyDebited) {
        const debitResult = await debitEqualUsd(userId, equalUsdUsed, 'course_purchase_discount', {
          referenceType: 'order',
          referenceId: paymentIntentId,
          description: `Course purchase: ${course.name}`,
        });
        if ('error' in debitResult) {
          return next(new ErrorHandler(debitResult.error || 'Failed to apply EqualUSD discount', 400));
        }
      }
    }

    // Check existing order (from webhook or prior confirmEnroll) – return early if already enrolled
    const existingOrder = await OrderModel.findOne({
      courseId,
      userId,
      status: { $in: ["pending", "completed"] },
    });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Already enrolled",
        order: {
          _id: existingOrder._id,
          courseId: existingOrder.courseId,
          courseName: existingOrder.courseName,
          coursePrice: existingOrder.coursePrice,
          status: existingOrder.status,
          enrolledAt: existingOrder.enrolledAt,
        },
      });
    }

    const amountPaid = Math.max(0, course.price - equalUsdUsed);
    const orderData = {
      courseId,
      userId,
      courseName: course.name,
      coursePrice: course.price,
      courseThumbnail: course.thumbnail,
      instructorId: course.createdBy._id.toString(),
      instructorName: `${(course.createdBy as any).firstName} ${(course.createdBy as any).lastName}`,
      status: "completed" as const,
      payment_info: {
        paymentMethod: equalUsdUsed > 0 ? "stripe+equalusd" : "stripe",
        paymentStatus: "completed",
        transactionId: paymentIntentId,
        amount: amountPaid,
        currency: "USD",
      },
      stripePaymentIntentId: paymentIntentId,
      equalUsdUsed: equalUsdUsed > 0 ? equalUsdUsed : undefined,
      enrolledAt: new Date(),
      completedAt: new Date(),
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
        enrolledAt: order.enrolledAt,
      },
    });
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

      // Award EqualUSD when all lectures are completed (course completion bonus)
      const totalLectures = course.courseData.flatMap((s) => s.videos).length;
      const completedCount = enrollment.completedLectures?.length ?? 0;
      if (totalLectures > 0 && completedCount >= totalLectures) {
        const orderId = enrollment._id.toString();
        const alreadyCredited = await hasCreditedFor('course_completion', orderId);
        if (!alreadyCredited) {
          const bonus = getCourseCompletionBonus();
          if (bonus > 0) {
            const result = await creditEqualUsd(userId, bonus, 'course_completion', {
              referenceType: 'order',
              referenceId: orderId,
              description: `Course completed: ${course.name}`,
            });
            if ('error' in result) {
              console.warn('[EqualUSD] Course completion bonus failed:', result.error);
            }
          }
        }
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
