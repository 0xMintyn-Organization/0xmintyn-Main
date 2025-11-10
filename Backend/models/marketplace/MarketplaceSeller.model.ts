import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceSeller extends Document {
  userId: mongoose.Types.ObjectId;
  sellerName: string;
  storeName: string;
  storeDescription: string;
  storeLogo: string;
  storeBanner: string;
  contactEmail: string;
  contactPhone: string;
  businessType: string;
  sellerType: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  taxId: string;
  paymentDetails: {
    paypalEmail: string;
    bankAccountNumber: string;
    bankName: string;
    bankIFSC: string;
    upiId: string;
  };
  sellerLevel: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  reviews?: {
    orderId?: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    rating: number;
    review: string;
    createdAt: Date;
  }[];
  totalSales: number;
  totalEarnings: number;
  responseTime: string;
  responseRate: number;
  isActive: boolean;
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceSellerSchema: Schema<IMarketplaceSeller> = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  sellerName: {
    type: String,
    required: [true, 'Seller name is required'],
    trim: true,
    maxlength: [100, 'Seller name cannot exceed 100 characters']
  },
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  storeDescription: {
    type: String,
    required: [true, 'Store description is required'],
    trim: true,
    maxlength: [1000, 'Store description cannot exceed 1000 characters']
  },
  storeLogo: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  storeBanner: {
    type: String,
    default: 'https://via.placeholder.com/1200x300'
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    trim: true
  },
  businessType: {
    type: String,
    enum: ['Individual', 'Company', 'Partnership', 'LLC', 'Corporation'],
    default: 'Individual'
  },
  sellerType: {
    type: String,
    enum: ['products', 'services', 'both'],
    default: 'both'
  },
  businessAddress: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    zipCode: {
      type: String,
      default: ''
    }
  },
  taxId: {
    type: String,
    default: ''
  },
  paymentDetails: {
    paypalEmail: {
      type: String,
      default: ''
    },
    bankAccountNumber: {
      type: String,
      default: ''
    },
    bankName: {
      type: String,
      default: ''
    },
    bankIFSC: {
      type: String,
      default: ''
    },
    upiId: {
      type: String,
      default: ''
    }
  },
  sellerLevel: {
    type: String,
    enum: ['New Seller', 'Level 1', 'Level 2', 'Top Rated', 'Pro'],
    default: 'New Seller'
  },
  verified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  reviews: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceOrder'
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalSales: {
    type: Number,
    default: 0,
    min: [0, 'Total sales cannot be negative']
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  responseTime: {
    type: String,
    default: '24 hours'
  },
  responseRate: {
    type: Number,
    default: 0,
    min: [0, 'Response rate cannot be negative'],
    max: [100, 'Response rate cannot exceed 100']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// Note: userId and storeName already have indexes from unique: true
marketplaceSellerSchema.index({ sellerLevel: 1 });
marketplaceSellerSchema.index({ rating: -1 });
marketplaceSellerSchema.index({ verified: 1 });
marketplaceSellerSchema.index({ isActive: 1 });

export const MarketplaceSellerModel = mongoose.model<IMarketplaceSeller>('MarketplaceSeller', marketplaceSellerSchema);
