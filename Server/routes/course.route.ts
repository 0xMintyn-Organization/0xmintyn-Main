import express from "express";
import { createCourse, getAllCourses } from "../controllers/course.controller";
import { isAthenticated } from "../utils/auth";
import upload from "../middleware/multerConfig";

const router = express.Router();

// Course creation with thumbnail upload
router.post(
  "/create",
  isAthenticated,
  upload.single("thumbnail"),
  createCourse
);

router.get("/", isAthenticated, getAllCourses);

export default router;