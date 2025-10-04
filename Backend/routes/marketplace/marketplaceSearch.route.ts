import express from "express";
import { searchMarketplace, getMarketplaceStats, getCategoryStats } from "../../controllers/marketplace/marketplaceSearch.controller";

const marketplaceSearchRouter = express.Router();

// Public routes (no authentication required)
marketplaceSearchRouter.get("/search", searchMarketplace);
marketplaceSearchRouter.get("/stats", getMarketplaceStats);
marketplaceSearchRouter.get("/category-stats", getCategoryStats);

export default marketplaceSearchRouter;
