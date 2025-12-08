import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import UserModel from "../models/user.mode";
import ErrorHandler from "../utils/errorHandler";

// Get influencer analytics - View only, no edit/delete
export const getInfluencerAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get all users with their basic statistics (view only)
            // NOTE: We need createdAt for growth calculations, so we include it
            const users = await UserModel.find({})
                .select('-password -updatedAt -__v')
                .sort({ createdAt: -1 });

            // Calculate user statistics
            const totalUsers = users.length;
            const activeUsers = totalUsers; // All users are considered active
            
            // Calculate new users this month
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            const newUsersThisMonth = users.filter(user => {
                if (!user.createdAt) return false;
                const userDate = user.createdAt instanceof Date 
                    ? user.createdAt 
                    : new Date(user.createdAt);
                return userDate >= currentMonth;
            }).length;

            // Calculate new users this week
            const currentWeek = new Date();
            currentWeek.setDate(currentWeek.getDate() - 7);
            currentWeek.setHours(0, 0, 0, 0);
            const newUsersThisWeek = users.filter(user => {
                if (!user.createdAt) return false;
                const userDate = user.createdAt instanceof Date 
                    ? user.createdAt 
                    : new Date(user.createdAt);
                return userDate >= currentWeek;
            }).length;

            // Calculate new users today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newUsersToday = users.filter(user => {
                if (!user.createdAt) return false;
                const userDate = user.createdAt instanceof Date 
                    ? user.createdAt 
                    : new Date(user.createdAt);
                return userDate >= today;
            }).length;

            // Group users by role (only user counts, no details)
            const usersByRole = {
                users: users.filter(user => user.role === 'user').length,
                instructors: users.filter(user => user.role === 'instructor').length,
                admins: users.filter(user => user.role === 'admin').length,
                influencers: users.filter(user => user.role === 'influencer').length
            };

            // Get verified vs unverified users
            const verifiedUsers = users.filter(user => user.isVerified).length;
            const unverifiedUsers = totalUsers - verifiedUsers;

            // Get recent registrations (last 20) - ONLY user details
            const recentRegistrations = users.slice(0, 20).map(user => ({
                _id: user._id,
                firstName: user.firstName || 'Unknown',
                lastName: user.lastName || 'User',
                email: user.email || 'unknown@example.com',
                username: user.username || 'unknown',
                avatar: user.avatar,
                role: user.role || 'user',
                isVerified: user.isVerified || false,
                createdAt: user.createdAt,
                nationality: user.nationality || 'Unknown',
                age: user.age || 0
            }));

            // Generate user growth data (last 12 months)
            const userGrowth = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date();
                monthStart.setMonth(monthStart.getMonth() - i);
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                monthEnd.setDate(0);
                monthEnd.setHours(23, 59, 59, 999);

                const monthUsers = users.filter(user => {
                    if (!user.createdAt) return false;
                    // Handle both Date objects and ISO strings
                    const userDate = user.createdAt instanceof Date 
                        ? user.createdAt 
                        : new Date(user.createdAt);
                    return userDate >= monthStart && userDate <= monthEnd;
                });

                userGrowth.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    users: monthUsers.length,
                    total: monthUsers.length
                });
            }

            // Generate user growth data (last 30 days - daily)
            const dailyGrowth = [];
            for (let i = 29; i >= 0; i--) {
                const dayStart = new Date();
                dayStart.setDate(dayStart.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);

                const dayUsers = users.filter(user => {
                    if (!user.createdAt) return false;
                    // Handle both Date objects and ISO strings
                    const userDate = user.createdAt instanceof Date 
                        ? user.createdAt 
                        : new Date(user.createdAt);
                    return userDate >= dayStart && userDate <= dayEnd;
                });

                dailyGrowth.push({
                    date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    users: dayUsers.length
                });
            }

            // Get user demographics by nationality
            const demographics = await UserModel.aggregate([
                {
                    $group: {
                        _id: "$nationality",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            const userDemographics = demographics.map(demo => ({
                country: demo._id || "Unknown",
                users: demo.count,
                percentage: ((demo.count / totalUsers) * 100).toFixed(1)
            }));

            // Get age distribution
            const ageGroups = await UserModel.aggregate([
                {
                    $bucket: {
                        groupBy: "$age",
                        boundaries: [0, 18, 25, 35, 45, 55, 65, 100],
                        default: "65+",
                        output: {
                            count: { $sum: 1 }
                        }
                    }
                }
            ]);

            // Ensure we always have data arrays (even if empty) for charts to render
            console.log('User Growth Data:', userGrowth);
            console.log('Daily Growth Data:', dailyGrowth);
            console.log('Total Users:', totalUsers);

            // Response data (view only - no edit/delete capabilities)
            // ONLY user data - NO courses, instructors, wallet, or financial information
            res.status(200).json({
                success: true,
                message: "Influencer analytics data fetched successfully",
                data: {
                    overview: {
                        totalUsers,
                        activeUsers,
                        newUsersToday,
                        newUsersThisWeek,
                        newUsersThisMonth,
                        verifiedUsers,
                        unverifiedUsers
                    },
                    usersByRole,
                    recentRegistrations,
                    userGrowth: userGrowth || [],
                    dailyGrowth: dailyGrowth || [],
                    userDemographics: userDemographics || [],
                    ageGroups: ageGroups.map(group => ({
                        ageRange: group._id,
                        count: group.count,
                        percentage: totalUsers > 0 ? ((group.count / totalUsers) * 100).toFixed(1) : '0.0'
                    }))
                },
                generatedAt: new Date().toISOString()
            });

        } catch (error: any) {
            console.error("Get Influencer Analytics Error:", error);
            return next(new ErrorHandler(error.message || "Failed to fetch influencer analytics data", 500));
        }
    }
);

