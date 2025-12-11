import express from 'express';
import { diditWebhook, getKycStatus, startKyc } from '../controllers/kyc.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';

const router = express.Router();

router.get('/status', updateAccessTokenMiddleware, isAuthenticated, getKycStatus);
router.post('/start', updateAccessTokenMiddleware, isAuthenticated, startKyc);
// Public webhook endpoint (Didit callback) - supports both GET (query params) and POST (body)
router.get('/webhook', diditWebhook);
router.post('/webhook', diditWebhook);

export default router;

