import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserModel from '../models/user.mode';
import { CatchAsyncError } from './catchAsyncError';
import ErrorHandler from '../utils/errorHandler';
import { accessTokenOptions, refreshTokenOptions } from '../utils/jwt';

// Enhanced authentication middleware with automatic token refresh
export const authWithRefresh = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    
    if (!access_token) {
        return next(new ErrorHandler('Access Token not found. Please login to access this resource', 401));
    }

    try {
        // Try to verify the access token
        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
        
        if (!decoded) {
            return next(new ErrorHandler('Invalid access token. Please login again', 401));
        }

        // Get user from database
        const user = await UserModel.findById(decoded.id).select('-password -createdAt -updatedAt -__v');
        
        if (!user) {
            return next(new ErrorHandler('User not found. Please login again', 401));
        }

        req.user = user.toJSON();
        console.log('=== AUTH DEBUG ===');
        console.log('User ID from JWT:', decoded.id);
        console.log('User ID from DB:', user._id);
        console.log('User ID in req.user:', req.user.id);
        console.log('User ID in req.user._id:', req.user._id);
        next();

    } catch (error: any) {
        // If access token is expired, try to refresh it
        if (error.name === 'TokenExpiredError') {
            try {
                const refresh_token = req.cookies.refresh_token;
                
                if (!refresh_token) {
                    return next(new ErrorHandler('Refresh token not found. Please login again', 401));
                }

                // Verify refresh token
                const refreshDecoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
                
                if (!refreshDecoded) {
                    return next(new ErrorHandler('Invalid refresh token. Please login again', 401));
                }

                // Get user from database
                const user = await UserModel.findById(refreshDecoded.id).select('-password -createdAt -updatedAt -__v');
                
                if (!user) {
                    return next(new ErrorHandler('User not found. Please login again', 401));
                }

                // Generate new tokens
                const newAccessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: '1h' });
                const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: '3d' });

                // Set new cookies
                res.cookie('access_token', newAccessToken, accessTokenOptions);
                res.cookie('refresh_token', newRefreshToken, refreshTokenOptions);

                req.user = user.toJSON();
                console.log('=== AUTH REFRESH DEBUG ===');
                console.log('User ID from JWT:', refreshDecoded.id);
                console.log('User ID from DB:', user._id);
                console.log('User ID in req.user:', req.user.id);
                console.log('User ID in req.user._id:', req.user._id);
                next();

            } catch (refreshError: any) {
                return next(new ErrorHandler('Session expired. Please login again', 401));
            }
        } else {
            return next(new ErrorHandler('Invalid token. Please login again', 401));
        }
    }
});
