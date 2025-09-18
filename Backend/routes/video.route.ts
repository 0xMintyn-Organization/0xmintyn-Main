import express from "express";
import { 
  getSignedVideoUrl, 
  streamVideo, 
  getCourseVideos 
} from "../controllers/video.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";

const router = express.Router();

// Get signed URL for video access (requires authentication and course access)
router.get("/signed-url/:courseId/:videoId", updateAccessTokenMiddleware, isAthenticated, getSignedVideoUrl);

// Stream video with signed token (no additional auth needed as token contains user info)
router.get("/stream/:token", streamVideo);

// Get course videos with access control
router.get("/course/:courseId", updateAccessTokenMiddleware, isAthenticated, getCourseVideos);

export default router;
