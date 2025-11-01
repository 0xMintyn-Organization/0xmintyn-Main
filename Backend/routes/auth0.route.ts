import express from 'express';
import {
    getAuth0LoginUrl,
    handleAuth0Callback,
    linkSocialAccount,
    unlinkSocialAccount,
} from '../controllers/auth0.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';

const auth0Router = express.Router();

// Get Auth0 login URL
auth0Router.get('/auth0/login', getAuth0LoginUrl);

// Handle Auth0 callback
auth0Router.get('/auth/callback', handleAuth0Callback);

// Link social account (requires authentication)
auth0Router.post('/auth0/link', updateAccessTokenMiddleware, isAuthenticated, linkSocialAccount);

// Unlink social account (requires authentication)
auth0Router.post('/auth0/unlink', updateAccessTokenMiddleware, isAuthenticated, unlinkSocialAccount);

export default auth0Router;


