import express from 'express';
import { getAllP2POffers, getP2POfferById } from '../../controllers/p2p/p2pOffer.controller';
import { getMerchantProfileByUserId } from '../../controllers/p2p/p2pMerchant.controller';

const p2pOfferRouter = express.Router();

// Public routes (no authentication required for viewing offers)
p2pOfferRouter.get('/', getAllP2POffers);

// IMPORTANT: More specific routes must come before parameterized routes
// Public route to get merchant profile by userId (for buyers to see payment details)
p2pOfferRouter.get('/merchant/:userId', getMerchantProfileByUserId);

// Get offer by ID (must come after /merchant/:userId to avoid route conflicts)
p2pOfferRouter.get('/:offerId', getP2POfferById);

export default p2pOfferRouter;

