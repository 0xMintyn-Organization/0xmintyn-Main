import express from 'express';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { createApplication, patchApplication, listMyApplications } from '../controllers/application.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const router = express.Router();

router.get('/', updateAccessTokenMiddleware, isAuthenticated, listMyApplications);
router.post('/', updateAccessTokenMiddleware, isAuthenticated, createApplication);
router.patch('/:id', updateAccessTokenMiddleware, isAuthenticated, patchApplication);

export default router;
