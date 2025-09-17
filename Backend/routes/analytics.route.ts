import express from "express";
import { getAnalytics, getInstructorAnalytics } from "../controllers/analytics.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessToken } from "../controllers/user.controller";

const router = express.Router();

// Get general analytics (admin/public)
router.get("/", getAnalytics);

// Get instructor-specific analytics
router.get("/instructor", updateAccessToken, isAthenticated, getInstructorAnalytics);

export default router;
