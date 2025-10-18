import express from "express";
import { 
  createMarketplaceSeller,
  getMarketplaceSeller,
  updateMarketplaceSeller,
  deleteMarketplaceSeller,
  getAllMarketplaceSellers,
  getMarketplaceSellerById,
  checkSellerProfileStatus
} from "../../controllers/marketplace/marketplaceSeller.controller";
import { isAthenticated } from "../../utils/auth";
import upload from "../../middleware/multerConfig";


const marketplaceSellerRouter = express.Router();

// Public routes
marketplaceSellerRouter.get("/", getAllMarketplaceSellers);
marketplaceSellerRouter.get("/:sellerId", getMarketplaceSellerById);

// Protected routes (require authentication)
marketplaceSellerRouter.post("/create", isAthenticated, upload.single('storeLogo'), createMarketplaceSeller);
marketplaceSellerRouter.get("/profile/me", isAthenticated, getMarketplaceSeller);
marketplaceSellerRouter.get("/profile/status", isAthenticated, checkSellerProfileStatus);
marketplaceSellerRouter.put("/profile/me", isAthenticated, upload.single('storeLogo'), updateMarketplaceSeller);
marketplaceSellerRouter.delete("/profile/me", isAthenticated, deleteMarketplaceSeller);

export default marketplaceSellerRouter;
