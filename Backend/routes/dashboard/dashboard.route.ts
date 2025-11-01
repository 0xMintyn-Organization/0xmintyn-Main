import express from "express";
import {
  getTotalUsers,
  getTotalInstructors,
  getTotalCourses,
  getTotalProducts,
  getTotalServices,
  getAvgRating,
  getTopInstructors,
  getTopProducts,
  getTopServices,
  getTopSellers,
  getTrendingCategories,
  getRecentActivity
} from "../../controllers/dashboard/dashboard.controller";

const dashboardRouter = express.Router();

// Public routes (no authentication required for dashboard stats)
dashboardRouter.get("/totalusers", getTotalUsers);
dashboardRouter.get("/totalinstructors", getTotalInstructors);
dashboardRouter.get("/totalcourses", getTotalCourses);
dashboardRouter.get("/totalproducts", getTotalProducts);
dashboardRouter.get("/totalservices", getTotalServices);
dashboardRouter.get("/avgrating", getAvgRating);
dashboardRouter.get("/topinstructors", getTopInstructors);
dashboardRouter.get("/topproducts", getTopProducts);
dashboardRouter.get("/topservices", getTopServices);
dashboardRouter.get("/topsellers", getTopSellers);
dashboardRouter.get("/trendingcategories", getTrendingCategories);
dashboardRouter.get("/recentactivity", getRecentActivity);

export default dashboardRouter;

