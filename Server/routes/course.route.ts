import express from "express";
import { createCourse, getAllCourses, getCourseById, getPurchasedCourseById } from "../controllers/course.controller";
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

router.get("/", isAthenticated, getAllCourses);

router.get("/:id", isAthenticated, getCourseById);

router.get("/enrolled-course/:id", isAthenticated, getPurchasedCourseById);

export default router;