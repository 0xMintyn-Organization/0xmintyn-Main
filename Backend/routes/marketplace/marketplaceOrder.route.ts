import express from "express";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated } from "../../utils/auth";
import upload from "../../middleware/multerConfig";
import { 
  createMarketplaceOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getPurchasedItems,
  getUserPurchasedItems,
  getOrderStatistics,
  deliverOrder,
  downloadDeliveryFile,
  getDeliveryFiles
} from "../../controllers/marketplace/marketplaceOrder.controller";

const marketplaceOrderRouter = express.Router();

// Create a new order
marketplaceOrderRouter.post(
  "/create",
  updateAccessTokenMiddleware,
  isAthenticated,
  createMarketplaceOrder
);

// Get buyer's orders
marketplaceOrderRouter.get(
  "/buyer",
  updateAccessTokenMiddleware,
  isAthenticated,
  getBuyerOrders
);

// Get seller's orders
marketplaceOrderRouter.get(
  "/seller",
  updateAccessTokenMiddleware,
  isAthenticated,
  getSellerOrders
);

// Get order by ID
marketplaceOrderRouter.get(
  "/:orderId",
  updateAccessTokenMiddleware,
  isAthenticated,
  getOrderById
);

// Update order status
marketplaceOrderRouter.put(
  "/:orderId/status",
  updateAccessTokenMiddleware,
  isAthenticated,
  updateOrderStatus
);

// Cancel order
marketplaceOrderRouter.put(
  "/:orderId/cancel",
  updateAccessTokenMiddleware,
  isAthenticated,
  cancelOrder
);

// Get purchased items
marketplaceOrderRouter.get(
  "/purchased/items",
  updateAccessTokenMiddleware,
  isAthenticated,
  getPurchasedItems
);

// Get user's purchased items from user model
marketplaceOrderRouter.get(
  "/user/purchased",
  updateAccessTokenMiddleware,
  isAthenticated,
  getUserPurchasedItems
);

// Get order statistics
marketplaceOrderRouter.get(
  "/statistics/overview",
  updateAccessTokenMiddleware,
  isAthenticated,
  getOrderStatistics
);

// Deliver order (seller only)
marketplaceOrderRouter.post(
  "/:orderId/deliver",
  updateAccessTokenMiddleware,
  isAthenticated,
  upload.array("deliveryFiles", 10),
  deliverOrder
);

// Get delivery files (buyer only)
marketplaceOrderRouter.get(
  "/:orderId/delivery-files",
  updateAccessTokenMiddleware,
  isAthenticated,
  getDeliveryFiles
);

// Download delivery file (buyer only)
marketplaceOrderRouter.get(
  "/:orderId/download/:fileId",
  updateAccessTokenMiddleware,
  isAthenticated,
  downloadDeliveryFile
);

export default marketplaceOrderRouter;
