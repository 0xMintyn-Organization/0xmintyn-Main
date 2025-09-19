import express from "express";
import { 
  getCourseNote, 
  saveCourseNote, 
  deleteCourseNote 
} from "../controllers/note.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";

const router = express.Router();

// Get user's note for a course (authenticated users only)
router.get("/course/:courseId", updateAccessTokenMiddleware, isAthenticated, getCourseNote);

// Save user's note for a course (authenticated users only)
router.post("/save", updateAccessTokenMiddleware, isAthenticated, saveCourseNote);

// Delete user's note for a course (authenticated users only)
router.delete("/course/:courseId", updateAccessTokenMiddleware, isAthenticated, deleteCourseNote);

export default router;
