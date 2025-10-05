import express from "express";
import { getProductFile, getProductPreview } from "../../controllers/marketplace/marketplacePurchase.controller";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated } from "../../utils/auth";

const marketplacePurchaseRouter = express.Router();

// Protected Routes - Authenticated users only
marketplacePurchaseRouter.get(
    "/product/:productId/file",
    updateAccessTokenMiddleware,
    isAthenticated,
    getProductFile
);

// Public Routes - Preview only
marketplacePurchaseRouter.get(
    "/product/:productId/preview",
    getProductPreview
);

export default marketplacePurchaseRouter;
