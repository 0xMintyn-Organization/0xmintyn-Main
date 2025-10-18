import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceReview extends Document {
  orderId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceReviewSchema: Schema<IMarketplaceReview> = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceOrder',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceSeller',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceService',
    required: false
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceProduct',
    required: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
marketplaceReviewSchema.index({ orderId: 1 });
marketplaceReviewSchema.index({ buyerId: 1 });
marketplaceReviewSchema.index({ sellerId: 1 });
marketplaceReviewSchema.index({ serviceId: 1 });
marketplaceReviewSchema.index({ productId: 1 });
marketplaceReviewSchema.index({ rating: 1 });
marketplaceReviewSchema.index({ createdAt: -1 });

export const MarketplaceReviewModel = mongoose.model<IMarketplaceReview>('MarketplaceReview', marketplaceReviewSchema);

