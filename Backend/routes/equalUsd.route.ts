import express from 'express';
import { getBalance, getTransactions } from '../controllers/equalUsd.controller';
import { isAthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';

const router = express.Router();

router.get('/balance', updateAccessTokenMiddleware, isAthenticated, getBalance);
router.get('/transactions', updateAccessTokenMiddleware, isAthenticated, getTransactions);

export default router;
