import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceOrder extends Document {
  orderNumber: string;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId;
  items: {
    itemId: mongoose.Types.ObjectId;
    itemType: 'product' | 'service';
    itemTitle: string;
    itemPrice: number;
    itemImage: string;
    quantity: number;
    totalPrice: number;
    // For services - package details
    packageDetails?: {
      packageName: string;
      features: string[];
      deliveryTime: string;
      revisions: number;
    };
    // For products - file details
    fileDetails?: {
      fileName: string;
      fileSize: number;
      fileFormat: string;
      downloadCount: number;
      maxDownloads: number;
    };
  }[];
  orderTotal: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: string;
  paymentDetails?: {
    transactionId?: string;
    gateway?: string;
    amount: number;
    fees: number;
    netAmount: number;
  };
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled' | 'refunded';
  shippingAddress?: {
    fullName: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  // Delivery tracking fields
  deliveryDate?: Date;
  deliveryMessage?: string;
  deliveryFiles?: {
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  }[];
  estimatedDeliveryDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  // Revision tracking
  revisionRequest?: {
    requestedAt: Date;
    requestedBy: mongoose.Types.ObjectId;
    revisionReason: string;
    revisionDetails: string;
    requestedChanges: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    respondedAt?: Date;
    responseMessage?: string;
    revisionFiles?: {
      filename: string;
      originalName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: Date;
    }[];
  };
  revisionCount: number;
  maxRevisions: number;
  // Status timeline
  statusHistory?: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceOrderSchema: Schema<IMarketplaceOrder> = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    trim: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer ID is required']
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceSeller',
    required: [true, 'Seller ID is required']
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Item ID is required']
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: ['product', 'service']
    },
    itemTitle: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true
    },
    itemPrice: {
      type: Number,
      required: [true, 'Item price is required'],
      min: [0, 'Price cannot be negative']
    },
    itemImage: {
      type: String,
      required: [true, 'Item image is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    packageDetails: {
      packageName: {
        type: String,
        trim: true
      },
      features: [{
        type: String,
        trim: true
      }],
      deliveryTime: {
        type: String,
        trim: true
      },
      revisions: {
        type: Number,
        min: [0, 'Revisions cannot be negative']
      }
    },
    fileDetails: {
      fileName: {
        type: String,
        trim: true
      },
      fileSize: {
        type: String,
        trim: true
      },
      fileFormat: {
        type: String,
        trim: true
      },
      downloadCount: {
        type: Number,
        default: 0,
        min: [0, 'Download count cannot be negative']
      },
      maxDownloads: {
        type: Number,
        default: 5,
        min: [1, 'Max downloads must be at least 1']
      }
    }
  }],
  orderTotal: {
    type: Number,
    required: [true, 'Order total is required'],
    min: [0, 'Order total cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BTC', 'ETH', 'USDT', 'USDC']
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  paymentDetails: {
    transactionId: {
      type: String,
      trim: true
    },
    gateway: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative']
    },
    fees: {
      type: Number,
      min: [0, 'Fees cannot be negative']
    },
    netAmount: {
      type: Number,
      min: [0, 'Net amount cannot be negative']
    }
  },
  orderStatus: {
    type: String,
    required: [true, 'Order status is required'],
    enum: ['pending', 'confirmed', 'processing', 'delivered', 'revision_requested', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceOffer',
    required: false
  },
  deliveryDate: {
    type: Date,
    required: false
  },
  deliveryMessage: {
    type: String,
    trim: true,
    maxlength: [2000, 'Delivery message cannot exceed 2000 characters']
  },
  deliveryFiles: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedDeliveryDate: {
    type: Date,
    required: false
  },
  startedAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  cancelledAt: {
    type: Date,
    required: false
  },
  revisionRequest: {
    requestedAt: {
      type: Date
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revisionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Revision reason cannot exceed 500 characters']
    },
    revisionDetails: {
      type: String,
      trim: true,
      maxlength: [2000, 'Revision details cannot exceed 2000 characters']
    },
    requestedChanges: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected']
    },
    respondedAt: {
      type: Date,
      required: false
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response message cannot exceed 2000 characters']
    },
    revisionFiles: [{
      filename: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileSize: {
        type: Number,
        required: true
      },
      mimeType: {
        type: String,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  revisionCount: {
    type: Number,
    default: 0,
    min: [0, 'Revision count cannot be negative']
  },
  maxRevisions: {
    type: Number,
    default: 3,
    min: [0, 'Max revisions cannot be negative']
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
marketplaceOrderSchema.index({ buyerId: 1, isActive: 1 });
marketplaceOrderSchema.index({ sellerId: 1, isActive: 1 });
marketplaceOrderSchema.index({ orderNumber: 1 });
marketplaceOrderSchema.index({ paymentStatus: 1 });
marketplaceOrderSchema.index({ orderStatus: 1 });
marketplaceOrderSchema.index({ createdAt: -1 });
marketplaceOrderSchema.index({ 'items.itemId': 1, 'items.itemType': 1 });

// Pre-save middleware to generate order number
marketplaceOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const count = await MarketplaceOrderModel.countDocuments();
      this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

// Virtual for checking if order is completed
marketplaceOrderSchema.virtual('isCompleted').get(function() {
  return this.paymentStatus === 'completed' && this.orderStatus === 'completed';
});

// Virtual for checking if order can be cancelled
marketplaceOrderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.orderStatus) && 
         ['pending', 'completed'].includes(this.paymentStatus);
});

// Virtual for checking if order can be refunded
marketplaceOrderSchema.virtual('canBeRefunded').get(function() {
  return this.paymentStatus === 'completed' && 
         ['completed', 'cancelled'].includes(this.orderStatus);
});

export const MarketplaceOrderModel = mongoose.model<IMarketplaceOrder>('MarketplaceOrder', marketplaceOrderSchema);
