import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.mode";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { CourseModel } from "../models/course.model";
import OrderModel from "../models/order.model";

// Get all users with role management (Admin only)
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, page = 1, limit = 10, search } = req.query;
      
      // Build query
      const query: any = {};
      if (role && role !== 'all') {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [users, totalUsers] = await Promise.all([
        UserModel.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        UserModel.countDocuments(query)
      ]);

      // Get role statistics
      const roleStats = await UserModel.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalUsers / Number(limit)),
          totalUsers,
          hasNext: skip + Number(limit) < totalUsers,
          hasPrev: Number(page) > 1
        },
        roleStats: roleStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error: any) {
      console.error("Get Users Error:", error);
      return next(new ErrorHandler("Failed to fetch users", 500));
    }
  }
);

// Update user role (Admin only)
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      console.log("Role update request:", { userId, role, user: req.user?._id });

      if (!['user', 'instructor', 'admin'].includes(role)) {
        return next(new ErrorHandler("Invalid role", 400));
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Prevent admin from changing their own role
      if (user._id.toString() === req.user?._id.toString() && role !== 'admin') {
        return next(new ErrorHandler("Cannot change your own role", 400));
      }

      user.role = role;
      await user.save();

      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      console.error("Update Role Error:", error);
      return next(new ErrorHandler("Failed to update user role", 500));
    }
  }
);

// Get user profile with role info
export const getUserProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      
      const user = await UserModel.findById(userId).select('-password');
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check if user can view this profile
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?._id.toString() !== userId) {
        return next(new ErrorHandler("Not authorized to view this profile", 403));
      }

      res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        user
      });
    } catch (error: any) {
      console.error("Get Profile Error:", error);
      return next(new ErrorHandler("Failed to fetch user profile", 500));
    }
  }
);

// Update user profile
export const updateUserProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, bio, avatar, banner } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check if user can update this profile
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?._id.toString() !== userId) {
        return next(new ErrorHandler("Not authorized to update this profile", 403));
      }

      // Update fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (bio) user.bio = bio;
      if (avatar) user.avatar = avatar;
      if (banner) user.banner = banner;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          role: user.role,
          bio: user.bio,
          avatar: user.avatar,
          banner: user.banner,
          isVerified: user.isVerified,
          isSeller: user.isSeller,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      return next(new ErrorHandler("Failed to update profile", 500));
    }
  }
);

// Delete user (Admin only)
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      const user = await UserModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user?._id.toString()) {
        return next(new ErrorHandler("Cannot delete your own account", 400));
      }

      await UserModel.findByIdAndDelete(userId);

      res.status(200).json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error: any) {
      console.error("Delete User Error:", error);
      return next(new ErrorHandler("Failed to delete user", 500));
    }
  }
);

// Get role-based dashboard data
export const getRoleDashboard = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      let dashboardData: any = {};

      switch (user.role) {
        case 'admin':
          dashboardData = await getAdminDashboard();
          break;
        case 'instructor':
          dashboardData = await getInstructorDashboard(user._id);
          break;
        case 'user':
          dashboardData = await getUserDashboard(user._id);
          break;
        default:
          return next(new ErrorHandler("Invalid user role", 400));
      }

      res.status(200).json({
        success: true,
        message: "Dashboard data fetched successfully",
        role: user.role,
        dashboard: dashboardData
      });
    } catch (error: any) {
      console.error("Get Dashboard Error:", error);
      return next(new ErrorHandler("Failed to fetch dashboard data", 500));
    }
  }
);

// Helper functions for dashboard data
async function getAdminDashboard() {
  const [totalUsers, totalInstructors, totalAdmins, recentUsers] = await Promise.all([
    UserModel.countDocuments({ role: 'user' }),
    UserModel.countDocuments({ role: 'instructor' }),
    UserModel.countDocuments({ role: 'admin' }),
    UserModel.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  return {
    totalUsers,
    totalInstructors,
    totalAdmins,
    recentUsers,
    userGrowth: await getUserGrowthData()
  };
}

async function getInstructorDashboard(instructorId: string) {
  // Aggregate instructor-specific stats for the role-based dashboard
  // 1) Courses created by this instructor
  const courses = await CourseModel.find({ createdBy: instructorId }).select(
    "averageRating"
  );

  const totalCourses = courses.length;

  // 2) Unique students from completed orders for this instructor's courses
  const studentsAgg = await OrderModel.aggregate([
    { $match: { instructorId: instructorId.toString(), status: "completed" } },
    { $group: { _id: "$userId" } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  const totalStudents =
    studentsAgg && studentsAgg.length > 0 ? studentsAgg[0].count : 0;

  // 3) Average rating across instructor's courses (using stored averageRating)
  let averageRating = 0;
  if (totalCourses > 0) {
    const sumRatings = courses.reduce(
      (sum, course: any) => sum + (course.averageRating || 0),
      0
    );
    averageRating = Number((sumRatings / totalCourses).toFixed(1));
  }

  return {
    totalCourses,
    totalStudents,
    averageRating,
  };
}

async function getUserDashboard(userId: string) {
  // This would integrate with user's enrolled courses
  return {
    message: "User dashboard data",
    userId
  };
}

async function getUserGrowthData() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const growth = await UserModel.aggregate([
    {
      $match: { createdAt: { $gte: last30Days } }
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

// Request instructor role
export const requestInstructorRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      if (user.role !== 'user') {
        return next(new ErrorHandler("Only regular users can request instructor role", 400));
      }

      // Here you could implement a request system
      
      // For now, we'll just return a message
      res.status(200).json({
        success: true,
        message: "Instructor role request submitted. Admin will review your request."
      });
    } catch (error: any) {
      console.error("Request Instructor Role Error:", error);
      return next(new ErrorHandler("Failed to submit instructor request", 500));
    }
  }
);
