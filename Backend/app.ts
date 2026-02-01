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
import applicationRouter from './routes/application.route';
import contributorPayoutRouter from './routes/contributorPayout.route';
import engagementRouter from './routes/engagement.route';
import messengerRouter from './routes/messenger.route';
import logger from './utils/logger';
require('dotenv').config();
export const app = express();


// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Advanced request logging (must be early)
app.use(advancedRequestLogger);

// bodyparser - increase limits for large file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// cookie parser
app.use(cookieParser());

// cors
app.use(cors({ 
    origin: ['http://localhost:3000', 'http://209.74.89.249:3000' ], 
    credentials: true 
}));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Health check routes (before other routes)
app.use('/api/v1/health', healthRouter);

// routes
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