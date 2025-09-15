import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ErrorMiddleware } from './middleware/error';
import userRouter from './routes/user.route';
import path from 'path';
import productRouter from './routes/product.route';
import orderRouter from './routes/order.route';
import uploadRoutes from './routes/upload.route';
import streamRoutes from './routes/stream.route';
import coursesRoutes from './routes/course.route';
require('dotenv').config();
export const app = express();


// bodyparser
app.use(express.json({ limit: '50mb' }));


// cookie parser
app.use(cookieParser());




// cors
app.use(cors({ 
    origin: ['https://app.0xmintyn.com/', 'http://localhost:3001', 'http://209.74.89.249:3000', "https://app.0xmintyn.com/" ], 
    credentials: true 
}));

app.use("/uploads", express.static(path.join(__dirname, "./uploads"))); // Serve static files

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 100, 
    standardHeaders: 'draft-8',
    legacyHeaders: false, 
})

// routes
app.use('/api/v1', userRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/order', orderRouter);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/stream", streamRoutes);
app.use('/api/v1/course', coursesRoutes);




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

// Rate limiter
app.use(limiter);

// Error Middleware
app.use(ErrorMiddleware);