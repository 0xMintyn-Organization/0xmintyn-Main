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
import { isAthenticated, authorizeRoles, authorizeSeller } from "../../utils/auth";
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

// Protected Routes - Seller & Admin (any role with isSeller:true can access)
marketplaceProductRouter.post(
    "/create",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    upload.array("images", 5),
    createMarketplaceProduct
);

marketplaceProductRouter.get(
    "/seller/my-products",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    getSellerProducts
);

marketplaceProductRouter.put(
    "/:productId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    updateMarketplaceProduct
);

marketplaceProductRouter.delete(
    "/:productId",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
    deleteMarketplaceProduct
);

marketplaceProductRouter.patch(
    "/:productId/toggle-status",
    updateAccessTokenMiddleware,
    isAthenticated,
    authorizeSeller, // allows any role if isSeller:true or admin
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
