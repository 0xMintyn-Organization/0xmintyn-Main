require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from './errorHandler';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserModel from '../models/user.mode';

// authenticated user 
export const isAthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    console.log('Access Token:', access_token);
    if (!access_token) {
        return next(new ErrorHandler('Access Token Issue. Please login to access this resource', 401));
    }

    try {
        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
        if (!decoded) {
            return next(new ErrorHandler('Invalid token. Please login to access this resource', 401));
        }

        
        const user = await UserModel.findById(decoded.id).select('-password -createdAt -updatedAt -__v');

        console.log(user);

        if (!user) {
            return next(new ErrorHandler('User not found', 401));
        }
        req.user = user.toJSON();
        console.log('User object set in req.user:', req.user);
        next();
    } catch (error) {
        // JWT verification failed (expired, invalid, etc.)
        return next(new ErrorHandler('Invalid or expired token. Please login to access this resource', 401));
    }

})

// validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role (${req.user?.role}) is not allowed to access this resource`, 403));
        }
        next();
    }
}

// authorize seller - allows any role if isSeller is true or if user is admin
export const authorizeSeller = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
        return next(new ErrorHandler('User not authenticated', 401));
    }
    
    // Allow if user is admin or if user has isSeller flag set to true
    if (user.role === 'admin' || user.isSeller === true) {
        return next();
    }
    
    return next(new ErrorHandler(`Only sellers (isSeller: true) or admins can access this resource. Your role: ${user.role}, isSeller: ${user.isSeller}`, 403));
}