import express from "express";
import { 
    sendMessageToSeller,
    getSentMessages,
    getReceivedMessages,
    markMessageAsRead,
    deleteMessage,
    getUnreadCount
} from "../../controllers/marketplace/marketplaceMessage.controller";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated } from "../../utils/auth";

const marketplaceMessageRouter = express.Router();

// All routes require authentication
marketplaceMessageRouter.use(updateAccessTokenMiddleware, isAthenticated);

// Send message to seller
marketplaceMessageRouter.post("/send", sendMessageToSeller);

// Get sent messages
marketplaceMessageRouter.get("/sent", getSentMessages);

// Get received messages (inbox)
marketplaceMessageRouter.get("/inbox", getReceivedMessages);

// Get unread count
marketplaceMessageRouter.get("/unread-count", getUnreadCount);

// Mark message as read
marketplaceMessageRouter.patch("/:messageId/read", markMessageAsRead);

// Delete message
marketplaceMessageRouter.delete("/:messageId", deleteMessage);

export default marketplaceMessageRouter;

