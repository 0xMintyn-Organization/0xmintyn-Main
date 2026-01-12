# Advanced Notification Management System

## 📋 **Overview**
A comprehensive notification system that allows users to manage their notification preferences and receive emails based on their settings, with support for quiet hours and priority levels.

---

## 🏗️ **Architecture**

### **1. Database Model**
**File**: `Backend/models/userPreferences.model.ts`

**Schema Fields**:
- `userId` - Reference to User (unique, indexed)
- `email` - Enable/disable email notifications
- `transactionAlerts` - Transaction confirmations
- `claimReminders` - UBI claim reminders
- `gasPriceAlerts` - Gas price notifications
- `failedTransactionAlerts` - Failed transaction alerts
- `weeklyReports` - Weekly UBI reports
- `monthlyReports` - Monthly UBI reports
- `quarterlyReviews` - Quarterly reviews
- `achievementNotifications` - Achievement alerts
- `communityUpdates` - Community news
- `communityEvents` - Event announcements
- `protocolUpdates` - System updates
- `marketingPromotions` - Marketing emails
- `productAnnouncements` - Product launches
- `quietHours` - Quiet hours settings (enabled, start, end)

---

### **2. API Endpoints**

**Base Path**: `/api/v1/user`

#### **GET `/preferences`**
- Get user's notification preferences
- Returns preferences or creates defaults if none exist
- **Auth**: Required

#### **PUT `/preferences`**
- Update notification preferences
- Accepts partial updates (only provided fields)
- Validates quiet hours (0-23)
- **Auth**: Required
- **Body**: Partial `IUserPreferences`

#### **DELETE `/preferences/reset`**
- Reset preferences to defaults
- **Auth**: Required

---

### **3. Notification Service**

**File**: `Backend/utils/notificationService.ts`

#### **Key Functions**:

1. **`sendNotification(options)`**
   - Main function to send notifications
   - Checks preferences before sending
   - Respects quiet hours (except high priority)
   - Returns boolean (sent/skipped)

2. **`sendBulkNotifications(userIds, ...)`**
   - Send to multiple users
   - Returns statistics (sent, skipped, failed)

3. **`getUserNotificationPreference(userId, type)`**
   - Check if specific notification type is enabled

4. **`isInQuietHours(userId)`**
   - Check if user is currently in quiet hours

#### **Notification Types**:
```typescript
enum NotificationType {
    TRANSACTION_CONFIRMATION = 'transactionAlerts',
    CLAIM_REMINDER = 'claimReminders',
    GAS_PRICE_ALERT = 'gasPriceAlerts',
    FAILED_TRANSACTION = 'failedTransactionAlerts',
    WEEKLY_REPORT = 'weeklyReports',
    MONTHLY_REPORT = 'monthlyReports',
    QUARTERLY_REVIEW = 'quarterlyReviews',
    ACHIEVEMENT = 'achievementNotifications',
    COMMUNITY_UPDATE = 'communityUpdates',
    COMMUNITY_EVENT = 'communityEvents',
    PROTOCOL_UPDATE = 'protocolUpdates',
    MARKETING_PROMOTION = 'marketingPromotions',
    PRODUCT_ANNOUNCEMENT = 'productAnnouncements',
}
```

#### **Priority Levels**:
- **High**: Bypasses email preference and quiet hours (critical notifications)
- **Normal**: Respects all preferences (default)
- **Low**: Respects all preferences (non-urgent)

---

### **4. Email Templates**

**Location**: `Backend/mails/`

1. **`notification.ejs`** - Generic notification template
2. **`transactionNotification.ejs`** - Transaction-specific template
3. **`ubiReport.ejs`** - UBI report template

---

## 🔄 **How It Works**

### **Notification Flow**:

1. **User Sets Preferences** (Frontend → Backend)
   ```
   User toggles notification settings
   → Frontend calls PUT /api/v1/user/preferences
   → Backend saves to UserPreferences collection
   ```

2. **System Sends Notification** (Backend)
   ```
   Event occurs (transaction, claim, etc.)
   → Code calls sendNotification()
   → Service checks user preferences
   → Checks quiet hours (if not high priority)
   → Checks specific notification type preference
   → If allowed, sends email via sendEmail()
   → Returns success/failure
   ```

3. **Quiet Hours Logic**:
   ```
   If quietHours.enabled === true:
     - Get current hour (0-23)
     - If start > end (spans midnight):
         - Quiet if: currentHour >= start OR currentHour < end
     - Else (same day):
         - Quiet if: currentHour >= start AND currentHour < end
     - Skip notification if in quiet hours (unless high priority)
   ```

---

## 💻 **Usage Examples**

### **Example 1: Send Transaction Confirmation**

```typescript
import { sendNotification, NotificationType } from '@/utils/notificationService';

await sendNotification({
    userId: user._id.toString(),
    type: NotificationType.TRANSACTION_CONFIRMATION,
    subject: 'Transaction Confirmed',
    template: 'transactionNotification.ejs',
    data: {
        transaction: {
            type: 'Payment',
            amount: 100,
            currency: '0XM',
            signature: 'abc123...',
            status: 'success',
            date: new Date()
        }
    },
    priority: 'normal'
});
```

### **Example 2: Send UBI Claim Reminder**

```typescript
await sendNotification({
    userId: user._id.toString(),
    type: NotificationType.CLAIM_REMINDER,
    subject: 'UBI Claim Available',
    template: 'notification.ejs',
    data: {
        content: '<p>You have 50 0XM available to claim!</p>',
        actionUrl: 'https://yourapp.com/claim-ubi',
        actionText: 'Claim Now'
    },
    priority: 'normal'
});
```

### **Example 3: Send Weekly Report**

```typescript
await sendNotification({
    userId: user._id.toString(),
    type: NotificationType.WEEKLY_REPORT,
    subject: 'Your Weekly UBI Report',
    template: 'ubiReport.ejs',
    data: {
        reportType: 'Weekly',
        report: {
            totalEarnings: 500,
            totalClaims: 7,
            averagePerClaim: 71.43,
            period: 'Jan 1-7, 2024'
        },
        dashboardUrl: 'https://yourapp.com/dashboard'
    },
    priority: 'low'
});
```

### **Example 4: Send High Priority Alert (Bypasses Preferences)**

```typescript
await sendNotification({
    userId: user._id.toString(),
    type: NotificationType.FAILED_TRANSACTION,
    subject: 'Transaction Failed - Action Required',
    template: 'transactionNotification.ejs',
    data: {
        transaction: {
            type: 'Payment',
            amount: 100,
            currency: '0XM',
            status: 'failed',
            date: new Date(),
            message: 'Insufficient balance'
        }
    },
    priority: 'high' // Bypasses email preference and quiet hours
});
```

### **Example 5: Bulk Notification**

```typescript
import { sendBulkNotifications, NotificationType } from '@/utils/notificationService';

const userIds = ['user1', 'user2', 'user3'];

const results = await sendBulkNotifications(
    userIds,
    NotificationType.PRODUCT_ANNOUNCEMENT,
    'New Feature: Advanced Analytics',
    'notification.ejs',
    {
        content: '<p>We\'ve launched a new analytics dashboard!</p>',
        actionUrl: 'https://yourapp.com/features',
        actionText: 'Learn More'
    },
    'normal'
);

console.log(`Sent: ${results.sent}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
```

---

## 🎯 **Integration Points**

### **Where to Use Notifications**:

1. **Transaction Completion** (`enrollment.controller.ts`)
   ```typescript
   // After successful enrollment
   await sendNotification({
       userId: user._id.toString(),
       type: NotificationType.TRANSACTION_CONFIRMATION,
       // ...
   });
   ```

2. **UBI Claims** (UBI claim functions)
   ```typescript
   // After claim reminder check
   await sendNotification({
       userId: user._id.toString(),
       type: NotificationType.CLAIM_REMINDER,
       // ...
   });
   ```

3. **Failed Transactions** (Transaction handlers)
   ```typescript
   // On transaction failure
   await sendNotification({
       userId: user._id.toString(),
       type: NotificationType.FAILED_TRANSACTION,
       priority: 'high', // Critical
       // ...
   });
   ```

4. **Scheduled Reports** (Cron jobs)
   ```typescript
   // Weekly/Monthly report cron
   await sendNotification({
       userId: user._id.toString(),
       type: NotificationType.WEEKLY_REPORT,
       // ...
   });
   ```

5. **Gas Price Alerts** (Gas monitoring service)
   ```typescript
   // When gas price drops below threshold
   await sendNotification({
       userId: user._id.toString(),
       type: NotificationType.GAS_PRICE_ALERT,
       // ...
   });
   ```

---

## 🔧 **Frontend Integration**

### **Settings Page** (`Frontend/src/app/(userdashboard)/settings/page.tsx`)

**Features**:
- ✅ Load preferences on mount
- ✅ Save preferences via API
- ✅ Real-time toggle updates
- ✅ Quiet hours configuration
- ✅ "Save All Changes" button

**API Hooks**:
```typescript
const { data: preferencesData } = useGetUserPreferencesQuery();
const [updatePreferences] = useUpdateUserPreferencesMutation();

// Save preferences
await updatePreferences({
    ...notifications,
    quietHours
}).unwrap();
```

---

## 📊 **Default Preferences**

When a user first accesses preferences, defaults are:
- ✅ Email: `true`
- ✅ Transaction Alerts: `true`
- ✅ Claim Reminders: `true`
- ❌ Gas Price Alerts: `false`
- ✅ Failed Transaction Alerts: `true`
- ❌ Weekly Reports: `false`
- ✅ Monthly Reports: `true`
- ❌ Quarterly Reviews: `false`
- ✅ Achievement Notifications: `true`
- ✅ Community Updates: `true`
- ❌ Community Events: `false`
- ✅ Protocol Updates: `true`
- ❌ Marketing Promotions: `false`
- ✅ Product Announcements: `true`
- Quiet Hours: `disabled` (22:00 - 08:00)

---

## 🛡️ **Security & Privacy**

1. **User Isolation**: Each user's preferences are isolated by `userId`
2. **Authentication**: All endpoints require authentication
3. **Validation**: Quiet hours validated (0-23 range)
4. **Fail-Safe**: On error, notifications are allowed (fail open for critical alerts)

---

## 📈 **Future Enhancements**

1. **In-App Notifications**: Add in-app notification system
2. **Push Notifications**: Browser push notifications
3. **SMS Notifications**: SMS support for critical alerts
4. **Notification History**: Store sent notifications
5. **Unsubscribe Links**: One-click unsubscribe in emails
6. **Notification Preferences API**: More granular control
7. **Notification Templates**: User-customizable templates

---

## 🧪 **Testing**

### **Test Notification Sending**:
```typescript
// Test file: Backend/testNotification.ts
import { sendNotification, NotificationType } from './utils/notificationService';

const testUserId = 'your-test-user-id';

await sendNotification({
    userId: testUserId,
    type: NotificationType.TRANSACTION_CONFIRMATION,
    subject: 'Test Notification',
    template: 'notification.ejs',
    data: {
        content: '<p>This is a test notification.</p>'
    },
    priority: 'normal'
});
```

---

## 📝 **Summary**

✅ **Complete Backend**:
- UserPreferences model
- API endpoints (GET, PUT, DELETE)
- Notification service with preference checking
- Email templates
- Quiet hours support
- Priority levels

✅ **Complete Frontend**:
- Settings page integration
- RTK Query hooks
- Save/load preferences
- Real-time updates

✅ **Ready to Use**:
- Import `sendNotification` anywhere in backend
- Use `NotificationType` enum for type safety
- Preferences automatically checked before sending

---

**Last Updated**: Complete notification management system
**Status**: ✅ Production Ready

