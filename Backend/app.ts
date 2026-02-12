import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { ErrorMiddleware } from './middleware/error';
import { requestIdMiddleware, advancedRequestLogger } from './middleware/advancedLogging';
import './middleware/databaseLogger'; // Initialize database logging
import userRouter from './routes/user.route';
import path from 'path';
import uploadRoutes from './routes/upload.route';
import streamRoutes from './routes/stream.route';
import coursesRoutes from './routes/course.route';
import analyticsRoutes from './routes/analytics.route';
import roleRoutes from './routes/role.route';
import enrollmentRoutes from './routes/enrollment.route';
import certificateRoutes from './routes/certificate.route';
import bookmarkRoutes from './routes/bookmark.route';
import reviewRoutes from './routes/review.route';
import noteRoutes from './routes/note.route';
import instructorRoutes from './routes/instructor.route';
import adminRoutes from './routes/admin.route';
import proposalRoutes from './routes/governance/proposal.route';
import voteRoutes from './routes/governance/vote.route';
import dashboardRouter from './routes/dashboard/dashboard.route';
import auth0Router from './routes/auth0.route';
import influencerRouter from './routes/influencer.route';
import healthRouter from './routes/health.route';
import startupProfileRouter from './routes/startupProfile.route';
import contributorProfileRouter from './routes/contributorProfile.route';
import milestoneRouter from './routes/milestone.route';
import milestonePaymentRouter from './routes/milestonePayment.route';
import stripeRouter from './routes/stripe.route';
import { updateAccessTokenMiddleware } from './controllers/user.controller';
import { getSolanaMilestoneState, initSolanaMilestone } from './controllers/milestone.controller';
import { isAthenticated as isAuthenticated } from './utils/auth';
import applicationRouter from './routes/application.route';
import contributorPayoutRouter from './routes/contributorPayout.route';
import engagementRouter from './routes/engagement.route';
import messengerRouter from './routes/messenger.route';
import equalUsdRouter from './routes/equalUsd.route';
import logger from './utils/logger';
import { handleStripeWebhook } from './controllers/stripeWebhook.controller';
require('dotenv').config();
export const app = express();


// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Advanced request logging (must be early)
app.use(advancedRequestLogger);

// Stripe webhook – MUST be before express.json() to receive raw body for signature verification
app.post(
  '/api/v1/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// bodyparser - 50MB to match file upload limit (see config/uploadLimits.ts)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// cookie parser
app.use(cookieParser());

// CORS – allowed client origins (Frontend MVP + EqualMint website).
// For cross-origin login (e.g. equalmint.com → app.equalmint.com), cookies must use SameSite=None; Secure.
// That is enabled when NODE_ENV=production, or set COOKIE_SAME_SITE_NONE=true (API must be HTTPS).
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [
      'https://app.equalmint.com',       // MVP Next.js dev
      'https://equalmint.com',      // EqualMint Vite dev
      'http://127.0.0.1:5173',       // EqualMint Vite dev (--host 127.0.0.1)
      'http://209.74.89.249:3000',
      'https://app.equalmint.com',   // MVP production
      'https://equalmint.com',       // EqualMint marketing site
      'https://www.equalmint.com',
    ];
app.use(cors({
  origin: corsOrigins.length ? corsOrigins : true,
  credentials: true,
}));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Health check routes (before other routes)
app.use('/api/v1/health', healthRouter);

// Debug: verify backend is reachable (no auth)
app.get('/api/v1/ping', (_req: Request, res: Response) => res.json({ pong: true, backend: true }));

// Solana milestone (explicit routes - before generic /api/v1)
app.get('/api/v1/milestone/solana/state', updateAccessTokenMiddleware, isAuthenticated, getSolanaMilestoneState);
app.post('/api/v1/milestone/solana/init', updateAccessTokenMiddleware, isAuthenticated, initSolanaMilestone);
// Alternate path (use this if above returns 404)
app.get('/api/v1/solana-milestone/state', updateAccessTokenMiddleware, isAuthenticated, getSolanaMilestoneState);

// routes – mount more specific paths first (stripe before generic /api/v1)
app.use('/api/v1/stripe', stripeRouter);
app.use('/api/v1', userRouter);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/stream", streamRoutes);
app.use('/api/v1/course', coursesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/role', roleRoutes);
app.use('/api/v1/enrollment', enrollmentRoutes);
app.use('/api/v1/certificate', certificateRoutes);
app.use('/api/v1/bookmark', bookmarkRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/note', noteRoutes);
app.use('/api/v1', instructorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/influencer', influencerRouter);
app.use('/api/v1/proposal', proposalRoutes);
app.use('/api/v1/vote', voteRoutes);
app.use('/api/v1', auth0Router);
app.use('/api/v1/startup-profile', startupProfileRouter);
app.use('/api/v1/contributor-profile', contributorProfileRouter);
app.use('/api/v1/milestone', milestoneRouter);
app.use('/api/v1/milestone-payment', milestonePaymentRouter);
app.use('/api/v1/application', applicationRouter);
app.use('/api/v1/contributor-payout', contributorPayoutRouter);
app.use('/api/v1/engagement', engagementRouter);
app.use('/api/v1/messenger', messengerRouter);
app.use('/api/v1/equalusd', equalUsdRouter);


// testing api
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    logger.info('Health check endpoint called');
    res.status(200).json({ 
        success: true, 
        message: 'API is working',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
    });
});

// unknown route 
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server`) as any
    err.statusCode = 404;
    next(err);
});

// Error Middleware
app.use(ErrorMiddleware);