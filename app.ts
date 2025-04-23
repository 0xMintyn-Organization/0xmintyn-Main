import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ErrorMiddleware } from './middleware/error';
import userRouter from './routes/user.route';
import path from 'path';
import productRouter from './routes/product.route';
require('dotenv').config();
export const app = express();


// bodyparser
app.use(express.json({ limit: '50mb' }));


// cookie parser
app.use(cookieParser());

// express file upload
app.use("/uploads", express.static(path.join(__dirname, "./uploads"))); // Serve static files



// cors
app.use(cors({ 
    origin: ['http://localhost:3000', 'http://localhost:3001' ], 
    credentials: true 
}));

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



//testing api
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