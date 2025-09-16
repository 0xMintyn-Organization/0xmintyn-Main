import { Request, Response, NextFunction } from "express";
import { CourseModel } from "../models/course.model";
import UserModel from "../models/user.mode";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Get comprehensive analytics data
export const getAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { timeRange = "last30days", courseId } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case "last7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "last90days":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "last365days":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get all analytics data in parallel
      const [
        courseStats,
        userStats,
        categoryStats,
        levelStats,
        ratingStats,
        recentCourses,
        topCourses,
        userGrowth,
        courseGrowth
      ] = await Promise.all([
        getCourseStatistics(startDate, courseId as string),
        getUserStatistics(startDate),
        getCategoryStatistics(),
        getLevelStatistics(),
        getRatingStatistics(),
        getRecentCourses(startDate),
        getTopCourses(),
        getUserGrowthData(startDate),
        getCourseGrowthData(startDate)
      ]);

      const analytics = {
        overview: {
          totalCourses: courseStats.totalCourses,
          totalUsers: userStats.totalUsers,
          totalRevenue: 0, // Will be calculated when orders are available
          averageRating: ratingStats.averageRating,
          totalReviews: ratingStats.totalReviews,
          newCoursesThisPeriod: courseStats.newCourses,
          newUsersThisPeriod: userStats.newUsers,
          totalWatchHours: courseStats.totalWatchHours,
          averageWatchTime: courseStats.averageWatchTime
        },
        coursePerformance: topCourses,
        categoryDistribution: categoryStats,
        levelDistribution: levelStats,
        userDemographics: userStats.demographics,
        recentActivity: recentCourses,
        growthMetrics: {
          userGrowth,
          courseGrowth
        },
        engagementMetrics: {
          averageWatchTime: courseStats.averageWatchTime,
          totalWatchHours: courseStats.totalWatchHours,
          averageCompletionTime: courseStats.averageCompletionTime,
          discussionPosts: 0, // Will be implemented when discussion system is added
          assignmentsSubmitted: 0 // Will be implemented when assignment system is added
        }
      };

      res.status(200).json({
        success: true,
        message: "Analytics data fetched successfully",
        analytics,
        timeRange,
        generatedAt: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Analytics Error:", error);
      return next(new ErrorHandler("Failed to fetch analytics data", 500));
    }
  }
);

// Get course statistics
async function getCourseStatistics(startDate: Date, courseId?: string, courseIds?: string[]) {
  const matchQuery: any = { createdAt: { $gte: startDate } };
  if (courseId) {
    matchQuery._id = courseId;
  }
  if (courseIds && courseIds.length > 0) {
    matchQuery._id = { $in: courseIds };
  }

  const stats = await CourseModel.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        averageRating: { $avg: "$averageRating" },
        totalReviews: { $sum: "$totalReviews" },
        totalWatchHours: { $sum: { $multiply: ["$totalReviews", 2.5] } }, // Estimated
        averageWatchTime: { $avg: { $multiply: ["$totalReviews", 2.5] } },
        averageCompletionTime: { $avg: { $multiply: ["$totalReviews", 1.8] } }
      }
    }
  ]);

  const allCourses = await CourseModel.countDocuments();
  const newCourses = await CourseModel.countDocuments({ createdAt: { $gte: startDate } });

  return {
    totalCourses: allCourses,
    newCourses,
    averageRating: stats[0]?.averageRating || 0,
    totalReviews: stats[0]?.totalReviews || 0,
    totalWatchHours: stats[0]?.totalWatchHours || 0,
    averageWatchTime: stats[0]?.averageWatchTime || 0,
    averageCompletionTime: stats[0]?.averageCompletionTime || 0
  };
}

// Get user statistics
async function getUserStatistics(startDate: Date) {
  const totalUsers = await UserModel.countDocuments();
  const newUsers = await UserModel.countDocuments({ createdAt: { $gte: startDate } });

  // Get user demographics
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

  return {
    totalUsers,
    newUsers,
    demographics: demographics.map(d => ({
      country: d._id || "Unknown",
      students: d.count,
      percentage: ((d.count / totalUsers) * 100).toFixed(1)
    })),
    ageGroups
  };
}

// Get category statistics
async function getCategoryStatistics() {
  const categories = await CourseModel.aggregate([
    {
      $group: {
        _id: "$categories",
        count: { $sum: 1 },
        averageRating: { $avg: "$averageRating" },
        totalReviews: { $sum: "$totalReviews" }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return categories.map(cat => ({
    category: cat._id || "Uncategorized",
    courses: cat.count,
    averageRating: cat.averageRating?.toFixed(1) || "0.0",
    totalReviews: cat.totalReviews,
    engagementRate: Math.min(95, Math.max(60, (cat.totalReviews / cat.count) * 10))
  }));
}

// Get level statistics
async function getLevelStatistics() {
  const levels = await CourseModel.aggregate([
    {
      $group: {
        _id: "$level",
        count: { $sum: 1 },
        averagePrice: { $avg: "$price" }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return levels.map(level => ({
    level: level._id || "Unknown",
    courses: level.count,
    averagePrice: level.averagePrice?.toFixed(2) || "0.00"
  }));
}

// Get rating statistics
async function getRatingStatistics() {
  const stats = await CourseModel.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$averageRating" },
        totalReviews: { $sum: "$totalReviews" },
        totalCourses: { $sum: 1 }
      }
    }
  ]);

  return {
    averageRating: stats[0]?.averageRating?.toFixed(1) || "0.0",
    totalReviews: stats[0]?.totalReviews || 0,
    totalCourses: stats[0]?.totalCourses || 0
  };
}

// Get recent courses
async function getRecentCourses(startDate: Date, courseIds?: string[]) {
  const matchQuery: any = { createdAt: { $gte: startDate } };
  if (courseIds && courseIds.length > 0) {
    matchQuery._id = { $in: courseIds };
  }
  
  const courses = await CourseModel.find(matchQuery)
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("createdBy", "username avatar")
    .select("name categories level price averageRating totalReviews createdAt");

  return courses.map(course => ({
    id: course._id,
    name: course.name,
    category: course.categories,
    level: course.level,
    price: course.price,
    rating: course.averageRating,
    reviews: course.totalReviews,
    instructor: course.createdBy,
    createdAt: course.createdAt
  }));
}

// Get top courses
async function getTopCourses(courseIds?: string[]) {
  const matchQuery: any = {};
  if (courseIds && courseIds.length > 0) {
    matchQuery._id = { $in: courseIds };
  }
  
  const courses = await CourseModel.find(matchQuery)
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(10)
    .populate("createdBy", "username avatar")
    .select("name categories level price averageRating totalReviews");

  return courses.map(course => ({
    id: course._id,
    name: course.name,
    category: course.categories,
    level: course.level,
    price: course.price,
    rating: course.averageRating,
    reviews: course.totalReviews,
    instructor: course.createdBy,
    engagementRate: Math.min(95, Math.max(60, (course.totalReviews / 10) * 10))
  }));
}

// Get user growth data
async function getUserGrowthData(startDate: Date) {
  const growth = await UserModel.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  return growth.map(item => ({
    date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
    users: item.count
  }));
}

// Get course growth data
async function getCourseGrowthData(startDate: Date, courseIds?: string[]) {
  const matchQuery: any = { createdAt: { $gte: startDate } };
  if (courseIds && courseIds.length > 0) {
    matchQuery._id = { $in: courseIds };
  }
  
  const growth = await CourseModel.aggregate([
    {
      $match: matchQuery
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  return growth.map(item => ({
    date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
    courses: item.count
  }));
}

// Get instructor-specific analytics
export const getInstructorAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instructorId = req.user?._id;
      const { timeRange = "last30days" } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case "last7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "last90days":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get instructor's courses
      const instructorCourses = await CourseModel.find({ createdBy: instructorId });
      const courseIds = instructorCourses.map(course => course._id.toString());

      // Get instructor-specific analytics
      const [
        courseStats,
        recentCourses,
        topCourses,
        courseGrowth
      ] = await Promise.all([
        getCourseStatistics(startDate, undefined, courseIds),
        getRecentCourses(startDate, courseIds),
        getTopCourses(courseIds),
        getCourseGrowthData(startDate, courseIds)
      ]);

      const analytics = {
        overview: {
          totalCourses: instructorCourses.length,
          totalUsers: 0, // Will be calculated when orders are available
          totalRevenue: 0, // Will be calculated when orders are available
          averageRating: courseStats.averageRating,
          totalReviews: courseStats.totalReviews,
          newCoursesThisPeriod: courseStats.newCourses,
          newUsersThisPeriod: 0, // Will be calculated when orders are available
          totalWatchHours: courseStats.totalWatchHours,
          averageWatchTime: courseStats.averageWatchTime
        },
        coursePerformance: topCourses,
        recentActivity: recentCourses,
        growthMetrics: {
          courseGrowth
        },
        engagementMetrics: {
          averageWatchTime: courseStats.averageWatchTime,
          totalWatchHours: courseStats.totalWatchHours,
          averageCompletionTime: courseStats.averageCompletionTime
        }
      };

      res.status(200).json({
        success: true,
        message: "Instructor analytics data fetched successfully",
        analytics,
        timeRange,
        generatedAt: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Instructor Analytics Error:", error);
      return next(new ErrorHandler("Failed to fetch instructor analytics data", 500));
    }
  }
);
