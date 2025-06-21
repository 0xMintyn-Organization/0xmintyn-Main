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
        return next(new ErrorHandler('Access Token Issuue Please login to access this resource', 400));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    if (!decoded) {
        return next(new ErrorHandler('Decode issue Please login to access this resource', 400));
    }


    const user = await UserModel.findById(decoded.id).select('-password -createdAt -updatedAt -__v');

    console.log(user);

    if (!user) {
        return next(new ErrorHandler('User not found ', 400));
    }
    req.user = user.toJSON();
    next();

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