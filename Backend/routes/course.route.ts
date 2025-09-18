import express from "express";
import { createCourse, getAllCourses, getCourseById, getPurchasedCourseById, updateCourse, deleteCourse, getInstructorCourses, createTempProfessionalCourse } from "../controllers/course.controller";
import { isAthenticated } from "../utils/auth";
import upload from "../middleware/multerConfig";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";
import { requireInstructorOrAdmin } from "../middleware/roleAuth";

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

export default router;