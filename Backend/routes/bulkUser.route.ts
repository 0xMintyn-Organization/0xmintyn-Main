import express from "express";
import { createBulkUsers } from "../controllers/bulkUser.controller";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";
import { isAthenticated } from "../utils/auth";
import { requireAdmin } from "../middleware/roleAuth";

const router = express.Router();

// Bulk user creation route (Admin only)
router.post("/create-bulk-users", updateAccessTokenMiddleware, isAthenticated, requireAdmin, createBulkUsers);

export default router;
