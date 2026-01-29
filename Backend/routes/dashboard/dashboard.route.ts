import express from "express";
import {
  getTotalUsers,
  getTotalInstructors,
  getTotalCourses,
  getAvgRating,
  getTopInstructors,
  getTrendingCategories,
  getRecentActivity
} from "../../controllers/dashboard/dashboard.controller";

const dashboardRouter = express.Router();

// Public routes (no authentication required for dashboard stats)
dashboardRouter.get("/totalusers", getTotalUsers);
dashboardRouter.get("/totalinstructors", getTotalInstructors);
dashboardRouter.get("/totalcourses", getTotalCourses);
dashboardRouter.get("/avgrating", getAvgRating);
dashboardRouter.get("/topinstructors", getTopInstructors);
dashboardRouter.get("/trendingcategories", getTrendingCategories);
dashboardRouter.get("/recentactivity", getRecentActivity);

export default dashboardRouter;

