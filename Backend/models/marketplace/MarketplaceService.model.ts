import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceService extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  thumbnailImage: string;
  videoUrl: string;
  packages: {
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    deliveryTime: string;
    revisions: number;
    features: string[];
    isPopular: boolean;
  }[];
  addOns: {
    name: string;
    description: string;
    price: number;
  }[];
  portfolio: {
    title: string;
    description: string;
    image: string;
    category: string;
  }[];
  whatYouGet: string[];
  requirements: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  tags: string[];
  deliveryTime: string;
  revisions: string;
  rating: number;
  reviewCount: number;
  orderCount: number;
  inQueueCount: number;
  viewCount: number;
  favoriteCount: number;
  responseTime: string;
  isActive: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  approvalStatus: string;
  rejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceServiceSchema: Schema<IMarketplaceService> = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceSeller',
    required: [true, 'Seller ID is required']
  },
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [3000, 'Description cannot exceed 3000 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'Design & Creative',
      'Web Development',
      'Mobile Development',
      'Writing & Translation',
      'Digital Marketing',
      'Video & Animation',
      'Music & Audio',
      'Programming & Tech',
      'Business Services',
      'Lifestyle',
      'Data Entry & Admin',
      'Tutoring & Education'
    ]
  },
  subcategory: {
    type: String,
    required: [true, 'Service subcategory is required'],
    trim: true
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  thumbnailImage: {
    type: String,
    required: [true, 'Thumbnail image is required']
  },
  videoUrl: {
    type: String,
    default: ''
  },
  packages: [{
    name: {
      type: String,
      required: [true, 'Package name is required'],
      enum: ['Basic', 'Standard', 'Premium'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Package description is required'],
      trim: true,
      maxlength: [500, 'Package description cannot exceed 500 characters']
    },
    price: {
      type: Number,
      required: [true, 'Package price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Original price cannot be negative']
    },
    deliveryTime: {
      type: String,
      required: [true, 'Delivery time is required'],
      enum: ['1 Day', '2 Days', '3 Days', '5 Days', '1 Week', '2 Weeks', '3 Weeks', '1 Month', '2 Months']
    },
    revisions: {
      type: Number,
      required: [true, 'Number of revisions is required'],
      min: [0, 'Revisions cannot be negative'],
      default: 0
    },
    features: [{
      type: String,
      trim: true
    }],
    isPopular: {
      type: Boolean,
      default: false
    }
  }],
  addOns: [{
    name: {
      type: String,
      required: [true, 'Add-on name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Add-on description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Add-on price is required'],
      min: [0, 'Price cannot be negative']
    }
  }],
  portfolio: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String
    },
    category: {
      type: String,
      trim: true
    }
  }],
  whatYouGet: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  faqs: [{
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'FAQ answer is required'],
      trim: true
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  deliveryTime: {
    type: String,
    default: '3 Days'
  },
  revisions: {
    type: String,
    default: '2 Revisions'
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
  orderCount: {
    type: Number,
    default: 0,
    min: [0, 'Order count cannot be negative']
  },
  inQueueCount: {
    type: Number,
    default: 0,
    min: [0, 'In queue count cannot be negative']
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  favoriteCount: {
    type: Number,
    default: 0,
    min: [0, 'Favorite count cannot be negative']
  },
  responseTime: {
    type: String,
    default: '24 hours'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Under Review'],
    default: 'Pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better query performance
marketplaceServiceSchema.index({ sellerId: 1, isActive: 1 });
marketplaceServiceSchema.index({ category: 1, isActive: 1, isApproved: 1 });
marketplaceServiceSchema.index({ subcategory: 1 });
marketplaceServiceSchema.index({ 'packages.price': 1 });
marketplaceServiceSchema.index({ rating: -1 });
marketplaceServiceSchema.index({ orderCount: -1 });
marketplaceServiceSchema.index({ createdAt: -1 });
marketplaceServiceSchema.index({ tags: 1 });
marketplaceServiceSchema.index({ isFeatured: 1, isApproved: 1 });

// Virtual for getting minimum price from packages
marketplaceServiceSchema.virtual('minPrice').get(function() {
  if (this.packages && this.packages.length > 0) {
    return Math.min(...this.packages.map(pkg => pkg.price));
  }
  return 0;
});

// Virtual for getting maximum price from packages
marketplaceServiceSchema.virtual('maxPrice').get(function() {
  if (this.packages && this.packages.length > 0) {
    return Math.max(...this.packages.map(pkg => pkg.price));
  }
  return 0;
});

export const MarketplaceServiceModel = mongoose.model<IMarketplaceService>('MarketplaceService', marketplaceServiceSchema);
