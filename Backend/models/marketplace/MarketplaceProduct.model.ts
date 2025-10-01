import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  thumbnailImage: string;
  fileFormat: string;
  fileSize: string;
  fileUrl: string;
  previewUrl: string;
  features: string[];
  specifications: {
    [key: string]: string;
  };
  whatIncluded: string[];
  requirements: string[];
  tags: string[];
  license: string;
  downloadLimit: number;
  accessDuration: string;
  instantDownload: boolean;
  digitalDelivery: {
    instant: boolean;
    downloadLimit: number;
    accessDuration: string;
    returnPolicy: string;
  };
  updates: {
    lifetime: boolean;
    duration: string;
  };
  support: {
    included: boolean;
    duration: string;
    type: string;
  };
  documentation: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;
  favoriteCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  approvalStatus: string;
  rejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceProductSchema: Schema<IMarketplaceProduct> = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceSeller',
    required: [true, 'Seller ID is required']
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [3000, 'Description cannot exceed 3000 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'Website Templates',
      'Design Assets', 
      'Code Templates',
      'E-books & Guides',
      'Software & Tools',
      'Stock Media',
      'Fonts & Typography',
      '3D Assets'
    ]
  },
  subcategory: {
    type: String,
    required: [true, 'Product subcategory is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  thumbnailImage: {
    type: String,
    required: [true, 'Thumbnail image is required']
  },
  fileFormat: {
    type: String,
    required: [true, 'File format is required'],
    enum: [
      'HTML/CSS',
      'Figma/Sketch', 
      'JPG/PNG',
      'PDF',
      'React Native',
      'TTF/OTF',
      'MP4',
      'MP3',
      'ZIP',
      'PSD',
      'AI',
      'SVG',
      'Other'
    ]
  },
  fileSize: {
    type: String,
    required: [true, 'File size is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  previewUrl: {
    type: String,
    default: ''
  },
  features: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  whatIncluded: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  license: {
    type: String,
    required: [true, 'License type is required'],
    enum: ['Personal', 'Commercial', 'Extended', 'Standard', 'Premium', 'Lifetime'],
    default: 'Standard'
  },
  downloadLimit: {
    type: Number,
    required: [true, 'Download limit is required'],
    min: [1, 'Download limit must be at least 1'],
    default: 5
  },
  accessDuration: {
    type: String,
    required: [true, 'Access duration is required'],
    enum: ['24 Hours', '7 Days', '30 Days', '90 Days', '1 Year', 'Lifetime'],
    default: 'Lifetime'
  },
  instantDownload: {
    type: Boolean,
    default: true
  },
  digitalDelivery: {
    instant: {
      type: Boolean,
      default: true
    },
    downloadLimit: {
      type: Number,
      default: 5
    },
    accessDuration: {
      type: String,
      default: 'Lifetime'
    },
    returnPolicy: {
      type: String,
      default: '30-day return policy'
    }
  },
  updates: {
    lifetime: {
      type: Boolean,
      default: false
    },
    duration: {
      type: String,
      default: '1 Year'
    }
  },
  support: {
    included: {
      type: Boolean,
      default: false
    },
    duration: {
      type: String,
      default: 'No Support'
    },
    type: {
      type: String,
      default: 'Email'
    }
  },
  documentation: {
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
  salesCount: {
    type: Number,
    default: 0,
    min: [0, 'Sales count cannot be negative']
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
marketplaceProductSchema.index({ sellerId: 1, isActive: 1 });
marketplaceProductSchema.index({ category: 1, isActive: 1, isApproved: 1 });
marketplaceProductSchema.index({ subcategory: 1 });
marketplaceProductSchema.index({ price: 1 });
marketplaceProductSchema.index({ rating: -1 });
marketplaceProductSchema.index({ salesCount: -1 });
marketplaceProductSchema.index({ createdAt: -1 });
marketplaceProductSchema.index({ tags: 1 });
marketplaceProductSchema.index({ isFeatured: 1, isApproved: 1 });

// Virtual for calculating discount percentage
marketplaceProductSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > 0) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

export const MarketplaceProductModel = mongoose.model<IMarketplaceProduct>('MarketplaceProduct', marketplaceProductSchema);
