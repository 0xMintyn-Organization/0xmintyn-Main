import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IP2PTrade extends Document {
  tradeNumber: string;
  offerId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  asset: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  totalPrice: number;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  timeLimit: number; // Minutes
  expiresAt: Date;
  paidAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'buyer' | 'seller' | 'system';
  disputeReason?: string;
  buyerRating?: number;
  sellerRating?: number;
  buyerFeedback?: string;
  sellerFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const p2pTradeSchema = new Schema<IP2PTrade>(
  {
    tradeNumber: {
      type: String,
      unique: true,
      required: false, // Will be auto-generated in pre-save hook
      trim: true,
      index: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'P2POffer',
      required: [true, 'Offer ID is required'],
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer ID is required'],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      index: true,
    },
    asset: {
      type: String,
      required: [true, 'Asset is required'],
    },
    side: {
      type: String,
      required: [true, 'Side is required'],
      enum: ['buy', 'sell'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'paid', 'completed', 'cancelled', 'disputed', 'refunded'],
      default: 'pending',
      index: true,
    },
    timeLimit: {
      type: Number,
      required: [true, 'Time limit is required'],
      min: [1, 'Time limit must be at least 1 minute'],
      default: 15,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },
    paidAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: String,
      enum: ['buyer', 'seller', 'system'],
    },
    disputeReason: {
      type: String,
      trim: true,
    },
    buyerRating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    sellerRating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    buyerFeedback: {
      type: String,
      trim: true,
    },
    sellerFeedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
p2pTradeSchema.index({ buyerId: 1, status: 1 });
p2pTradeSchema.index({ sellerId: 1, status: 1 });
p2pTradeSchema.index({ status: 1, expiresAt: 1 });

// Generate unique trade number before saving
p2pTradeSchema.pre('save', async function (next) {
  if (!this.tradeNumber) {
    try {
      // Try to get count from the model if it's already registered
      const Model = mongoose.models.P2PTrade || mongoose.model('P2PTrade');
      const count = await Model.countDocuments();
      this.tradeNumber = `P2P-${Date.now()}-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // Fallback: use timestamp + random string for uniqueness
      // This ensures we always have a trade number even if count fails
      this.tradeNumber = `P2P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  next();
});

const P2PTradeModel: Model<IP2PTrade> = mongoose.model<IP2PTrade>('P2PTrade', p2pTradeSchema);

export default P2PTradeModel;

