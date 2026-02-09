import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import { CourseModel } from "../models/course.model";
import OrderModel from "../models/order.model";
import UserModel from "../models/user.mode";
import WithdrawalModel from "../models/withdrawal.model";
import ErrorHandler from "../utils/errorHandler";
import { getPlatformBalance, listRecentTransfers } from "../services/stripePayment.service";

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

// Get admin users data
export const getAdminUsers = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("Admin users request");

            // Get all users with their statistics
            const users = await UserModel.find({})
                .select('-password')
                .sort({ createdAt: -1 });

            // Calculate user statistics
            const totalUsers = users.length;
            const activeUsers = users.filter(user => user.isActive !== false).length;
            
            // Calculate new users this month
            const currentMonth = new Date();
            currentMonth.setDate(1);
            const newUsersThisMonth = users.filter(user => 
                new Date(user.createdAt) >= currentMonth
            ).length;

            // Group users by role
            const usersByRole = {
                users: users.filter(user => user.role === 'user').length,
                instructors: users.filter(user => user.role === 'instructor').length,
                admins: users.filter(user => user.role === 'admin').length
            };

            // Get recent registrations (last 10)
            const recentRegistrations = users.slice(0, 10);

            // Calculate user spending and earnings
            const usersWithStats = await Promise.all(users.map(async (user) => {
                try {
                    // Get user's orders (as a student)
                    const userOrders = await OrderModel.find({
                        userId: user._id,
                        status: 'completed'
                    });

                    // Get user's courses (as an instructor)
                    const instructorCourses = await CourseModel.find({
                        createdBy: user._id
                    });

                    // Get earnings from instructor courses
                    const instructorOrders = await OrderModel.find({
                        courseId: { $in: instructorCourses.map(course => course._id) },
                        status: 'completed'
                    });

                    const totalSpent = userOrders.reduce((sum, order) => sum + (order.coursePrice || 0), 0);
                    const totalEarnings = instructorOrders.reduce((sum, order) => sum + (order.coursePrice || 0), 0);
                    const totalCourses = userOrders.length + instructorCourses.length;

                    return {
                        _id: user._id,
                        firstName: user.firstName || 'Unknown',
                        lastName: user.lastName || 'User',
                        email: user.email || 'unknown@example.com',
                        avatar: user.avatar,
                        role: user.role || 'user',
                        isVerified: user.isVerified || false,
                        isActive: user.isActive !== false,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin || user.createdAt,
                        totalCourses,
                        totalSpent,
                        totalEarnings,
                        instructorStatus: user.instructorStatus,
                        bio: user.bio,
                        instructorHeadline: user.instructorHeadline,
                        instructorBio: user.instructorBio,
                        website: (user as any).website
                    };
                } catch (error) {
                    console.error(`Error processing user ${user._id}:`, error);
                    return {
                        _id: user._id,
                        firstName: user.firstName || 'Unknown',
                        lastName: user.lastName || 'User',
                        email: user.email || 'unknown@example.com',
                        avatar: user.avatar,
                        role: user.role || 'user',
                        isVerified: user.isVerified || false,
                        isActive: user.isActive !== false,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin || user.createdAt,
                        totalCourses: 0,
                        totalSpent: 0,
                        totalEarnings: 0,
                        instructorStatus: user.instructorStatus,
                        bio: user.bio,
                        instructorHeadline: user.instructorHeadline,
                        instructorBio: user.instructorBio,
                        website: (user as any).website
                    };
                }
            }));

            // Get top spenders (users who spent the most)
            const topSpenders = usersWithStats
                .filter(user => user.role === 'user')
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 10);

            // Get top earners (instructors who earned the most)
            const topEarners = usersWithStats
                .filter(user => user.role === 'instructor')
                .sort((a, b) => b.totalEarnings - a.totalEarnings)
                .slice(0, 10);

            // Generate user growth data (last 12 months)
            const userGrowth = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date();
                monthStart.setMonth(monthStart.getMonth() - i);
                monthStart.setDate(1);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                monthEnd.setDate(0);

                const monthUsers = users.filter(user => {
                    const userDate = new Date(user.createdAt);
                    return userDate >= monthStart && userDate <= monthEnd;
                });

                const monthInstructors = monthUsers.filter(user => user.role === 'instructor').length;

                userGrowth.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    users: monthUsers.length - monthInstructors,
                    instructors: monthInstructors,
                    total: monthUsers.length
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    newUsersThisMonth,
                    usersByRole,
                    recentRegistrations: recentRegistrations.map(user => ({
                        _id: user._id,
                        firstName: user.firstName || 'Unknown',
                        lastName: user.lastName || 'User',
                        email: user.email || 'unknown@example.com',
                        avatar: user.avatar,
                        role: user.role || 'user',
                        isVerified: user.isVerified || false,
                        isActive: user.isActive !== false,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin || user.createdAt,
                        totalCourses: 0,
                        totalSpent: 0,
                        totalEarnings: 0
                    })),
                    topSpenders,
                    topEarners,
                    users: usersWithStats,
                    userGrowth
                }
            });

        } catch (error: any) {
            console.error("Get Admin Users Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch users data", 500));
        }
    }
);

// Get admin orders data
export const getAdminOrders = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("Admin orders request");

            // Get all orders
            const orders = await OrderModel.find({}).sort({ createdAt: -1 });

            // Manually populate user and course data since courseId/userId are strings
            const validOrders = await Promise.all(
                orders.map(async (order) => {
                    const user = await UserModel.findById(order.userId).select('firstName lastName email avatar');
                    const course = await CourseModel.findById(order.courseId).populate('createdBy', 'firstName lastName');
                    
                    // Skip orders where course or user is deleted
                    if (!user || !course) {
                        return null;
                    }
                    
                    return {
                        ...order.toObject(),
                        userId: user,
                        courseId: course
                    };
                })
            );

            // Filter out null values (deleted courses/users)
            const filteredOrders = validOrders.filter((order): order is NonNullable<typeof order> => order !== null && order !== undefined);

            // Calculate order statistics
            const totalOrders = filteredOrders.length;
            const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.coursePrice || 0), 0);
            const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
            const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
            const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;
            const refundedOrders = filteredOrders.filter(order => order.status === 'refunded').length;
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Calculate monthly revenue
            const currentMonth = new Date();
            currentMonth.setMonth(currentMonth.getMonth());
            currentMonth.setDate(1);
            const monthlyRevenue = filteredOrders
                .filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate.getMonth() === currentMonth.getMonth() && 
                           orderDate.getFullYear() === currentMonth.getFullYear();
                })
                .reduce((sum, order) => sum + (order.coursePrice || 0), 0);

            // Get recent orders (last 20)
            const recentOrders = filteredOrders.slice(0, 20);

            // Generate revenue by month data (last 12 months)
            const revenueByMonth = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date();
                monthStart.setMonth(monthStart.getMonth() - i);
                monthStart.setDate(1);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                monthEnd.setDate(0);

                const monthOrders = filteredOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= monthStart && orderDate <= monthEnd;
                });

                const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.coursePrice || 0), 0);
                const monthRefunds = monthOrders.filter(order => order.status === 'refunded').length;

                revenueByMonth.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    revenue: monthRevenue,
                    orders: monthOrders.length,
                    refunds: monthRefunds
                });
            }

            // Orders by status
            const ordersByStatus = [
                {
                    status: 'Completed',
                    count: completedOrders,
                    percentage: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
                    color: COLORS[0]
                },
                {
                    status: 'Pending',
                    count: pendingOrders,
                    percentage: totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0,
                    color: COLORS[1]
                },
                {
                    status: 'Cancelled',
                    count: cancelledOrders,
                    percentage: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0,
                    color: COLORS[2]
                },
                {
                    status: 'Refunded',
                    count: refundedOrders,
                    percentage: totalOrders > 0 ? Math.round((refundedOrders / totalOrders) * 100) : 0,
                    color: COLORS[3]
                }
            ];

            // Top courses by revenue
            const courseRevenue = new Map();
            filteredOrders.forEach(order => {
                if (order.courseId && order.courseId.createdBy) {
                    const courseId = order.courseId._id.toString();
                    const courseName = order.courseId.name || 'Unknown Course';
                    const instructorName = `${order.courseId.createdBy.firstName || ''} ${order.courseId.createdBy.lastName || ''}`.trim() || 'Unknown Instructor';
                    
                    if (!courseRevenue.has(courseId)) {
                        courseRevenue.set(courseId, {
                            courseId,
                            courseName,
                            instructor: instructorName,
                            orders: 0,
                            revenue: 0
                        });
                    }
                    
                    const course = courseRevenue.get(courseId);
                    course.orders += 1;
                    course.revenue += order.coursePrice || 0;
                }
            });

            const topCourses = Array.from(courseRevenue.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 20);

            // Top instructors by revenue
            const instructorRevenue = new Map();
            filteredOrders.forEach(order => {
                if (order.courseId && order.courseId.createdBy) {
                    const instructorId = order.courseId.createdBy._id.toString();
                    const instructorName = `${order.courseId.createdBy.firstName || ''} ${order.courseId.createdBy.lastName || ''}`.trim() || 'Unknown Instructor';
                    
                    if (!instructorRevenue.has(instructorId)) {
                        instructorRevenue.set(instructorId, {
                            instructorId,
                            instructorName,
                            orders: 0,
                            revenue: 0,
                            courses: new Set()
                        });
                    }
                    
                    const instructor = instructorRevenue.get(instructorId);
                    instructor.orders += 1;
                    instructor.revenue += order.coursePrice || 0;
                    instructor.courses.add(order.courseId._id.toString());
                }
            });

            const topInstructors = Array.from(instructorRevenue.values())
                .map(instructor => ({
                    ...instructor,
                    courses: instructor.courses.size
                }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 20);

            res.status(200).json({
                success: true,
                data: {
                    totalOrders,
                    totalRevenue,
                    pendingOrders,
                    completedOrders,
                    cancelledOrders,
                    refundedOrders,
                    averageOrderValue,
                    monthlyRevenue,
                    recentOrders,
                    orders: filteredOrders,
                    revenueByMonth,
                    ordersByStatus,
                    topCourses,
                    topInstructors
                }
            });

        } catch (error: any) {
            console.error("Get Admin Orders Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch orders data", 500));
        }
    }
);

/** Phase 8: Stripe overview – platform balance, recent transfers, failed withdrawals. */
export const getStripeOverview = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [balanceResult, transfersResult, withdrawals] = await Promise.all([
                getPlatformBalance(),
                listRecentTransfers(15),
                WithdrawalModel.find({ status: 'failed' })
                    .populate('userId', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .lean(),
            ]);

            const balance = 'error' in balanceResult ? null : balanceResult;
            const balanceError = 'error' in balanceResult ? (balanceResult as { error: string }).error : null;
            const transfers = 'error' in transfersResult ? [] : transfersResult.transfers;

            res.status(200).json({
                success: true,
                balance: balance ? { available: balance.available, pending: balance.pending, currency: balance.currency } : null,
                balanceError,
                transfers,
                failedWithdrawals: withdrawals.map((w: any) => ({
                    _id: w._id,
                    userId: w.userId,
                    amount: w.amount,
                    stripePayoutId: w.stripePayoutId,
                    createdAt: w.createdAt,
                })),
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message || "Failed to fetch Stripe overview", 500));
        }
    }
);

/** Phase 7: Get failed withdrawals for admin review. */
export const getFailedWithdrawals = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const withdrawals = await WithdrawalModel.find({ status: 'failed' })
                .populate('userId', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();

            res.status(200).json({
                success: true,
                withdrawals: withdrawals.map((w: any) => ({
                    _id: w._id,
                    userId: w.userId,
                    amount: w.amount,
                    currency: w.currency,
                    stripePayoutId: w.stripePayoutId,
                    status: w.status,
                    createdAt: w.createdAt,
                })),
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message || "Failed to fetch failed withdrawals", 500));
        }
    }
);
