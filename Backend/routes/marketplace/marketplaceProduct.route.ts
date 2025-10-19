import express from "express";
import { 
    createMarketplaceProduct,
    getAllMarketplaceProducts,
    getMarketplaceProductById,
    getSellerProducts,
    updateMarketplaceProduct,
    deleteMarketplaceProduct,
    toggleMarketplaceProductStatus,
    approveMarketplaceProduct
} from "../../controllers/marketplace/marketplaceProduct.controller";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated, authorizeRoles } from "../../utils/auth";
import { optionalAuth } from "../../middleware/authWithRefresh";
import upload from "../../middleware/multerConfig";

const marketplaceProductRouter = express.Router();

// Public Routes (with optional authentication for ownership checks)
marketplaceProductRouter.get("/", getAllMarketplaceProducts);
marketplaceProductRouter.get(
    "/:productId", 
    optionalAuth,  // Optional auth - won't fail if no token
    getMarketplaceProductById
);

// Protected Routes - Seller & Admin
marketplaceProductRouter.post(
    "/create",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // user with isSeller:true can create (checked in controller)
    upload.array("images", 5),
    createMarketplaceProduct
);

marketplaceProductRouter.get(
    "/seller/my-products",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    getSellerProducts
);

marketplaceProductRouter.put(
    "/:productId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    updateMarketplaceProduct
);

marketplaceProductRouter.delete(
    "/:productId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    deleteMarketplaceProduct
);

marketplaceProductRouter.patch(
    "/:productId/toggle-status",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin", "user"), // seller/admin only
    toggleMarketplaceProductStatus
);

// Admin Only Routes
marketplaceProductRouter.patch(
    "/:productId/approve",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeRoles("admin"),
    approveMarketplaceProduct
);

export default marketplaceProductRouter;
