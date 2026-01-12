require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import UserPreferencesModel, { IUserPreferences } from '../models/userPreferences.model';
import ErrorHandler from '../utils/errorHandler';
import UserModel from '../models/user.mode';

// Get user preferences
export const getUserPreferences = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Find or create default preferences
        let preferences = await UserPreferencesModel.findOne({ userId });

        if (!preferences) {
            // Create default preferences
            preferences = await UserPreferencesModel.create({
                userId,
                // All defaults are set in schema
            });
        }

        res.status(200).json({
            success: true,
            preferences
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Update user preferences
export const updateUserPreferences = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return next(new ErrorHandler('User not found', 404));
        }

        const updateData = req.body;

        // Validate quiet hours if provided
        if (updateData.quietHours) {
            if (updateData.quietHours.start < 0 || updateData.quietHours.start > 23) {
                return next(new ErrorHandler('Quiet hours start must be between 0 and 23', 400));
            }
            if (updateData.quietHours.end < 0 || updateData.quietHours.end > 23) {
                return next(new ErrorHandler('Quiet hours end must be between 0 and 23', 400));
            }
        }

        // Find and update preferences, or create if not found
        const preferences = await UserPreferencesModel.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        if (!preferences) {
            return next(new ErrorHandler('Failed to update preferences', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            preferences
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Reset preferences to defaults
export const resetUserPreferences = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Delete existing preferences (will be recreated with defaults on next get)
        await UserPreferencesModel.findOneAndDelete({ userId });

        res.status(200).json({
            success: true,
            message: 'Preferences reset to defaults successfully'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

