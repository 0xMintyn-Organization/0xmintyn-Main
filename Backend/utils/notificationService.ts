/**
 * Advanced Notification Service
 * Checks user preferences before sending notifications
 * Supports email notifications with quiet hours
 */

import UserPreferencesModel from '../models/userPreferences.model';
import UserModel from '../models/user.mode';
import sendEmail from './sendMail';
import path from 'path';

// Notification types enum
export enum NotificationType {
    // Transaction notifications
    TRANSACTION_CONFIRMATION = 'transactionAlerts',
    CLAIM_REMINDER = 'claimReminders',
    GAS_PRICE_ALERT = 'gasPriceAlerts',
    FAILED_TRANSACTION = 'failedTransactionAlerts',
    
    // UBI Reports
    WEEKLY_REPORT = 'weeklyReports',
    MONTHLY_REPORT = 'monthlyReports',
    QUARTERLY_REVIEW = 'quarterlyReviews',
    ACHIEVEMENT = 'achievementNotifications',
    
    // Community
    COMMUNITY_UPDATE = 'communityUpdates',
    COMMUNITY_EVENT = 'communityEvents',
    PROTOCOL_UPDATE = 'protocolUpdates',
    MARKETING_PROMOTION = 'marketingPromotions',
    PRODUCT_ANNOUNCEMENT = 'productAnnouncements',
}

interface NotificationOptions {
    userId: string;
    type: NotificationType;
    subject: string;
    template: string;
    data: { [key: string]: any };
    priority?: 'high' | 'normal' | 'low';
}

/**
 * Check if notification should be sent based on user preferences
 */
async function shouldSendNotification(
    userId: string,
    type: NotificationType,
    priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<boolean> {
    try {
        // Get user preferences
        const preferences = await UserPreferencesModel.findOne({ userId });
        
        // If no preferences, use defaults (all enabled except marketing)
        if (!preferences) {
            // Default: allow all except marketing promotions
            if (type === NotificationType.MARKETING_PROMOTION) {
                return false;
            }
            return true;
        }

        // Check if email notifications are enabled
        if (!preferences.email) {
            // High priority notifications can bypass email preference
            if (priority !== 'high') {
                return false;
            }
        }

        // Check quiet hours (only for normal/low priority)
        if (priority !== 'high' && preferences.quietHours.enabled) {
            const now = new Date();
            const currentHour = now.getHours();
            const { start, end } = preferences.quietHours;

            // Handle quiet hours that span midnight (e.g., 22:00 - 08:00)
            if (start > end) {
                // Quiet hours span midnight
                if (currentHour >= start || currentHour < end) {
                    return false; // In quiet hours
                }
            } else {
                // Quiet hours within same day
                if (currentHour >= start && currentHour < end) {
                    return false; // In quiet hours
                }
            }
        }

        // Check specific notification type preference
        const preferenceKey = type as keyof typeof preferences;
        const isEnabled = preferences[preferenceKey] as boolean;

        if (!isEnabled) {
            // High priority notifications can bypass type preference
            if (priority !== 'high') {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error checking notification preferences:', error);
        // On error, allow notification (fail open)
        return true;
    }
}

/**
 * Send notification email if user preferences allow it
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
    try {
        const { userId, type, subject, template, data, priority = 'normal' } = options;

        // Check if notification should be sent
        const shouldSend = await shouldSendNotification(userId, type, priority);

        if (!shouldSend) {
            console.log(`Notification skipped for user ${userId}, type: ${type} (preference disabled or quiet hours)`);
            return false;
        }

        // Get user email
        const user = await UserModel.findById(userId).select('email firstName lastName');
        if (!user || !user.email) {
            console.error(`User not found or no email for userId: ${userId}`);
            return false;
        }

        // Prepare email data
        const emailData = {
            user: {
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            ...data
        };

        // Send email
        await sendEmail({
            email: user.email,
            subject,
            template,
            data: emailData
        });

        console.log(`✅ Notification sent to ${user.email}, type: ${type}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Error sending notification:`, error);
        return false;
    }
}

/**
 * Send bulk notifications to multiple users
 */
export async function sendBulkNotifications(
    userIds: string[],
    type: NotificationType,
    subject: string,
    template: string,
    data: { [key: string]: any },
    priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<{ sent: number; skipped: number; failed: number }> {
    const results = {
        sent: 0,
        skipped: 0,
        failed: 0
    };

    for (const userId of userIds) {
        try {
            const sent = await sendNotification({
                userId,
                type,
                subject,
                template,
                data,
                priority
            });

            if (sent) {
                results.sent++;
            } else {
                results.skipped++;
            }
        } catch (error) {
            console.error(`Failed to send notification to user ${userId}:`, error);
            results.failed++;
        }
    }

    return results;
}

/**
 * Get user notification preferences (for checking in code)
 */
export async function getUserNotificationPreference(
    userId: string,
    type: NotificationType
): Promise<boolean> {
    try {
        const preferences = await UserPreferencesModel.findOne({ userId });
        
        if (!preferences) {
            // Default: enabled for all except marketing
            return type !== NotificationType.MARKETING_PROMOTION;
        }

        const preferenceKey = type as keyof typeof preferences;
        return preferences[preferenceKey] as boolean;
    } catch (error) {
        console.error('Error getting notification preference:', error);
        return true; // Default to enabled on error
    }
}

/**
 * Check if user is in quiet hours
 */
export async function isInQuietHours(userId: string): Promise<boolean> {
    try {
        const preferences = await UserPreferencesModel.findOne({ userId });
        
        if (!preferences || !preferences.quietHours.enabled) {
            return false;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const { start, end } = preferences.quietHours;

        // Handle quiet hours that span midnight
        if (start > end) {
            return currentHour >= start || currentHour < end;
        } else {
            return currentHour >= start && currentHour < end;
        }
    } catch (error) {
        console.error('Error checking quiet hours:', error);
        return false;
    }
}

