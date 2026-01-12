require('dotenv').config();
import mongoose, { Model, Document, Schema } from "mongoose";

export interface IUserPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    
    // Email & In-App
    email: boolean;
    
    // Transaction notifications
    transactionAlerts: boolean;
    claimReminders: boolean;
    gasPriceAlerts: boolean;
    failedTransactionAlerts: boolean;
    
    // UBI Reports
    weeklyReports: boolean;
    monthlyReports: boolean;
    quarterlyReviews: boolean;
    achievementNotifications: boolean;
    
    // Community
    communityUpdates: boolean;
    communityEvents: boolean;
    protocolUpdates: boolean;
    marketingPromotions: boolean;
    productAnnouncements: boolean;
    
    // Quiet Hours
    quietHours: {
        enabled: boolean;
        start: number; // 0-23 (hour)
        end: number;   // 0-23 (hour)
    };
    
    // Last updated timestamp
    updatedAt: Date;
}

const userPreferencesSchema: Schema<IUserPreferences> = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    
    // Email & In-App
    email: {
        type: Boolean,
        default: true
    },
    
    // Transaction notifications
    transactionAlerts: {
        type: Boolean,
        default: true
    },
    claimReminders: {
        type: Boolean,
        default: true
    },
    gasPriceAlerts: {
        type: Boolean,
        default: false
    },
    failedTransactionAlerts: {
        type: Boolean,
        default: true
    },
    
    // UBI Reports
    weeklyReports: {
        type: Boolean,
        default: false
    },
    monthlyReports: {
        type: Boolean,
        default: true
    },
    quarterlyReviews: {
        type: Boolean,
        default: false
    },
    achievementNotifications: {
        type: Boolean,
        default: true
    },
    
    // Community
    communityUpdates: {
        type: Boolean,
        default: true
    },
    communityEvents: {
        type: Boolean,
        default: false
    },
    protocolUpdates: {
        type: Boolean,
        default: true
    },
    marketingPromotions: {
        type: Boolean,
        default: false
    },
    productAnnouncements: {
        type: Boolean,
        default: true
    },
    
    // Quiet Hours
    quietHours: {
        enabled: {
            type: Boolean,
            default: false
        },
        start: {
            type: Number,
            default: 22,
            min: 0,
            max: 23
        },
        end: {
            type: Number,
            default: 8,
            min: 0,
            max: 23
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster lookups
userPreferencesSchema.index({ userId: 1 });

const UserPreferencesModel: Model<IUserPreferences> = mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferencesModel;

