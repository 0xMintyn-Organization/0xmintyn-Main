import express from "express";
import { createCourse, getAllCourses, getCourseById } from "../controllers/course.controller";
import { isAthenticated } from "../utils/auth";
import upload from "../middleware/multerConfig";
import { updateAccessToken } from "../controllers/user.controller";

const router = express.Router();

// Course creation with thumbnail upload
router.post(
  "/create",
  isAthenticated,
  updateAccessToken,
  upload.single("thumbnail"),
  createCourse
);

router.get("/", isAthenticated, getAllCourses);

router.get("/:id", isAthenticated, getCourseById);

export default router;