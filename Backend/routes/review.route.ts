import express from "express";
import { 
  getCourseReviews, 
  createReview, 
  updateReview, 
  deleteReview, 
  canUserReview 
} from "../controllers/review.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";

const router = express.Router();

// Get all reviews for a course (public)
router.get("/course/:courseId", getCourseReviews);

// Check if user can review a course
router.get("/can-review/:courseId", updateAccessTokenMiddleware, isAthenticated, canUserReview);

// Create a new review (authenticated users only)
router.post("/create", updateAccessTokenMiddleware, isAthenticated, createReview);

// Update a review (authenticated users only)
router.put("/:reviewId", updateAccessTokenMiddleware, isAthenticated, updateReview);

// Delete a review (authenticated users only)
router.delete("/:reviewId", updateAccessTokenMiddleware, isAthenticated, deleteReview);

export default router;
