import express from "express";
import { createCourse, getAllCourses, getCourseById, getPurchasedCourseById, updateCourse, deleteCourse, getInstructorCourses, createTempProfessionalCourse, getAdminCourses, updateCourseStatus, deleteCourseAdmin } from "../controllers/course.controller";
import { isAthenticated } from "../utils/auth";
import upload from "../middleware/multerConfig";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";
import { requireInstructorOrAdmin, requireAdmin } from "../middleware/roleAuth";

const router = express.Router();

// Course creation with thumbnail upload (Instructor/Admin only)
router.post(
  "/create",
  updateAccessTokenMiddleware,
  isAthenticated,
  requireInstructorOrAdmin,
  upload.single("thumbnail"),
  createCourse
);

router.get("/", getAllCourses);

router.get("/:id", getCourseById);

router.get("/enrolled-course/:id", isAthenticated, getPurchasedCourseById);

// Instructor course management (Instructor/Admin only)
router.get("/instructor/my-courses", updateAccessTokenMiddleware, isAthenticated, requireInstructorOrAdmin, getInstructorCourses);
router.put("/:id", updateAccessTokenMiddleware, isAthenticated, requireInstructorOrAdmin, upload.single("thumbnail"), updateCourse);
router.delete("/:id", updateAccessTokenMiddleware, isAthenticated, requireInstructorOrAdmin, deleteCourse);

// Temporary API to create professional course (for testing)
router.post("/create-professional",isAthenticated, createTempProfessionalCourse);

// Admin course management (Admin only)
router.get("/admin/all", updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAdminCourses);
router.put("/admin/:id/status", updateAccessTokenMiddleware, isAthenticated, requireAdmin, updateCourseStatus);
router.delete("/admin/:id", updateAccessTokenMiddleware, isAthenticated, requireAdmin, deleteCourseAdmin);

export default router;