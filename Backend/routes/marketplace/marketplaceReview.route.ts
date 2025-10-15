import express from "express";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated } from "../../utils/auth";
import { 
  createReview,
  getSellerReviews,
  checkUserReview
} from "../../controllers/marketplace/marketplaceReview.controller";

const marketplaceReviewRouter = express.Router();

// Check if user has already reviewed an order (protected)
marketplaceReviewRouter.get(
  "/check/:orderId",
  updateAccessTokenMiddleware,
  isAthenticated,
  checkUserReview
);

// Create a review (buyer only, after order completion)
marketplaceReviewRouter.post(
  "/create",
  updateAccessTokenMiddleware,
  isAthenticated,
  createReview
);

// Get seller reviews (public)
marketplaceReviewRouter.get(
  "/seller/:sellerId",
  getSellerReviews
);

export default marketplaceReviewRouter;

