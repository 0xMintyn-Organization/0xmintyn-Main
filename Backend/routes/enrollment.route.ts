import express from "express";
import { 
  enrollInCourse, 
  getUserEnrolledCourses, 
  checkEnrollment, 
  getAllOrders, 
  getOrderDetails, 
  updateOrderStatus 
} from "../controllers/enrollment.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessToken } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/roleAuth";

const router = express.Router();

// Course enrollment routes
router.post("/enroll/:courseId", updateAccessToken, isAthenticated, enrollInCourse);
router.get("/my-courses", updateAccessToken, isAthenticated, getUserEnrolledCourses);
router.get("/check/:courseId", updateAccessToken, isAthenticated, checkEnrollment);

// Order management routes (Admin only)
router.get("/orders", updateAccessToken, isAthenticated, requireAdmin, getAllOrders);
router.get("/orders/:orderId", updateAccessToken, isAthenticated, getOrderDetails);
router.put("/orders/:orderId/status", updateAccessToken, isAthenticated, requireAdmin, updateOrderStatus);

export default router;
