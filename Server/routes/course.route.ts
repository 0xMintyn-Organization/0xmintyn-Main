import express from "express";
import { createCourse, getAllCourses, getCourseById, getPurchasedCourseById, updateCourse, deleteCourse, getInstructorCourses, createTempProfessionalCourse } from "../controllers/course.controller";
import { isAthenticated } from "../utils/auth";
import upload from "../middleware/multerConfig";
import { updateAccessToken } from "../controllers/user.controller";

const router = express.Router();

// Course creation with thumbnail upload
router.post(
  "/create",
  updateAccessToken,
  isAthenticated,
  upload.single("thumbnail"),
  createCourse
);

router.get("/", getAllCourses);

router.get("/:id", getCourseById);

router.get("/enrolled-course/:id", isAthenticated, getPurchasedCourseById);

// Instructor course management
router.get("/instructor/my-courses", updateAccessToken, isAthenticated, getInstructorCourses);
router.put("/:id", updateAccessToken, isAthenticated, upload.single("thumbnail"), updateCourse);
router.delete("/:id", updateAccessToken, isAthenticated, deleteCourse);

// Temporary API to create professional course (for testing)
router.post("/create-professional", createTempProfessionalCourse);

export default router;