import express from 'express';
import { updateAccessTokenMiddleware } from '../../controllers/user.controller';
import { isAthenticated } from '../../utils/auth';
import {
  getBitgetAccount,
  getTradingPairs,
  getTickerPrice,
  getConversionRate,
  getSwapQuote,
  placeSwapOrder,
  getOrderStatus,
} from '../../controllers/swap/bitgetSwap.controller';

const swapRouter = express.Router();

// Public routes (no auth needed for price data)
swapRouter.get('/pairs', getTradingPairs);
swapRouter.get('/ticker/:symbol', getTickerPrice);
swapRouter.get('/rate', getConversionRate);

// Protected routes (require auth for trading)
swapRouter.use(updateAccessTokenMiddleware, isAthenticated);

swapRouter.get('/account', getBitgetAccount);
swapRouter.post('/quote', getSwapQuote); // Get swap quote
swapRouter.post('/order', placeSwapOrder); // Get swap calldata
swapRouter.get('/order/status', getOrderStatus);

export default swapRouter;

