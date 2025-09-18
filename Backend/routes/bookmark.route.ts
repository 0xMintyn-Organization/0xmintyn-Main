import express from "express";
import { 
  addBookmark, 
  removeBookmark, 
  getUserBookmarks, 
  checkBookmarkStatus,
  getBookmarkCount 
} from "../controllers/bookmark.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";

const router = express.Router();

// Add bookmark
router.post("/add", updateAccessTokenMiddleware, isAthenticated, addBookmark);

// Remove bookmark
router.delete("/remove/:courseId", updateAccessTokenMiddleware, isAthenticated, removeBookmark);

// Get user bookmarks
router.get("/my-bookmarks", updateAccessTokenMiddleware, isAthenticated, getUserBookmarks);

// Check bookmark status
router.get("/status/:courseId", updateAccessTokenMiddleware, isAthenticated, checkBookmarkStatus);

// Get bookmark count
router.get("/count", updateAccessTokenMiddleware, isAthenticated, getBookmarkCount);

export default router;
