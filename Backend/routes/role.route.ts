import express from "express";
import { 
  getAllUsers, 
  updateUserRole, 
  getUserProfile, 
  updateUserProfile, 
  deleteUser, 
  getRoleDashboard, 
  requestInstructorRole} from "../controllers/role.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/roleAuth";

const router = express.Router();

// Role-based dashboard
router.get("/dashboard", updateAccessTokenMiddleware, isAthenticated, getRoleDashboard);

// User management (Admin only)
router.get("/users", updateAccessTokenMiddleware, isAthenticated, requireAdmin, getAllUsers);
router.put("/users/:userIdrole", updateAccessTokenMiddleware, isAthenticated, requireAdmin, updateUserRole);
router.delete("/users/:userId", updateAccessTokenMiddleware, isAthenticated, requireAdmin, deleteUser);

// User profile management
router.get("/users/:userId", updateAccessTokenMiddleware, isAthenticated, getUserProfile);
router.put("/users/:userId", updateAccessTokenMiddleware, isAthenticated, updateUserProfile);

// Instructor role request
router.post("/request-instructor", updateAccessTokenMiddleware, isAthenticated, requestInstructorRole);

export default router;
