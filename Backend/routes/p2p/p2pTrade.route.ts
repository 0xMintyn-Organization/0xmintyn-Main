import express from 'express';
import { updateAccessTokenMiddleware } from '../../controllers/user.controller';
import { isAthenticated } from '../../utils/auth';
import {
  createP2PTrade,
  getMyTrades,
  getTradeById,
} from '../../controllers/p2p/p2pTrade.controller';

const p2pTradeRouter = express.Router();

// All trade routes require authentication
p2pTradeRouter.use(updateAccessTokenMiddleware, isAthenticated);

// Trade management
p2pTradeRouter.post('/', createP2PTrade);
p2pTradeRouter.get('/', getMyTrades);
p2pTradeRouter.get('/:tradeId', getTradeById);

export default p2pTradeRouter;

