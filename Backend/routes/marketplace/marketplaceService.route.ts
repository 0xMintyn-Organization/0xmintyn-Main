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
import { isAthenticated, authorizeRoles, authorizeSeller } from "../../utils/auth";
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

// Protected Routes - Seller & Admin (any role with isSeller:true can access)
marketplaceServiceRouter.post(
    "/create",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    upload.array("images", 5),
    createMarketplaceService
);

marketplaceServiceRouter.get(
    "/seller/my-services",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    getSellerServices
);

marketplaceServiceRouter.put(
    "/:serviceId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    updateMarketplaceService
);

marketplaceServiceRouter.delete(
    "/:serviceId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    deleteMarketplaceService
);

marketplaceServiceRouter.patch(
    "/:serviceId/toggle-status",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
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
