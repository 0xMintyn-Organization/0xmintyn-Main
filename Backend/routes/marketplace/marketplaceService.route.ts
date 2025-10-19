import express from "express";
import { 
    createMarketplaceService,
    getAllMarketplaceServices,
    getMarketplaceServiceById,
    getSellerServices,
    updateMarketplaceService,
    deleteMarketplaceService,
    toggleMarketplaceServiceStatus,
    approveMarketplaceService
} from "../../controllers/marketplace/marketplaceService.controller";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated, authorizeRoles } from "../../utils/auth";
import { optionalAuth } from "../../middleware/authWithRefresh";
import upload from "../../middleware/multerConfig";

const marketplaceServiceRouter = express.Router();

// Public Routes (with optional authentication for ownership checks)
marketplaceServiceRouter.get("/", getAllMarketplaceServices);
marketplaceServiceRouter.get(
    "/:serviceId", 
    optionalAuth,  // Optional auth - won't fail if no token
    getMarketplaceServiceById
);

// Protected Routes - Seller & Admin
marketplaceServiceRouter.post(
    "/create",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // user with isSeller:true can create (checked in controller)
    upload.array("images", 5),
    createMarketplaceService
);

marketplaceServiceRouter.get(
    "/seller/my-services",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    getSellerServices
);

marketplaceServiceRouter.put(
    "/:serviceId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    updateMarketplaceService
);

marketplaceServiceRouter.delete(
    "/:serviceId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    deleteMarketplaceService
);

marketplaceServiceRouter.patch(
    "/:serviceId/toggle-status",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    toggleMarketplaceServiceStatus
);

// Admin Only Routes
marketplaceServiceRouter.patch(
    "/:serviceId/approve",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin"),
    approveMarketplaceService
);

export default marketplaceServiceRouter;
