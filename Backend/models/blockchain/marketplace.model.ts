import mongoose, { Document, Schema } from 'mongoose';

// Marketplace Config Schema
export interface MarketplaceConfigDocument extends Document {
  programAddress: string;
  admin: string;
  feeRate: number; // basis points
  feeRecipient: string;
  totalListings: number;
  totalSales: number;
  totalVolume: string;
  isActive: boolean;
  supportedCategories: string[];
  lastSyncedAt: Date;
}

const MarketplaceConfigSchema = new Schema<MarketplaceConfigDocument>({
  programAddress: { type: String, required: true, unique: true },
  admin: { type: String, required: true, index: true },
  feeRate: { type: Number, required: true },
  feeRecipient: { type: String, required: true, index: true },
  totalListings: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalVolume: { type: String, default: '0' },
  isActive: { type: Boolean, default: true, index: true },
  supportedCategories: [{ type: String }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'marketplace_configs'
});

// Marketplace Listing Schema
export interface MarketplaceListingDocument extends Document {
  programAddress: string;
  seller: string;
  nftMint: string;
  price: string;
  isActive: boolean;
  title: string;
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  // Metadata
  nftMetadata?: {
    name?: string;
    symbol?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    externalUrl?: string;
  };
  // Tracking
  views: number;
  favorites: number;
  priceHistory: Array<{
    price: string;
    updatedBy: string;
    timestamp: Date;
  }>;
  // Sale info
  soldTo?: string;
  soldAt?: Date;
  soldPrice?: string;
  saleReference?: string; // TX hash
  lastSyncedAt: Date;
}

const MarketplaceListingSchema = new Schema<MarketplaceListingDocument>({
  programAddress: { type: String, required: true, index: true },
  seller: { type: String, required: true, index: true },
  nftMint: { type: String, required: true, unique: true, index: true },
  price: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  title: { type: String, required: true, index: 'text' },
  description: { type: String, required: true, index: 'text' },
  category: { type: String, required: true, index: true },
  nftMetadata: {
    name: { type: String, sparse: true },
    symbol: { type: String, sparse: true },
    image: { type: String, sparse: true },
    attributes: [{
      trait_type: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true }
    }],
    externalUrl: { type: String, sparse: true }
  },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  priceHistory: [{
    price: { type: String, required: true },
    updatedBy: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  soldTo: { type: String, sparse: true, index: true },
  soldAt: { type: Date, sparse: true, index: true },
  soldPrice: { type: String, sparse: true },
  saleReference: { type: String, sparse: true, index: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'marketplace_listings'
});

// Marketplace Sale Schema
export interface MarketplaceSaleDocument extends Document {
  programAddress: string;
  listing: string;
  seller: string;
  buyer: string;
  nftMint: string;
  price: string;
  feeAmount: string;
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  // Additional tracking
  listingDuration: number; // milliseconds from listing to sale
  priceAtListing: string;
  finalPrice: string;
  priceDifference: string; // final - initial
  category: string;
}

const MarketplaceSaleSchema = new Schema<MarketplaceSaleDocument>({
  programAddress: { type: String, required: true, index: true },
  listing: { type: String, required: true, index: true },
  seller: { type: String, required: true, index: true },
  buyer: { type: String, required: true, index: true },
  nftMint: { type: String, required: true, index: true },
  price: { type: String, required: true },
  feeAmount: { type: String, required: true },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  listingDuration: { type: Number, required: true },
  priceAtListing: { type: String, required: true },
  finalPrice: { type: String, required: true },
  priceDifference: { type: String, required: true },
  category: { type: String, required: true, index: true }
}, {
  timestamps: true,
  collection: 'marketplace_sales'
});

// User Activity Schema
export interface UserActivityDocument extends Document {
  user: string;
  activityType: 'list' | 'update' | 'cancel' | 'purchase' | 'view' | 'favorite';
  listing: string;
  nftMint: string;
  data: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const UserActivitySchema = new Schema<UserActivityDocument>({
  user: { type: String, required: true, index: true },
  activityType: { 
    type: String, 
    required: true, 
    enum: ['list', 'update', 'cancel', 'purchase', 'view', 'favorite'],
    index: true 
  },
  listing: { type: String, required: true, index: true },
  nftMint: { type: String, required: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String, sparse: true },
  userAgent: { type: String, sparse: true }
}, {
  timestamps: false,
  collection: 'user_activities'
});

// Marketplace Events Schema
export interface MarketplaceEventDocument extends Document {
  programAddress: string;
  eventType: 'ListingCreated' | 'ItemPurchased' | 'ListingUpdated' | 'ListingCancelled' | 'MarketplaceInitialized';
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  seller?: string;
  buyer?: string;
  nftMint?: string;
  price?: string;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

const MarketplaceEventSchema = new Schema<MarketplaceEventDocument>({
  programAddress: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['ListingCreated', 'ItemPurchased', 'ListingUpdated', 'ListingCancelled', 'MarketplaceInitialized'],
    index: true 
  },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  seller: { type: String, sparse: true, index: true },
  buyer: { type: String, sparse: true, index: true },
  nftMint: { type: String, sparse: true, index: true },
  price: { type: String, sparse: true },
  data: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date, sparse: true },
  error: { type: String, sparse: true }
}, {
  timestamps: true,
  collection: 'marketplace_events'
});

// Indexes for better query performance
MarketplaceConfigSchema.index({ isActive: 1, totalListings: 1 });

MarketplaceListingSchema.index({ programAddress: 1, seller: 1 });
MarketplaceListingSchema.index({ programAddress: 1, nftMint: 1 }, { unique: true });
MarketplaceListingSchema.index({ isActive: 1, category: 1, price: 1 });
MarketplaceListingSchema.index({ isActive: 1, createdAt: -1 });
MarketplaceListingSchema.index({ seller: 1, isActive: 1 });
MarketplaceListingSchema.index({ category: 1, isActive: 1, price: 1 });
MarketplaceListingSchema.index({ '$**': 'text' }); // Full text search

MarketplaceSaleSchema.index({ seller: 1, blockTime: -1 });
MarketplaceSaleSchema.index({ buyer: 1, blockTime: -1 });
MarketplaceSaleSchema.index({ category: 1, blockTime: -1 });
MarketplaceSaleSchema.index({ blockTime: -1, price: -1 });

UserActivitySchema.index({ user: 1, timestamp: -1 });
UserActivitySchema.index({ listing: 1, activityType: 1, timestamp: -1 });
UserActivitySchema.index({ activityType: 1, timestamp: -1 });

MarketplaceEventSchema.index({ eventType: 1, blockTime: -1 });
MarketplaceEventSchema.index({ seller: 1, eventType: 1, blockTime: -1 });
MarketplaceEventSchema.index({ processed: 1, blockTime: 1 });

// Create models
export const MarketplaceConfig = mongoose.model<MarketplaceConfigDocument>('MarketplaceConfig', MarketplaceConfigSchema);
export const MarketplaceListing = mongoose.model<MarketplaceListingDocument>('MarketplaceListing', MarketplaceListingSchema);
export const MarketplaceSale = mongoose.model<MarketplaceSaleDocument>('MarketplaceSale', MarketplaceSaleSchema);
export const UserActivity = mongoose.model<UserActivityDocument>('UserActivity', UserActivitySchema);
export const MarketplaceEvent = mongoose.model<MarketplaceEventDocument>('MarketplaceEvent', MarketplaceEventSchema);

// Utility functions for Marketplace models
export class MarketplaceModelUtils {
  static async getUserStats(user: string) {
    const listings = await MarketplaceListing.countDocuments({ seller: user });
    const activeListings = await MarketplaceListing.countDocuments({ seller: user, isActive: true });
    const sales = await MarketplaceSale.countDocuments({ seller: user });
    const purchases = await MarketplaceSale.countDocuments({ buyer: user });
    
    const totalSalesValue = await MarketplaceSale.aggregate([
      { $match: { seller: user } },
      { $group: { _id: null, total: { $sum: { $toDecimal: '$price' } } } }
    ]);
    
    const totalPurchaseValue = await MarketplaceSale.aggregate([
      { $match: { buyer: user } },
      { $group: { _id: null, total: { $sum: { $toDecimal: '$price' } } } }
    ]);
    
    return {
      listings,
      activeListings,
      sales,
      purchases,
      totalSalesValue: totalSalesValue[0]?.total?.toString() || '0',
      totalPurchaseValue: totalPurchaseValue[0]?.total?.toString() || '0'
    };
  }

  static async getMarketStats(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const timeframeMap = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    const startTime = new Date(now.getTime() - timeframeMap[timeframe]);
    
    const sales = await MarketplaceSale.countDocuments({ blockTime: { $gte: startTime } });
    const volume = await MarketplaceSale.aggregate([
      { $match: { blockTime: { $gte: startTime } } },
      { $group: { _id: null, total: { $sum: { $toDecimal: '$price' } } } }
    ]);
    
    const newListings = await MarketplaceListing.countDocuments({ createdAt: { $gte: startTime } });
    const activeListings = await MarketplaceListing.countDocuments({ isActive: true });
    
    const topCategories = await MarketplaceSale.aggregate([
      { $match: { blockTime: { $gte: startTime } } },
      { $group: { _id: '$category', count: { $sum: 1 }, volume: { $sum: { $toDecimal: '$price' } } } },
      { $sort: { volume: -1 } },
      { $limit: 10 }
    ]);
    
    return {
      timeframe,
      sales,
      volume: volume[0]?.total?.toString() || '0',
      newListings,
      activeListings,
      topCategories
    };
  }

  static async getListingRecommendations(user: string, limit: number = 10) {
    // Get user's purchase history to recommend similar items
    const userPurchases = await MarketplaceSale.find({ buyer: user }).limit(20);
    const purchasedCategories = [...new Set(userPurchases.map(p => p.category))];
    
    // Get user's activity to understand preferences
    const userActivities = await UserActivity.find({ 
      user, 
      activityType: { $in: ['view', 'favorite'] } 
    }).limit(50);
    
    const viewedListings = userActivities.map(a => a.listing);
    
    // Find similar listings
    const recommendations = await MarketplaceListing.find({
      isActive: true,
      seller: { $ne: user }, // Don't recommend user's own listings
      programAddress: { $nin: viewedListings }, // Exclude already viewed
      $or: [
        { category: { $in: purchasedCategories } },
        // Add more sophisticated recommendation logic here
      ]
    })
    .sort({ createdAt: -1, favorites: -1 })
    .limit(limit);
    
    return recommendations;
  }

  static async getTrendingListings(limit: number = 20) {
    const recentTimeframe = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    // Get listings with most recent activity
    const trending = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: recentTimeframe }, activityType: { $in: ['view', 'favorite'] } } },
      { $group: { _id: '$listing', activityCount: { $sum: 1 } } },
      { $sort: { activityCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'marketplace_listings',
          localField: '_id',
          foreignField: 'programAddress',
          as: 'listing'
        }
      },
      { $unwind: '$listing' },
      { $match: { 'listing.isActive': true } },
      { $sort: { activityCount: -1 } }
    ]);
    
    return trending;
  }

  static async searchListings(
    query: string,
    filters: {
      category?: string;
      minPrice?: string;
      maxPrice?: string;
      seller?: string;
    } = {},
    sort: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular' = 'newest',
    limit: number = 20,
    skip: number = 0
  ) {
    const matchConditions: any = { isActive: true };
    
    // Text search
    if (query) {
      matchConditions.$text = { $search: query };
    }
    
    // Apply filters
    if (filters.category) {
      matchConditions.category = filters.category;
    }
    
    if (filters.seller) {
      matchConditions.seller = filters.seller;
    }
    
    if (filters.minPrice || filters.maxPrice) {
      matchConditions.price = {};
      if (filters.minPrice) {
        matchConditions.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        matchConditions.price.$lte = filters.maxPrice;
      }
    }
    
    // Sort options
    const sortOptions: any = {};
    switch (sort) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'price_low':
        sortOptions.price = 1;
        break;
      case 'price_high':
        sortOptions.price = -1;
        break;
      case 'popular':
        sortOptions.favorites = -1;
        sortOptions.views = -1;
        break;
    }
    
    const listings = await MarketplaceListing.find(matchConditions)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    const total = await MarketplaceListing.countDocuments(matchConditions);
    
    return {
      listings,
      total,
      hasMore: skip + limit < total
    };
  }

  static async recordUserActivity(
    user: string,
    activityType: 'list' | 'update' | 'cancel' | 'purchase' | 'view' | 'favorite',
    listing: string,
    nftMint: string,
    data: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    const activity = new UserActivity({
      user,
      activityType,
      listing,
      nftMint,
      data,
      ipAddress,
      userAgent
    });
    
    await activity.save();
    
    // Update listing metrics for view/favorite activities
    if (activityType === 'view') {
      await MarketplaceListing.updateOne(
        { programAddress: listing },
        { $inc: { views: 1 } }
      );
    } else if (activityType === 'favorite') {
      await MarketplaceListing.updateOne(
        { programAddress: listing },
        { $inc: { favorites: 1 } }
      );
    }
    
    return activity;
  }
}













