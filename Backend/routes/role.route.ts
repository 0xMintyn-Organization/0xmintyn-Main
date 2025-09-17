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
import { updateAccessToken } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/roleAuth";

const router = express.Router();

// Role-based dashboard
router.get("/dashboard", updateAccessToken, isAthenticated, getRoleDashboard);

// User management (Admin only)
router.get("/users", updateAccessToken, isAthenticated, requireAdmin, getAllUsers);
router.put("/users/:userIdrole", updateAccessToken, isAthenticated, requireAdmin, updateUserRole);
router.delete("/users/:userId", updateAccessToken, isAthenticated, requireAdmin, deleteUser);

// User profile management
router.get("/users/:userId", updateAccessToken, isAthenticated, getUserProfile);
router.put("/users/:userId", updateAccessToken, isAthenticated, updateUserProfile);

// Instructor role request
router.post("/request-instructor", updateAccessToken, isAthenticated, requestInstructorRole);

export default router;
