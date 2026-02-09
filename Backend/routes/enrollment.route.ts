import express from "express";
import { 
  enrollInCourse, 
  createPaymentIntent,
  confirmEnroll,
  getUserEnrolledCourses, 
  checkEnrollment, 
  checkCourseAccess,
  getAllOrders, 
  getOrderDetails, 
  updateOrderStatus,
  markLectureComplete,
  getCourseProgress
} from "../controllers/enrollment.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/roleAuth";

const router = express.Router();

// Course enrollment routes
router.post("/enroll/:courseId", updateAccessTokenMiddleware, isAthenticated, enrollInCourse);
router.post("/create-payment-intent/:courseId", updateAccessTokenMiddleware, isAthenticated, createPaymentIntent);
router.post("/confirm-enroll/:courseId", updateAccessTokenMiddleware, isAthenticated, confirmEnroll);
router.get("/my-courses", updateAccessTokenMiddleware, isAthenticated, getUserEnrolledCourses);
router.get("/check/:courseId", updateAccessTokenMiddleware, isAthenticated, checkEnrollment);
router.get("/access/:courseId", updateAccessTokenMiddleware, isAthenticated, checkCourseAccess);

// Order management routes (Admin only)
router.get("/orders", updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAllOrders);
router.get("/orders/:orderId", updateAccessTokenMiddleware, isAthenticated, getOrderDetails);
router.put("/orders/:orderId/status", updateAccessTokenMiddleware, isAthenticated, requireAdmin, updateOrderStatus);

// Progress tracking routes
router.post("/progress/:courseId/:lectureId/complete", updateAccessTokenMiddleware, isAthenticated, markLectureComplete);
router.get("/progress/:courseId", updateAccessTokenMiddleware, isAthenticated, getCourseProgress);

export default router;
