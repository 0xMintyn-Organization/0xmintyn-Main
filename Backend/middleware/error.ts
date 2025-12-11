import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/errorHandler';

export const ErrorMiddleware = (err:any , req: Request, res: Response, next : NextFunction)=>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Wrong Mongoose Object ID Error
    if(err.name === 'CastError'){
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // duplicate key error
    if(err.code === 11000){
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
    if(err.name === 'JsonWebTokenError'){
        const message = 'JSON Web Token is invalid. Try Again!!!';
        err = new ErrorHandler(message, 400);
    }

    // Handling Expired JWT error
    if(err.name === 'TokenExpiredError'){
        const message = 'JSON Web Token is expired. Try Again!!!';
        err = new ErrorHandler(message, 400);
    }

    

    // Log error for debugging
    console.error('Error Middleware:', {
        statusCode: err.statusCode,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(err.statusCode).json({
        success: false,
        ok: false,
        error: err.message,
    });
    
} 
