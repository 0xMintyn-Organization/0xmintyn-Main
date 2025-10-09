import express from "express";
import { 
    createCustomOffer,
    getConversationOffers,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    getSentOffers,
    getReceivedOffers
} from "../../controllers/marketplace/marketplaceOffer.controller";
import { updateAccessTokenMiddleware } from "../../controllers/user.controller";
import { isAthenticated } from "../../utils/auth";

const marketplaceOfferRouter = express.Router();

// All routes require authentication
marketplaceOfferRouter.use(updateAccessTokenMiddleware, isAthenticated);

// Create custom offer (Seller only - verified in controller)
marketplaceOfferRouter.post("/create", createCustomOffer);

// Get offers for a specific conversation
marketplaceOfferRouter.get("/conversation/:conversationId", getConversationOffers);

// Get sent offers (as seller)
marketplaceOfferRouter.get("/sent", getSentOffers);

// Get received offers (as buyer)
marketplaceOfferRouter.get("/received", getReceivedOffers);

// Accept offer (Buyer only - verified in controller)
marketplaceOfferRouter.post("/:offerId/accept", acceptOffer);

// Reject offer (Buyer only - verified in controller)
marketplaceOfferRouter.post("/:offerId/reject", rejectOffer);

// Cancel offer (Seller only - verified in controller)
marketplaceOfferRouter.post("/:offerId/cancel", cancelOffer);

export default marketplaceOfferRouter;

