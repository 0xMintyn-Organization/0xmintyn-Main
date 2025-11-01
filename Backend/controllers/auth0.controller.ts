require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';
import { sendToken } from '../utils/jwt';
import { auth0Config } from '../config/auth0.config';

// Generate Auth0 authorization URL
export const getAuth0LoginUrl = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { provider } = req.query; // e.g., 'google', 'github', 'twitter'
        
        const authUrl = `https://${auth0Config.domain}/authorize?` +
            `response_type=code&` +
            `client_id=${auth0Config.clientId}&` +
            `redirect_uri=${encodeURIComponent(auth0Config.callbackURL)}&` +
            `scope=${encodeURIComponent(auth0Config.scope)}&` +
            `state=${provider || 'default'}`;

        res.status(200).json({
            success: true,
            authUrl,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Handle Auth0 callback
export const handleAuth0Callback = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return next(new ErrorHandler("Authorization code not provided", 400));
        }

        // Exchange code for tokens
        const tokenResponse = await axios.post(
            `https://${auth0Config.domain}/oauth/token`,
            {
                grant_type: 'authorization_code',
                client_id: auth0Config.clientId,
                client_secret: auth0Config.clientSecret,
                code,
                redirect_uri: auth0Config.callbackURL,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const { access_token, id_token } = tokenResponse.data;

        // Get user info from Auth0
        const userInfoResponse = await axios.get(
            `https://${auth0Config.domain}/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const auth0User = userInfoResponse.data;

        // Find or create user in database
        let user = await UserModel.findOne({ email: auth0User.email });

        if (!user) {
            // Create new user
            const [firstName, ...lastNameParts] = (auth0User.name || auth0User.email).split(' ');
            const lastName = lastNameParts.join(' ') || firstName;

            user = await UserModel.create({
                firstName,
                lastName,
                email: auth0User.email,
                username: auth0User.email.split('@')[0] + Math.random().toString(36).substring(7),
                password: Math.random().toString(36).substring(2, 15), // Random password
                dateOfBirth: new Date('2000-01-01'),
                nationality: 'Not specified',
                age: 18,
                contactNumber: '0000000000',
                avatar: auth0User.picture || '',
                isVerified: auth0User.email_verified || false,
                role: 'user',
            });
            
            console.log(`✅ New user created via Auth0: ${user.email}`);
        } else {
            console.log(`✅ Existing user logged in via Auth0: ${user.email}`);
        }

        // Update social account if provider info is available
        if (state && state !== 'default') {
            const provider = state as string;
            const socialUsername = auth0User.nickname || auth0User.email.split('@')[0];

            // Check if social account already exists
            const existingAccountIndex = user.socialAccounts.findIndex(
                (account: any) => account.platform.toLowerCase() === provider.toLowerCase()
            );

            if (existingAccountIndex === -1) {
                user.socialAccounts.push({
                    platform: provider.charAt(0).toUpperCase() + provider.slice(1),
                    username: socialUsername,
                    isVerified: true,
                });
                await user.save();
            }
        }

        // Generate JWT tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN!, {
            expiresIn: '1h',
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN!, {
            expiresIn: '3d',
        });

        // Set cookies and redirect to frontend
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        // Redirect to Auth0 success page (handles popup closing)
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth0-success`);

    } catch (error: any) {
        console.error('Auth0 callback error:', error.response?.data || error.message);
        return next(new ErrorHandler(error.message, 400));
    }
});

// Link social account to existing user
export const linkSocialAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { provider, accessToken } = req.body;

        if (!provider || !accessToken) {
            return next(new ErrorHandler("Provider and access token are required", 400));
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get user info from Auth0
        const userInfoResponse = await axios.get(
            `https://${auth0Config.domain}/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const auth0User = userInfoResponse.data;
        const socialUsername = auth0User.nickname || auth0User.email.split('@')[0];

        // Check if social account already exists
        const existingAccountIndex = user.socialAccounts.findIndex(
            (account: any) => account.platform.toLowerCase() === provider.toLowerCase()
        );

        if (existingAccountIndex !== -1) {
            // Update existing account
            user.socialAccounts[existingAccountIndex].username = socialUsername;
            user.socialAccounts[existingAccountIndex].isVerified = true;
        } else {
            // Add new account
            user.socialAccounts.push({
                platform: provider.charAt(0).toUpperCase() + provider.slice(1),
                username: socialUsername,
                isVerified: true,
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            user,
            message: "Social account linked successfully",
        });

    } catch (error: any) {
        console.error('Link social account error:', error.response?.data || error.message);
        return next(new ErrorHandler(error.message, 400));
    }
});

// Unlink social account
export const unlinkSocialAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { provider } = req.body;

        if (!provider) {
            return next(new ErrorHandler("Provider is required", 400));
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Remove the social account
        user.socialAccounts = user.socialAccounts.filter(
            (account: any) => account.platform.toLowerCase() !== provider.toLowerCase()
        );

        await user.save();

        res.status(200).json({
            success: true,
            user,
            message: "Social account unlinked successfully",
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

