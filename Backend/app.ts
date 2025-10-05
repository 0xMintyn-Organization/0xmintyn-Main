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
import uploadRouter from './routes/upload.route';
require('dotenv').config();
export const app = express();


// bodyparser
app.use(express.json({ limit: '50mb' }));

// cookie parser
app.use(cookieParser());

// cors
app.use(cors({ 
    origin: ['http://localhost:3000', 'http://localhost:3000', 'http://209.74.89.249:3000' ], 
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

// Apply auth rate limiter to user routes
app.use('/api/v1/user', authLimiter);

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
app.use('/api/v1/marketplace/products', marketplaceProductRouter);
app.use('/api/v1/marketplace/services', marketplaceServiceRouter);
app.use('/api/v1/marketplace/sellers', marketplaceSellerRouter);
app.use('/api/v1/marketplace', marketplaceSearchRouter);
app.use('/api/v1/marketplace/purchase', marketplacePurchaseRouter);
app.use('/api/v1/marketplace/orders', marketplaceOrderRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/proposal', proposalRoutes);
app.use('/api/v1/vote', voteRoutes);




// testing api
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ success: true, message: 'API is working' });
});

// unknown route 
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server`) as any
    err.statusCode = 404;
    next(err);
}
);
 
// Error Middleware
app.use(ErrorMiddleware);