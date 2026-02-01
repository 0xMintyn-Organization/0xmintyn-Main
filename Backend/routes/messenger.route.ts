import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import { listMyConversations, getOrCreateConversation } from '../controllers/conversation.controller';
import { listMessages, sendMessage } from '../controllers/message.controller';

const router = express.Router();

router.get('/conversations', updateAccessTokenMiddleware, isAuthenticated, listMyConversations);
router.post('/conversations', updateAccessTokenMiddleware, isAuthenticated, getOrCreateConversation);
router.get('/conversations/:conversationId/messages', updateAccessTokenMiddleware, isAuthenticated, listMessages);
router.post('/conversations/:conversationId/messages', updateAccessTokenMiddleware, isAuthenticated, sendMessage);

export default router;
