/**
 * Notification Service Usage Examples
 * This file shows how to use the notification service throughout the application
 */

import { sendNotification, NotificationType } from './notificationService';

// Example 1: Send transaction confirmation
export async function sendTransactionConfirmation(
    userId: string,
    transactionData: {
        type: string;
        amount: number;
        currency: string;
        signature: string;
        status: 'success' | 'failed';
        date: Date;
        message?: string;
    }
) {
    await sendNotification({
        userId,
        type: NotificationType.TRANSACTION_CONFIRMATION,
        subject: `Transaction ${transactionData.status === 'success' ? 'Confirmed' : 'Failed'}`,
        template: 'transactionNotification.ejs',
        data: {
            transaction: transactionData,
            content: `
                <p>Your transaction has been ${transactionData.status === 'success' ? 'successfully completed' : 'failed'}.</p>
                <p><strong>Type:</strong> ${transactionData.type}</p>
                <p><strong>Amount:</strong> ${transactionData.amount} ${transactionData.currency}</p>
            `
        },
        priority: transactionData.status === 'failed' ? 'high' : 'normal'
    });
}

// Example 2: Send UBI claim reminder
export async function sendClaimReminder(userId: string, claimAmount: number) {
    await sendNotification({
        userId,
        type: NotificationType.CLAIM_REMINDER,
        subject: 'UBI Claim Available',
        template: 'notification.ejs',
        data: {
            content: `
                <p>You have ${claimAmount} 0XM available to claim!</p>
                <p>Don't miss out on your Universal Basic Income.</p>
            `,
            actionUrl: `${process.env.CLIENT_URL}/claim-ubi`,
            actionText: 'Claim Now'
        },
        priority: 'normal'
    });
}

// Example 3: Send weekly UBI report
export async function sendWeeklyReport(
    userId: string,
    reportData: {
        totalEarnings: number;
        totalClaims: number;
        averagePerClaim: number;
        period: string;
    }
) {
    await sendNotification({
        userId,
        type: NotificationType.WEEKLY_REPORT,
        subject: 'Your Weekly UBI Report',
        template: 'ubiReport.ejs',
        data: {
            reportType: 'Weekly',
            report: reportData,
            dashboardUrl: `${process.env.CLIENT_URL}/dashboard`
        },
        priority: 'low'
    });
}

// Example 4: Send gas price alert
export async function sendGasPriceAlert(
    userId: string,
    currentPrice: number,
    threshold: number
) {
    await sendNotification({
        userId,
        type: NotificationType.GAS_PRICE_ALERT,
        subject: 'Gas Prices Are Favorable',
        template: 'notification.ejs',
        data: {
            content: `
                <div class="highlight">
                    <p><strong>Great news!</strong> Gas prices have dropped below your threshold.</p>
                    <p>Current price: ${currentPrice} SOL</p>
                    <p>Your threshold: ${threshold} SOL</p>
                </div>
                <p>This is a good time to make transactions.</p>
            `,
            actionUrl: `${process.env.CLIENT_URL}/wallet`,
            actionText: 'View Wallet'
        },
        priority: 'normal'
    });
}

// Example 5: Send achievement notification
export async function sendAchievementNotification(
    userId: string,
    achievement: {
        title: string;
        description: string;
        badge?: string;
    }
) {
    await sendNotification({
        userId,
        type: NotificationType.ACHIEVEMENT,
        subject: `Achievement Unlocked: ${achievement.title}`,
        template: 'notification.ejs',
        data: {
            content: `
                <div class="highlight">
                    <p><strong>🎉 Congratulations!</strong></p>
                    <p>You've unlocked the achievement: <strong>${achievement.title}</strong></p>
                    <p>${achievement.description}</p>
                </div>
            `,
            actionUrl: `${process.env.CLIENT_URL}/achievements`,
            actionText: 'View Achievements'
        },
        priority: 'normal'
    });
}

// Example 6: Send product announcement
export async function sendProductAnnouncement(
    userIds: string[],
    announcement: {
        title: string;
        description: string;
        featureUrl?: string;
    }
) {
    // Use bulk notification for multiple users
    const { sendBulkNotifications } = await import('./notificationService');
    
    await sendBulkNotifications(
        userIds,
        NotificationType.PRODUCT_ANNOUNCEMENT,
        `New Feature: ${announcement.title}`,
        'notification.ejs',
        {
            content: `
                <p><strong>${announcement.title}</strong></p>
                <p>${announcement.description}</p>
            `,
            actionUrl: announcement.featureUrl || `${process.env.CLIENT_URL}/features`,
            actionText: 'Learn More'
        },
        'normal'
    );
}

