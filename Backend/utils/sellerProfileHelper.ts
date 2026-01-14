import mongoose from "mongoose";
import { MarketplaceSellerModel } from "../models/marketplace/MarketplaceSeller.model";
import logger from "./logger";

/**
 * Auto-creates a minimal seller profile for users with isSeller flag but no profile
 * @param userId - User ID (string or ObjectId)
 * @param user - User document from database
 * @returns Created seller profile or null if creation failed
 */
export async function autoCreateSellerProfile(userId: any, user: any): Promise<any> {
    try {
        // Ensure userId is properly converted to ObjectId
        const userIdObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        
        // Check if profile already exists
        let seller = await MarketplaceSellerModel.findOne({ userId: userIdObjectId });
        if (!seller && typeof userId === 'string') {
            seller = await MarketplaceSellerModel.findOne({ userId: userId });
        }
        
        if (seller) {
            return seller; // Profile already exists
        }
        
        logger.info('Auto-creating minimal seller profile', { userId });
        
        // Map nationality code to country name (common codes)
        const countryMap: { [key: string]: string } = {
            'pk': 'Pakistan',
            'us': 'United States',
            'uk': 'United Kingdom',
            'in': 'India',
            'ca': 'Canada',
            'au': 'Australia',
            'de': 'Germany',
            'fr': 'France',
            'es': 'Spain',
            'it': 'Italy',
            'br': 'Brazil',
            'mx': 'Mexico',
            'jp': 'Japan',
            'cn': 'China',
            'kr': 'South Korea'
        };
        
        // Get country from user's nationality or default to 'United States'
        const userCountry = (user.nationality && countryMap[user.nationality.toLowerCase()]) 
            || countryMap['us'] 
            || 'United States';
        
        // Generate unique store name
        const baseStoreName = user.username || user.email?.split('@')[0] || `Store_${userId}`;
        let storeName = baseStoreName;
        let storeNameCounter = 1;
        
        // Ensure store name is unique
        while (await MarketplaceSellerModel.findOne({ storeName })) {
            storeName = `${baseStoreName}_${storeNameCounter}`;
            storeNameCounter++;
            if (storeNameCounter > 100) {
                // Safety limit
                storeName = `${baseStoreName}_${Date.now()}`;
                break;
            }
        }
        
        // Create seller profile
        seller = await MarketplaceSellerModel.create({
            userId: userIdObjectId,
            sellerName: user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.username || user.email?.split('@')[0] || 'Seller',
            storeName: storeName,
            storeDescription: 'Seller profile auto-created. Please update your profile with complete information.',
            contactEmail: user.email || '',
            contactPhone: user.contactNumber || '',
            businessType: 'Individual',
            sellerType: 'both',
            businessAddress: {
                street: '',
                city: '',
                state: '',
                country: userCountry, // Required field
                zipCode: ''
            },
            storeLogo: user.avatar || 'https://via.placeholder.com/150',
            storeBanner: 'https://via.placeholder.com/1200x300'
        });
        
        logger.info('Minimal seller profile auto-created successfully', { 
            userId, 
            sellerId: seller._id,
            storeName: seller.storeName,
            country: userCountry
        });
        
        return seller;
    } catch (error: any) {
        logger.error('Failed to auto-create seller profile', {
            error: error.message,
            errorStack: error.stack,
            userId,
            validationErrors: error.errors,
            errorName: error.name,
            errorCode: error.code
        });
        
        // Log specific validation errors if they exist
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                logger.error(`Validation error for field ${key}`, {
                    message: error.errors[key].message,
                    value: error.errors[key].value
                });
            });
        }
        
        return null;
    }
}

/**
 * Gets seller profile with fallback query methods
 * @param userId - User ID (string or ObjectId)
 * @returns Seller profile or null
 */
export async function getSellerProfile(userId: any): Promise<any> {
    try {
        // Ensure userId is properly converted to ObjectId
        const userIdObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        
        // Try querying with ObjectId first
        let seller = await MarketplaceSellerModel.findOne({ userId: userIdObjectId });
        
        // Fallback: try with string userId if ObjectId query didn't work
        if (!seller && typeof userId === 'string') {
            seller = await MarketplaceSellerModel.findOne({ userId: userId });
        }
        
        return seller;
    } catch (error: any) {
        logger.error('Error getting seller profile', {
            error: error.message,
            userId
        });
        return null;
    }
}
