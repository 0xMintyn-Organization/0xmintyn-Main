import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceOffer extends Document {
  conversationId: string; // Links to first message in conversation
  sellerId: mongoose.Types.ObjectId; // User who creates the offer (service owner)
  buyerId: mongoose.Types.ObjectId; // User who receives the offer (inquirer)
  serviceId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  offerTitle: string;
  offerDescription: string;
  deliverables: string[];
  price: number;
  deliveryTime: string; // e.g., "3 Days", "1 Week"
  revisions: number;
  additionalTerms: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed';
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceOfferSchema: Schema<IMarketplaceOffer> = new mongoose.Schema({
  conversationId: {
    type: String,
    required: [true, 'Conversation ID is required'],
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer ID is required']
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
  offerTitle: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  offerDescription: {
    type: String,
    required: [true, 'Offer description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  deliverables: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  deliveryTime: {
    type: String,
    required: [true, 'Delivery time is required'],
    enum: ['1 Day', '2 Days', '3 Days', '5 Days', '1 Week', '2 Weeks', '3 Weeks', '1 Month']
  },
  revisions: {
    type: Number,
    required: [true, 'Number of revisions is required'],
    min: [0, 'Revisions cannot be negative'],
    default: 0
  },
  additionalTerms: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional terms cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled', 'completed'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  acceptedAt: {
    type: Date,
    required: false
  },
  rejectedAt: {
    type: Date,
    required: false
  },
  cancelledAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
marketplaceOfferSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
marketplaceOfferSchema.index({ buyerId: 1, status: 1, createdAt: -1 });
marketplaceOfferSchema.index({ conversationId: 1, status: 1 });
marketplaceOfferSchema.index({ serviceId: 1 });
marketplaceOfferSchema.index({ productId: 1 });
marketplaceOfferSchema.index({ expiresAt: 1, status: 1 });

// Virtual to check if offer is expired
marketplaceOfferSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

// Virtual to check if offer is active
marketplaceOfferSchema.virtual('isActive').get(function() {
  return this.status === 'pending' && new Date() <= this.expiresAt;
});

export const MarketplaceOfferModel = mongoose.model<IMarketplaceOffer>('MarketplaceOffer', marketplaceOfferSchema);

