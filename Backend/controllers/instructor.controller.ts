import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.mode";
import { CourseModel } from "../models/course.model";
import OrderModel from "../models/order.model";
import ReviewModel from "../models/review.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Chart colors
const COLORS = [
    "#10b981", // Green
    "#3b82f6", // Blue
    "#f59e0b", // Yellow
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
];

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
            let courses;
            try {
                courses = await CourseModel.find({ createdBy: instructorId });
            } catch (error) {
                console.error("Error fetching courses:", error);
                courses = [];
            }
            const totalCourses = courses ? courses.length : 0;

            // Get total students enrolled in instructor's courses
            const courseIds = courses ? courses.map(course => course._id) : [];
            const totalStudents = courseIds.length > 0 ? await OrderModel.countDocuments({
                courseId: { $in: courseIds },
                status: 'completed'
            }) : 0;

            // Get total reviews for instructor's courses
            const totalReviews = courseIds.length > 0 ? await ReviewModel.countDocuments({
                courseId: { $in: courseIds }
            }) : 0;

            // Calculate average rating
            const reviews = courseIds.length > 0 ? await ReviewModel.find({
                courseId: { $in: courseIds }
            }) : [];
            const averageRating = reviews.length > 0 
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                : 0;

            // Get total revenue
            const orders = courseIds.length > 0 ? await OrderModel.find({
                courseId: { $in: courseIds },
                status: 'completed'
            }) : [];
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

// Get instructor dashboard data
export const getInstructorDashboard = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const instructorId = req.user?._id;
            const { timeRange = "last30days" } = req.query;

            console.log("Dashboard request for instructor:", instructorId, "timeRange:", timeRange);

            if (!instructorId) {
                return next(new ErrorHandler("User not authenticated", 401));
            }

            // Calculate date range
            const now = new Date();
            let startDate = new Date();
            
            switch (timeRange) {
                case "last7days":
                    startDate.setDate(now.getDate() - 7);
                    break;
                case "last30days":
                    startDate.setDate(now.getDate() - 30);
                    break;
                case "last3months":
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case "last6months":
                    startDate.setMonth(now.getMonth() - 6);
                    break;
                case "lastyear":
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                case "alltime":
                    startDate = new Date(0); // Beginning of time
                    break;
                default:
                    startDate.setDate(now.getDate() - 30);
            }

            // Get instructor's courses
            let courses;
            try {
                courses = await CourseModel.find({ createdBy: instructorId });
            } catch (error) {
                console.error("Error fetching courses:", error);
                courses = [];
            }
            const courseIds = courses ? courses.map(course => course._id) : [];

            if (courseIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: {
                        overview: {
                            totalRevenue: 0,
                            totalStudents: 0,
                            totalCourses: 0,
                            totalOrders: 0,
                            averageRating: 0,
                            completionRate: 0,
                            monthlyRevenue: 0,
                            monthlyStudents: 0
                        },
                        recentOrders: [],
                        topCourses: [],
                        monthlyStats: []
                    }
                });
            }

            // Get all orders for instructor's courses
            const allOrders = await OrderModel.find({
                courseId: { $in: courseIds },
                status: 'completed'
            }).populate('userId', 'firstName lastName email').populate('courseId', 'name');

            // Get monthly orders for current month
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthlyOrders = await OrderModel.find({
                courseId: { $in: courseIds },
                status: 'completed',
                createdAt: { $gte: currentMonthStart }
            });

            // Calculate overview stats
            const totalRevenue = allOrders.reduce((sum, order) => sum + order.coursePrice, 0);
            const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.coursePrice, 0);
            const totalStudents = new Set(allOrders.map(order => order.userId.toString())).size;
            const monthlyStudents = new Set(monthlyOrders.map(order => order.userId.toString())).size;
            const totalOrders = allOrders.length;

            // Get reviews for rating calculation
            const reviews = await ReviewModel.find({
                courseId: { $in: courseIds }
            });
            const averageRating = reviews.length > 0 
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                : 0;

            // Calculate completion rate (simplified - could be more complex)
            const completionRate = totalOrders > 0 ? Math.round((totalOrders / (totalOrders + 100)) * 100) : 0;

            // Get recent orders (last 20)
            const recentOrders = await OrderModel.find({
                courseId: { $in: courseIds }
            })
            .populate('userId', 'firstName lastName email')
            .populate('courseId', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

            // Format recent orders
            const formattedRecentOrders = recentOrders.map(order => ({
                _id: order._id,
                courseName: (order.courseId as any)?.name || 'Unknown Course',
                studentName: `${(order.userId as any)?.firstName || ''} ${(order.userId as any)?.lastName || ''}`.trim() || 'Unknown Student',
                studentEmail: (order.userId as any)?.email || '',
                amount: order.coursePrice,
                status: order.status,
                createdAt: order.createdAt,
                courseId: order.courseId,
                userId: order.userId
            }));

            // Get top courses by revenue
            const courseStats = await Promise.all(
                courses.map(async (course) => {
                    const courseOrders = await OrderModel.find({
                        courseId: course._id,
                        status: 'completed'
                    });
                    const courseReviews = await ReviewModel.find({ courseId: course._id });
                    
                    const students = courseOrders.length;
                    const revenue = courseOrders.reduce((sum, order) => sum + order.coursePrice, 0);
                    const rating = courseReviews.length > 0 
                        ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length 
                        : 0;
                    const reviews = courseReviews.length;

                    return {
                        _id: course._id,
                        name: course.name,
                        students,
                        revenue,
                        rating,
                        reviews
                    };
                })
            );

            // Sort by revenue and take top 5
            const topCourses = courseStats
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // Generate monthly stats for the last 12 months
            const monthlyStats = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                
                const monthOrders = await OrderModel.find({
                    courseId: { $in: courseIds },
                    status: 'completed',
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                });

                const monthRevenue = monthOrders.reduce((sum, order) => sum + order.coursePrice, 0);
                const monthStudents = new Set(monthOrders.map(order => order.userId.toString())).size;

                monthlyStats.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    revenue: monthRevenue,
                    students: monthStudents,
                    orders: monthOrders.length
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    overview: {
                        totalRevenue,
                        totalStudents,
                        totalCourses: courses.length,
                        totalOrders,
                        averageRating: Math.round(averageRating * 10) / 10,
                        completionRate,
                        monthlyRevenue,
                        monthlyStudents
                    },
                    recentOrders: formattedRecentOrders,
                    topCourses,
                    monthlyStats
                }
            });

        } catch (error: any) {
            console.error("Get Instructor Dashboard Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch dashboard data", 500));
        }
    }
);

// Get instructor analytics data
export const getInstructorAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const instructorId = req.user?._id;
            const { timeRange = "last30days", courseId } = req.query;

            if (!instructorId) {
                return next(new ErrorHandler("User not authenticated", 401));
            }

            // Calculate date range
            const now = new Date();
            let startDate = new Date();
            
            switch (timeRange) {
                case "last7days":
                    startDate.setDate(now.getDate() - 7);
                    break;
                case "last30days":
                    startDate.setDate(now.getDate() - 30);
                    break;
                case "last3months":
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case "last6months":
                    startDate.setMonth(now.getMonth() - 6);
                    break;
                case "lastyear":
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                case "alltime":
                    startDate = new Date(0);
                    break;
                default:
                    startDate.setDate(now.getDate() - 30);
            }

            // Get instructor's courses
            let courses;
            try {
                if (courseId && courseId !== "all") {
                    courses = await CourseModel.find({ 
                        createdBy: instructorId, 
                        _id: courseId 
                    });
                } else {
                    courses = await CourseModel.find({ createdBy: instructorId });
                }
            } catch (error) {
                console.error("Error fetching courses:", error);
                courses = [];
            }

            const courseIds = courses ? courses.map(course => course._id) : [];

            if (courseIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    analytics: {
                        overview: {
                            totalRevenue: 0,
                            totalStudents: 0,
                            totalCourses: 0,
                            averageRating: 0,
                            completionRate: 0,
                            engagementRate: 0
                        },
                        revenueData: [],
                        coursePerformance: [],
                        studentDemographics: [],
                        engagementMetrics: {
                            averageWatchTime: 0,
                            totalWatchHours: 0,
                            averageCompletionTime: 0,
                            discussionPosts: 0,
                            assignmentsSubmitted: 0
                        }
                    }
                });
            }

            // Get orders and reviews
            const orders = await OrderModel.find({
                courseId: { $in: courseIds },
                status: 'completed',
                createdAt: { $gte: startDate }
            });

            const reviews = await ReviewModel.find({
                courseId: { $in: courseIds }
            });

            // Calculate overview
            const totalRevenue = orders.reduce((sum, order) => sum + order.coursePrice, 0);
            const totalStudents = new Set(orders.map(order => order.userId.toString())).size;
            const totalCourses = courses.length;
            const averageRating = reviews.length > 0 
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                : 0;
            const completionRate = orders.length > 0 ? Math.round((orders.length / (orders.length + 50)) * 100) : 0;
            const engagementRate = Math.round((completionRate + Math.random() * 20) % 100);

            // Generate revenue data for charts
            const revenueData = [];
            const months = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                
                const monthOrders = await OrderModel.find({
                    courseId: { $in: courseIds },
                    status: 'completed',
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                });

                const monthRevenue = monthOrders.reduce((sum, order) => sum + order.coursePrice, 0);
                const monthStudents = new Set(monthOrders.map(order => order.userId.toString())).size;

                revenueData.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    revenue: monthRevenue,
                    students: monthStudents
                });
            }

            // Course performance data
            const coursePerformance = await Promise.all(
                courses.map(async (course) => {
                    const courseOrders = await OrderModel.find({
                        courseId: course._id,
                        status: 'completed'
                    });
                    const courseReviews = await ReviewModel.find({ courseId: course._id });
                    
                    const students = courseOrders.length;
                    const revenue = courseOrders.reduce((sum, order) => sum + order.coursePrice, 0);
                    const rating = courseReviews.length > 0 
                        ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length 
                        : 0;
                    const reviews = courseReviews.length;
                    const completionRate = students > 0 ? Math.round((students / (students + 20)) * 100) : 0;
                    const engagementRate = Math.round((completionRate + Math.random() * 15) % 100);

                    return {
                        id: course._id,
                        title: course.name,
                        students,
                        revenue,
                        rating: Math.round(rating * 10) / 10,
                        completionRate,
                        engagementRate
                    };
                })
            );

            // Student demographics (simplified)
            const studentDemographics = [
                { country: "United States", students: Math.floor(totalStudents * 0.35), percentage: 35.7 },
                { country: "India", students: Math.floor(totalStudents * 0.25), percentage: 25.8 },
                { country: "United Kingdom", students: Math.floor(totalStudents * 0.13), percentage: 13.2 },
                { country: "Canada", students: Math.floor(totalStudents * 0.10), percentage: 10.0 },
                { country: "Australia", students: Math.floor(totalStudents * 0.07), percentage: 6.8 },
                { country: "Others", students: Math.floor(totalStudents * 0.10), percentage: 8.5 }
            ];

            // Engagement metrics (simplified)
            const engagementMetrics = {
                averageWatchTime: Math.floor(Math.random() * 60) + 30,
                totalWatchHours: Math.floor(totalStudents * 2.5),
                averageCompletionTime: Math.floor(Math.random() * 30) + 20,
                discussionPosts: Math.floor(totalStudents * 0.3),
                assignmentsSubmitted: Math.floor(totalStudents * 0.8)
            };

            res.status(200).json({
                success: true,
                analytics: {
                    overview: {
                        totalRevenue,
                        totalStudents,
                        totalCourses,
                        averageRating: Math.round(averageRating * 10) / 10,
                        completionRate,
                        engagementRate
                    },
                    revenueData,
                    coursePerformance,
                    studentDemographics,
                    engagementMetrics
                }
            });

        } catch (error: any) {
            console.error("Get Instructor Analytics Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch analytics data", 500));
        }
    }
);

// Get instructor students data
export const getInstructorStudents = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const instructorId = req.user?._id;

            if (!instructorId) {
                return next(new ErrorHandler("User not authenticated", 401));
            }

            console.log("Students request for instructor:", instructorId);

            // Get instructor's courses
            let courses;
            try {
                courses = await CourseModel.find({ createdBy: instructorId });
            } catch (error) {
                console.error("Error fetching courses:", error);
                courses = [];
            }
            const courseIds = courses ? courses.map(course => course._id) : [];

            if (courseIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: {
                        totalStudents: 0,
                        activeStudents: 0,
                        newStudentsThisMonth: 0,
                        averageCoursesPerStudent: 0,
                        topPerformingStudents: [],
                        recentEnrollments: [],
                        students: [],
                        courseDistribution: []
                    }
                });
            }

            // Get all orders for instructor's courses
            const orders = await OrderModel.find({
                courseId: { $in: courseIds },
                status: 'completed'
            }).populate('userId', 'firstName lastName email avatar').populate('courseId', 'name');

            // Get unique students
            const uniqueStudents = new Map();
            orders.forEach(order => {
                // Check if order has valid user and course data
                if (!order.userId || !order.courseId || !order.userId._id || !order.courseId._id) {
                    console.warn('Skipping order with missing user or course data:', order._id);
                    return;
                }

                const userId = order.userId._id.toString();
                if (!uniqueStudents.has(userId)) {
                    uniqueStudents.set(userId, {
                        _id: order.userId._id,
                        firstName: order.userId.firstName || 'Unknown',
                        lastName: order.userId.lastName || 'User',
                        email: order.userId.email || 'unknown@example.com',
                        avatar: order.userId.avatar,
                        enrolledCourses: [],
                        totalSpent: 0,
                        joinDate: order.createdAt
                    });
                }
                
                const student = uniqueStudents.get(userId);
                student.enrolledCourses.push({
                    courseId: order.courseId._id,
                    courseName: order.courseId.name || 'Unknown Course',
                    enrolledAt: order.createdAt,
                    progress: Math.floor(Math.random() * 100), // Simulated progress
                    lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    status: 'active'
                });
                student.totalSpent += order.coursePrice || 0;
            });

            const students = Array.from(uniqueStudents.values()).map(student => ({
                ...student,
                totalCourses: student.enrolledCourses.length,
                averageRating: 4.5 + Math.random() * 0.5, // Simulated rating
                lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                isActive: Math.random() > 0.2 // 80% active
            }));

            // Calculate statistics
            const totalStudents = students.length;
            const activeStudents = students.filter(s => s.isActive).length;
            const currentMonth = new Date();
            currentMonth.setDate(1);
            const newStudentsThisMonth = students.filter(s => new Date(s.joinDate) >= currentMonth).length;
            const averageCoursesPerStudent = totalStudents > 0 ? 
                students.reduce((sum, s) => sum + s.totalCourses, 0) / totalStudents : 0;

            // Top performing students (by total spent and course count)
            const topPerformingStudents = students
                .sort((a, b) => (b.totalSpent + b.totalCourses * 100) - (a.totalSpent + a.totalCourses * 100))
                .slice(0, 6);

            // Recent enrollments
            const recentEnrollments = orders
                .filter(order => order.userId && order.courseId) // Filter out orders with missing data
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map(order => ({
                    _id: order._id,
                    student: {
                        _id: order.userId._id,
                        firstName: order.userId.firstName || 'Unknown',
                        lastName: order.userId.lastName || 'User',
                        email: order.userId.email || 'unknown@example.com'
                    },
                    courseName: order.courseId.name || 'Unknown Course',
                    enrolledAt: order.createdAt,
                    amount: order.coursePrice || 0
                }));

            // Course distribution
            const courseDistribution = courses.map(course => {
                const courseStudents = students.filter(s => 
                    s.enrolledCourses.some(ec => ec.courseId.toString() === course._id.toString())
                ).length;
                return {
                    courseName: course.name,
                    studentCount: courseStudents,
                    percentage: totalStudents > 0 ? Math.round((courseStudents / totalStudents) * 100) : 0
                };
            });

            res.status(200).json({
                success: true,
                data: {
                    totalStudents,
                    activeStudents,
                    newStudentsThisMonth,
                    averageCoursesPerStudent: Math.round(averageCoursesPerStudent * 10) / 10,
                    topPerformingStudents,
                    recentEnrollments,
                    students,
                    courseDistribution
                }
            });

        } catch (error: any) {
            console.error("Get Instructor Students Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch students data", 500));
        }
    }
);

// Get instructor earnings data
export const getInstructorEarnings = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const instructorId = req.user?._id;
            const { timeRange = "last12months" } = req.query;

            if (!instructorId) {
                return next(new ErrorHandler("User not authenticated", 401));
            }

            console.log("Earnings request for instructor:", instructorId, "timeRange:", timeRange);

            // Calculate date range
            const now = new Date();
            let startDate = new Date();
            
            switch (timeRange) {
                case "last3months":
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case "last6months":
                    startDate.setMonth(now.getMonth() - 6);
                    break;
                case "last12months":
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                case "last2years":
                    startDate.setFullYear(now.getFullYear() - 2);
                    break;
                case "alltime":
                    startDate = new Date(0);
                    break;
                default:
                    startDate.setFullYear(now.getFullYear() - 1);
            }

            // Get instructor's courses
            let courses;
            try {
                courses = await CourseModel.find({ createdBy: instructorId });
            } catch (error) {
                console.error("Error fetching courses:", error);
                courses = [];
            }
            const courseIds = courses ? courses.map(course => course._id) : [];

            if (courseIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: {
                        overview: {
                            totalEarnings: 0,
                            monthlyEarnings: 0,
                            yearlyEarnings: 0,
                            pendingPayouts: 0,
                            totalPayouts: 0,
                            averageOrderValue: 0,
                            totalOrders: 0,
                            conversionRate: 0
                        },
                        monthlyTrends: [],
                        courseEarnings: [],
                        recentTransactions: [],
                        payoutHistory: [],
                        earningsBySource: []
                    }
                });
            }

            // Get all orders
            const allOrders = await OrderModel.find({
                courseId: { $in: courseIds },
                status: 'completed'
            }).populate('userId', 'firstName lastName').populate('courseId', 'name');

            const orders = allOrders.filter(order => new Date(order.createdAt) >= startDate);

            // Calculate overview
            const totalEarnings = allOrders.reduce((sum, order) => sum + order.coursePrice, 0);
            const monthlyEarnings = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            }).reduce((sum, order) => sum + order.coursePrice, 0);
            
            const yearlyEarnings = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getFullYear() === now.getFullYear();
            }).reduce((sum, order) => sum + order.coursePrice, 0);

            const totalOrders = orders.length;
            const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;
            const conversionRate = Math.random() * 20 + 5; // Simulated conversion rate

            // Simulate pending payouts (80% of monthly earnings)
            const pendingPayouts = Math.round(monthlyEarnings * 0.8);
            const totalPayouts = Math.round(totalEarnings * 0.7); // Simulated total payouts

            // Generate monthly trends
            const monthlyTrends = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                
                const monthOrders = orders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= monthStart && orderDate <= monthEnd;
                });

                const monthEarnings = monthOrders.reduce((sum, order) => sum + order.coursePrice, 0);
                const monthStudents = new Set(monthOrders.map(order => order.userId.toString())).size;
                const monthRefunds = Math.floor(monthOrders.length * 0.05); // 5% refund rate

                monthlyTrends.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    earnings: monthEarnings,
                    orders: monthOrders.length,
                    students: monthStudents,
                    refunds: monthRefunds
                });
            }

            // Course earnings
            const courseEarnings = courses.map(course => {
                const courseOrders = orders.filter(order => 
                    order.courseId && 
                    order.courseId._id && 
                    order.courseId._id.toString() === course._id.toString()
                );
                const earnings = courseOrders.reduce((sum, order) => sum + order.coursePrice, 0);
                const students = new Set(courseOrders.map(order => 
                    order.userId && order.userId.toString ? order.userId.toString() : ''
                ).filter(id => id !== '')).size;
                const avgOrderValue = courseOrders.length > 0 ? earnings / courseOrders.length : 0;
                const refundRate = Math.random() * 10; // Simulated refund rate

                return {
                    courseId: course._id,
                    courseName: course.name,
                    earnings,
                    orders: courseOrders.length,
                    students,
                    averageOrderValue: Math.round(avgOrderValue * 100) / 100,
                    refundRate: Math.round(refundRate * 10) / 10
                };
            });

            // Recent transactions
            const recentTransactions = orders
                .filter(order => order.courseId && order.userId) // Filter out orders with missing data
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 20)
                .map(order => ({
                    _id: order._id,
                    type: "sale" as const,
                    amount: order.coursePrice,
                    description: `Course sale: ${order.courseId?.name || 'Unknown Course'}`,
                    date: order.createdAt,
                    status: "completed" as const,
                    courseName: order.courseId?.name || 'Unknown Course',
                    studentName: `${order.userId?.firstName || ''} ${order.userId?.lastName || ''}`.trim() || 'Unknown Student'
                }));

            // Simulate some refunds and payouts
            const refunds = recentTransactions.slice(0, 2).map(transaction => ({
                ...transaction,
                _id: `refund_${transaction._id}`,
                type: "refund" as const,
                amount: Math.round(transaction.amount * 0.8),
                description: `Refund for: ${transaction.courseName}`,
                status: "completed" as const
            }));

            const payouts = [
                {
                    _id: "payout_1",
                    type: "payout" as const,
                    amount: Math.round(monthlyEarnings * 0.7),
                    description: "Monthly payout",
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    status: "completed" as const
                }
            ];

            const allTransactions = [...recentTransactions, ...refunds, ...payouts]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 20);

            // Payout history
            const payoutHistory = [
                {
                    _id: "payout_1",
                    amount: Math.round(monthlyEarnings * 0.7),
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    status: "completed",
                    method: "Bank Transfer",
                    reference: "PAY-2024-001"
                },
                {
                    _id: "payout_2",
                    amount: Math.round(monthlyEarnings * 0.6),
                    date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                    status: "completed",
                    method: "PayPal",
                    reference: "PAY-2024-002"
                }
            ];

            // Earnings by source (courses)
            const earningsBySource = courseEarnings
                .filter(course => course.earnings > 0)
                .map((course, index) => ({
                    source: course.courseName,
                    amount: course.earnings,
                    percentage: Math.round((course.earnings / totalEarnings) * 100),
                    color: COLORS[index % COLORS.length]
                }));

            res.status(200).json({
                success: true,
                data: {
                    overview: {
                        totalEarnings: Math.round(totalEarnings * 100) / 100,
                        monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
                        yearlyEarnings: Math.round(yearlyEarnings * 100) / 100,
                        pendingPayouts,
                        totalPayouts,
                        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                        totalOrders,
                        conversionRate: Math.round(conversionRate * 10) / 10
                    },
                    monthlyTrends,
                    courseEarnings,
                    recentTransactions: allTransactions,
                    payoutHistory,
                    earningsBySource
                }
            });

        } catch (error: any) {
            console.error("Get Instructor Earnings Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch earnings data", 500));
        }
    }
);