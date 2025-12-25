import express from 'express';
import { updateAccessTokenMiddleware } from '../../controllers/user.controller';
import { isAthenticated } from '../../utils/auth';
import { rateLimit } from 'express-rate-limit';
import {
  saveMessage,
  getOrderMessages,
  markMessagesAsRead,
} from '../../controllers/p2p/p2pMessage.controller';

const p2pMessageRouter = express.Router();

// Rate limiter for message endpoints
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many message requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// All message routes require authentication
p2pMessageRouter.use(updateAccessTokenMiddleware, isAthenticated, messageLimiter);

// Message management
p2pMessageRouter.post('/', saveMessage);
p2pMessageRouter.get('/order/:orderId', getOrderMessages);
p2pMessageRouter.patch('/order/:orderId/read', markMessagesAsRead);

export default p2pMessageRouter;

