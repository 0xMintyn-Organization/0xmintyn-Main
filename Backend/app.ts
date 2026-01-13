import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ErrorMiddleware } from './middleware/error';
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
import marketplaceProductRouter from './routes/marketplace/marketplaceProduct.route';
import marketplaceServiceRouter from './routes/marketplace/marketplaceService.route';
import marketplaceSellerRouter from './routes/marketplace/marketplaceSeller.route';
import marketplaceSearchRouter from './routes/marketplace/marketplaceSearch.route';
import marketplacePurchaseRouter from './routes/marketplace/marketplacePurchase.route';
import marketplaceOrderRouter from './routes/marketplace/marketplaceOrder.route';
import marketplaceMessageRouter from './routes/marketplace/marketplaceMessage.route';
import marketplaceOfferRouter from './routes/marketplace/marketplaceOffer.route';
import marketplaceReviewRouter from './routes/marketplace/marketplaceReview.route';
import dashboardRouter from './routes/dashboard/dashboard.route';
import auth0Router from './routes/auth0.route';
import influencerRouter from './routes/influencer.route';
require('dotenv').config();
export const app = express();

// Verify app.ts is being loaded - this should appear in logs
console.log('[APP.TS] File loaded - Starting route registration');



// bodyparser
app.use(express.json({ limit: '50mb' }));

// cookie parser
app.use(cookieParser());

// cors
app.use(cors({ 
    origin: [
        'https://app.0xmintyn.com', 
        'http://209.74.89.249:3000',
        'http://localhost:3000', // Development
        'http://127.0.0.1:3000'  // Development alternative
    ], 
    credentials: true 
}));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Increased from 100 to 1000 requests per window
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: "Too many requests from this IP, please try again later.",
        retryAfter: "15 minutes"
    },
    // Skip rate limiting in development
    skip: (req) => {
        return process.env.NODE_ENV === 'development';
    }
})

// Apply rate limiter before routes
app.use(limiter);

// Debug middleware to log all requests (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api/v1/user')) {
            console.log(`[DEBUG] User route: ${req.method} ${req.path}`);
        }
        next();
    });
}

// More lenient rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // 200 requests per window for auth endpoints
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: "Too many authentication requests, please try again later.",
        retryAfter: "15 minutes"
    },
    // Skip rate limiting in development
    skip: (req) => {
        return process.env.NODE_ENV === 'development';
    }
});

// routes
// Note: Rate limiter is applied conditionally - skip in development
// app.use('/api/v1/user', authLimiter);

// IMPORTANT: Register userRouter FIRST before any other /api/v1 routes
// This ensures /api/v1/user routes are matched before /api/v1 routes
console.log('[ROUTE INIT] About to register userRouter at /api/v1/user');
app.use('/api/v1/user', userRouter);
console.log('[ROUTE INIT] userRouter registered successfully');

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
app.use('/api/v1/marketplace/products', marketplaceProductRouter);
app.use('/api/v1/marketplace/services', marketplaceServiceRouter);
app.use('/api/v1/marketplace/sellers', marketplaceSellerRouter);
app.use('/api/v1/marketplace', marketplaceSearchRouter);
app.use('/api/v1/marketplace/purchase', marketplacePurchaseRouter);
app.use('/api/v1/marketplace/orders', marketplaceOrderRouter);
app.use('/api/v1/marketplace/messages', marketplaceMessageRouter);
app.use('/api/v1/marketplace/offers', marketplaceOfferRouter);
app.use('/api/v1/marketplace/reviews', marketplaceReviewRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/influencer', influencerRouter);
app.use('/api/v1/proposal', proposalRoutes);
app.use('/api/v1/vote', voteRoutes);
app.use('/api/v1', auth0Router);




// testing api
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ success: true, message: 'API is working' });
});

// Debug: List all registered routes (for development only)
if (process.env.NODE_ENV === 'development') {
    app.get('/debug/routes', (req: Request, res: Response) => {
        const routes: string[] = [];
        app._router?.stack?.forEach((middleware: any) => {
            if (middleware.route) {
                routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
            } else if (middleware.name === 'router') {
                routes.push(`ROUTER mounted at: ${middleware.regexp}`);
            }
        });
        res.json({ routes, total: routes.length });
    });
}

// unknown route 
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/v1/user')) {
        console.log(`[404 DEBUG] Catch-all hit for user route: ${req.method} ${req.originalUrl} - Path: ${req.path}`);
    }
    const err = new Error(`Can't find ${req.originalUrl} on this server`) as any
    err.statusCode = 404;
    next(err);
}
);
 
// Error Middleware
app.use(ErrorMiddleware);