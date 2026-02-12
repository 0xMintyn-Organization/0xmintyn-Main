import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/errorHandler';
import logger from '../utils/logger';

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Wrong Mongoose Object ID Error
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // duplicate key error
    if (err.code === 11000) {
        const keyFields = Object.keys(err.keyValue);
        let message = 'Duplicate entry found';
        
        // Provide more specific error messages based on the duplicate fields
        if (keyFields.includes('email')) {
            message = 'Email address is already registered';
        } else if (keyFields.includes('username')) {
            message = 'Username is already taken';
        } else {
            message = `Duplicate ${keyFields.join(', ')} entered`;
        }
        
        err = new ErrorHandler(message, 400);
    }

    // Handling wrong JWT error
    if (err.name === 'JsonWebTokenError') {
        const message = 'JSON Web Token is invalid. Try Again!!!';
        err = new ErrorHandler(message, 400);
    }

    // Handling Expired JWT error
    if (err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token is expired. Try Again!!!';
        err = new ErrorHandler(message, 400);
    }

    // Multer file size limit (e.g. course thumbnail)
    if (err.code === 'LIMIT_FILE_SIZE') {
        err.statusCode = 413;
        err.message = 'File too large. Maximum size is 50MB.';
    }

    // Log error details
    const errorDetails = {
        statusCode: err.statusCode,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'anonymous'
    };

    // Log based on severity
    if (err.statusCode >= 500) {
        logger.error('Server Error:', errorDetails);
    } else if (err.statusCode >= 400) {
        logger.warn('Client Error:', errorDetails);
    } else {
        logger.info('Error:', errorDetails);
    }

    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}; 
