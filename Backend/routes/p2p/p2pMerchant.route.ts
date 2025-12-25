import express from 'express';
import { updateAccessTokenMiddleware } from '../../controllers/user.controller';
import { isAthenticated } from '../../utils/auth';
import {
  getMerchantProfile,
  updateMerchantProfile,
  getMyAds,
  createP2PAd,
  updateP2PAd,
  toggleAdStatus,
  deleteP2PAd,
  duplicateP2PAd,
} from '../../controllers/p2p/p2pMerchant.controller';

const p2pMerchantRouter = express.Router();

// All routes require authentication
p2pMerchantRouter.use(updateAccessTokenMiddleware, isAthenticated);

// Merchant profile routes
p2pMerchantRouter.get('/profile', getMerchantProfile);
p2pMerchantRouter.put('/profile', updateMerchantProfile);

// Ad management routes
p2pMerchantRouter.get('/ads', getMyAds);
p2pMerchantRouter.post('/ads', createP2PAd);
p2pMerchantRouter.put('/ads/:adId', updateP2PAd);
p2pMerchantRouter.patch('/ads/:adId/toggle', toggleAdStatus);
p2pMerchantRouter.delete('/ads/:adId', deleteP2PAd);
p2pMerchantRouter.post('/ads/:adId/duplicate', duplicateP2PAd);

export default p2pMerchantRouter;

