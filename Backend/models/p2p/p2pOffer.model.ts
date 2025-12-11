import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IP2POffer extends Document {
  traderId: mongoose.Types.ObjectId;
  asset: string; // USDT, BTC, ETH, etc.
  side: 'buy' | 'sell';
  price: number;
  available: number; // Available amount in selected asset
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  timeLimit: number; // Minutes
  isActive: boolean;
  isOnline: boolean;
  completedTrades: number;
  completionRate: number;
  responseRate: number;
  responseTime: number; // Minutes
  traderRating: number;
  createdAt: Date;
  updatedAt: Date;
}

const p2pOfferSchema = new Schema<IP2POffer>(
  {
    traderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trader ID is required'],
      index: true,
    },
    asset: {
      type: String,
      required: [true, 'Asset is required'],
      enum: ['USDT', 'BTC', 'ETH', 'BNB', 'OXM', 'SOL', 'ADA', 'DOT', 'DOGE', 'XRP', 'MATIC', 'AVAX', 'LINK', 'UNI', 'LTC', 'BCH', 'XLM', 'ALGO', 'ATOM', 'VET', 'FIL', 'TRX', 'ETC', 'THETA', 'EOS', 'AAVE', 'MKR', 'COMP', 'SNX', 'YFI', 'SUSHI', 'CRV', '1INCH', 'ENJ', 'SAND', 'MANA', 'AXS', 'GALA', 'CHZ', 'FLOW', 'ICP', 'NEAR', 'APT', 'SUI', 'ARB', 'OP', 'TST', 'DOLO', 'FDUSD', 'USDC'],
      index: true,
    },
    side: {
      type: String,
      required: [true, 'Side is required'],
      enum: ['buy', 'sell'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    available: {
      type: Number,
      required: [true, 'Available amount is required'],
      min: [0, 'Available amount cannot be negative'],
    },
    minLimit: {
      type: Number,
      required: [true, 'Minimum limit is required'],
      min: [0, 'Minimum limit cannot be negative'],
    },
    maxLimit: {
      type: Number,
      required: [true, 'Maximum limit is required'],
      min: [0, 'Maximum limit cannot be negative'],
    },
    paymentMethods: {
      type: [String],
      required: [true, 'Payment methods are required'],
      default: [],
    },
    timeLimit: {
      type: Number,
      required: [true, 'Time limit is required'],
      min: [1, 'Time limit must be at least 1 minute'],
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    completedTrades: {
      type: Number,
      default: 0,
      min: [0, 'Completed trades cannot be negative'],
    },
    completionRate: {
      type: Number,
      default: 100,
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100'],
    },
    responseRate: {
      type: Number,
      default: 100,
      min: [0, 'Response rate cannot be negative'],
      max: [100, 'Response rate cannot exceed 100'],
    },
    responseTime: {
      type: Number,
      default: 15,
      min: [0, 'Response time cannot be negative'],
    },
    traderRating: {
      type: Number,
      default: 5.0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
p2pOfferSchema.index({ asset: 1, side: 1, isActive: 1 });
p2pOfferSchema.index({ traderId: 1, isActive: 1 });
p2pOfferSchema.index({ price: 1, asset: 1, side: 1 });

const P2POfferModel: Model<IP2POffer> = mongoose.model<IP2POffer>('P2POffer', p2pOfferSchema);

export default P2POfferModel;

