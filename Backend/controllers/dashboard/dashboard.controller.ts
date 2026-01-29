import { Request, Response } from "express";
import UserModel from "../../models/user.mode";
import { CourseModel } from "../../models/course.model";
import OrderModel from "../../models/order.model";
import ReviewModel from "../../models/review.model";

// Get total users count
export const getTotalUsers = async (req: Request, res: Response) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthUsers = await UserModel.countDocuments({
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthUsers > 0 
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(0)
      : "0";

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total users:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total users"
    });
  }
};

// Get total instructors count
export const getTotalInstructors = async (req: Request, res: Response) => {
  try {
    console.log("Fetching total instructors...");
    const totalInstructors = await UserModel.countDocuments({ 
      role: "instructor" 
    });
    console.log("Total instructors found:", totalInstructors);
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthInstructors = await UserModel.countDocuments({
      role: "instructor",
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthInstructors > 0 
      ? ((totalInstructors - lastMonthInstructors) / lastMonthInstructors * 100).toFixed(0)
      : totalInstructors > 0 ? "100" : "0";

    res.status(200).json({
      success: true,
      data: {
        totalInstructors,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total instructors:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total instructors",
      error: error.toString()
    });
  }
};

// Get total courses count
export const getTotalCourses = async (req: Request, res: Response) => {
  try {
    console.log("Fetching total courses...");
    const totalCourses = await CourseModel.countDocuments();
    console.log("Total courses found:", totalCourses);
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthCourses = await CourseModel.countDocuments({
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthCourses > 0 
      ? ((totalCourses - lastMonthCourses) / lastMonthCourses * 100).toFixed(0)
      : totalCourses > 0 ? "100" : "0";

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total courses:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total courses",
      error: error.toString()
    });
  }
};

// Get average rating across courses
export const getAvgRating = async (req: Request, res: Response) => {
  try {
    // Get average ratings
    const courseRatings = await CourseModel.aggregate([
      { $match: { averageRating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: "$averageRating" } } }
    ]);

    const avgRating = courseRatings[0]?.avgRating 
      ? courseRatings[0].avgRating.toFixed(1)
      : "0.0";

    res.status(200).json({
      success: true,
      data: {
        avgRating: parseFloat(avgRating),
        growth: "+0.1",
        change: "+0.1"
      }
    });
  } catch (error: any) {
    console.error("Error fetching average rating:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch average rating"
    });
  }
};

// Get top instructors
export const getTopInstructors = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get all instructors with their course stats
    const instructors = await UserModel.find({ role: "instructor" })
      .select("firstName lastName username avatar isVerified")
      .limit(limit);

    // Get course stats for each instructor
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        const courses = await CourseModel.find({ createdBy: instructor._id });
        const courseIds = courses.map(c => c._id.toString());

        // Calculate total students from orders
        const totalStudents = await OrderModel.countDocuments({
          courseId: { $in: courseIds },
          status: "completed"
        });

        // Calculate average rating from reviews
        const reviews = await ReviewModel.find({
          courseId: { $in: courseIds }
        });
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        // Calculate total revenue
        const orders = await OrderModel.find({
          courseId: { $in: courseIds },
          status: "completed"
        });
        const totalRevenue = orders.reduce((sum, o) => sum + (o.coursePrice || 0), 0);

        return {
          id: instructor._id.toString(),
          name: `${instructor.firstName} ${instructor.lastName}`,
          username: instructor.username,
          avatar: instructor.avatar || `https://ui-avatars.com/api/?name=${instructor.firstName}+${instructor.lastName}&background=random`,
          rating: avgRating.toFixed(1),
          students: totalStudents,
          courses: courses.length,
          revenue: totalRevenue,
          verified: instructor.isVerified || false,
          badge: avgRating >= 4.8 ? "Top Rated" : avgRating >= 4.5 ? "Expert" : "Instructor",
          level: avgRating >= 4.8 ? "Pro" : avgRating >= 4.5 ? "Level 2" : "Level 1"
        };
      })
    );

    // Sort by students enrolled (popularity) and limit
    const topInstructors = instructorsWithStats
      .sort((a, b) => b.students - a.students)
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        instructors: topInstructors
      }
    });
  } catch (error: any) {
    console.error("Error fetching top instructors:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top instructors"
    });
  }
};

// Get trending categories
export const getTrendingCategories = async (req: Request, res: Response) => {
  try {
    // Get course categories
    const courseCategories = await CourseModel.aggregate([
      { $match: {} },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Convert to array and sort
    const trendingCategories = courseCategories
      .filter((cat) => cat._id)
      .map((cat) => ({ name: cat._id, count: cat.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        categories: trendingCategories
      }
    });
  } catch (error: any) {
    console.error("Error fetching trending categories:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch trending categories"
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent course enrollments (orders)
    const recentOrders = await OrderModel.find({
      status: "completed"
    })
      .populate("userId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent reviews
    const recentReviews = await ReviewModel.find()
      .populate("userId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Format activities
    const activities = [];

    recentOrders.forEach((order) => {
      activities.push({
        id: `order-${order._id}`,
        type: "course_completed",
        user: `${order.userId?.firstName || ""} ${order.userId?.lastName || ""}`.trim() || order.userId?.username || "User",
        action: "completed",
        item: order.courseName || "Course",
        time: formatTimeAgo(order.createdAt),
        icon: "CheckCircle",
        color: "text-slate-400"
      });
    });

    recentReviews.forEach((review) => {
      activities.push({
        id: `review-${review._id}`,
        type: "review_added",
        user: `${review.userId?.firstName || ""} ${review.userId?.lastName || ""}`.trim() || review.userId?.username || "User",
        action: "reviewed",
        item: review.courseId ? "Course" : "Item",
        time: formatTimeAgo(review.createdAt),
        icon: "Star",
        color: "text-slate-400"
      });
    });

    // Sort by timestamp (most recent first) and limit
    const sortedActivities = activities
      .sort((a, b) => {
        // Extract minutes/hours/days from time string for sorting
        const getTimeValue = (timeStr: string): number => {
          if (timeStr.includes("seconds")) return 1;
          if (timeStr.includes("minutes")) {
            const mins = parseInt(timeStr.match(/\d+/)?.[0] || "0");
            return 100 + mins;
          }
          if (timeStr.includes("hours")) {
            const hours = parseInt(timeStr.match(/\d+/)?.[0] || "0");
            return 10000 + hours;
          }
          if (timeStr.includes("days")) {
            const days = parseInt(timeStr.match(/\d+/)?.[0] || "0");
            return 1000000 + days;
          }
          return 100000000;
        };
        return getTimeValue(b.time) - getTimeValue(a.time);
      })
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        activities: sortedActivities
      }
    });
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recent activity"
    });
  }
};

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

