import { z } from 'zod';
import { 
  OrderStatus, 
  OrderType, 
  OfferStatus, 
  DeliveryStatus, 
  MessageKind, 
  ThreadType,
  AssetType,
  AssetAccess,
  ShopVisibility,
  ItemStatus,
  DisputeStatus,
  PayoutStatus,
  PayoutMethod,
  ReviewVisibility,
  CategoryType,
  DEFAULTS
} from '../utils/market.constants';

// Common schemas
const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
const SlugSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format');
const CurrencySchema = z.string().length(3).toUpperCase();
const RatingSchema = z.number().min(1).max(5);

// Shop schemas
export const CreateShopSchema = z.object({
  name: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().optional(),
  policies: z.object({
    refunds: z.string().max(500).optional(),
    delivery: z.string().max(500).optional(),
    communication: z.string().max(500).optional()
  }).optional()
});

export const UpdateShopSchema = CreateShopSchema.partial();

// Product schemas
export const CreateProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  tags: z.array(z.string()).max(20),
  categories: z.array(ObjectIdSchema).max(10),
  price: z.number().min(DEFAULTS.MIN_ORDER_VALUE).max(DEFAULTS.MAX_ORDER_VALUE),
  currency: CurrencySchema.default('USD'),
  discount: z.number().min(0).max(100).optional(),
  sku: z.string().max(50).optional(),
  version: z.string().max(20).optional()
});

export const UpdateProductSchema = CreateProductSchema.partial();

// Service schemas
export const ServicePackageSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  price: z.number().min(DEFAULTS.MIN_ORDER_VALUE).max(DEFAULTS.MAX_ORDER_VALUE),
  deliveryDays: z.number().min(1).max(365),
  revisions: z.number().min(0).max(10),
  features: z.array(z.string()).max(20)
});

export const ServiceExtraSchema = z.object({
  name: z.string().min(1).max(50),
  price: z.number().min(0).max(DEFAULTS.MAX_ORDER_VALUE),
  extraDays: z.number().min(0).max(30)
});

export const CreateServiceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  faqs: z.array(z.object({
    question: z.string().max(200),
    answer: z.string().max(1000)
  })).max(20).optional(),
  tags: z.array(z.string()).max(20),
  categories: z.array(ObjectIdSchema).max(10),
  packages: z.array(ServicePackageSchema).min(1).max(3),
  extras: z.array(ServiceExtraSchema).max(10).optional(),
  queueLimit: z.number().min(1).max(100).default(10)
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

// Offer schemas
export const CreateOfferSchema = z.object({
  toUserId: ObjectIdSchema,
  serviceId: ObjectIdSchema.optional(),
  customTitle: z.string().min(1).max(200),
  customScope: z.string().min(1).max(2000),
  price: z.number().min(DEFAULTS.MIN_ORDER_VALUE).max(DEFAULTS.MAX_ORDER_VALUE),
  currency: CurrencySchema.default('USD'),
  deliveryDays: z.number().min(1).max(365),
  revisions: z.number().min(0).max(10),
  extrasApplied: z.array(z.object({
    name: z.string(),
    price: z.number(),
    extraDays: z.number()
  })).optional(),
  expiresAt: z.date().min(new Date()).optional()
});

export const UpdateOfferStatusSchema = z.object({
  status: z.enum([OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.WITHDRAWN])
});

// Order schemas
export const CreateProductOrderSchema = z.object({
  productId: ObjectIdSchema
});

export const CreateServiceOrderSchema = z.object({
  serviceId: ObjectIdSchema,
  packageIndex: z.number().min(0).max(2),
  extras: z.array(z.number()).optional(),
  requirements: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).optional()
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    OrderStatus.PENDING,
    OrderStatus.IN_PROGRESS,
    OrderStatus.DELIVERED,
    OrderStatus.REVISION_REQUESTED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.DISPUTED,
    OrderStatus.REFUNDED
  ])
});

export const CancelOrderSchema = z.object({
  reason: z.string().max(500).optional()
});

export const RequestRevisionSchema = z.object({
  note: z.string().min(1).max(1000)
});

// Message schemas
export const CreateMessageSchema = z.object({
  text: z.string().min(1).max(2000),
  attachments: z.array(ObjectIdSchema).max(10).optional()
});

export const CreateThreadSchema = z.object({
  type: z.enum([ThreadType.DM, ThreadType.ORDER]),
  participants: z.array(ObjectIdSchema).min(2).max(2),
  orderId: ObjectIdSchema.optional()
});

// Delivery schemas
export const CreateDeliverySchema = z.object({
  files: z.array(ObjectIdSchema).min(1).max(10),
  note: z.string().max(1000).optional()
});

export const UpdateDeliveryStatusSchema = z.object({
  status: z.enum([DeliveryStatus.ACCEPTED, DeliveryStatus.REJECTED]),
  reason: z.string().max(500).optional()
});

// Review schemas
export const CreateReviewSchema = z.object({
  orderId: ObjectIdSchema,
  rating: RatingSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  attachments: z.array(ObjectIdSchema).max(5).optional()
});

export const UpdateReviewVisibilitySchema = z.object({
  visibility: z.enum([ReviewVisibility.ACTIVE, ReviewVisibility.HIDDEN])
});

// Dispute schemas
export const CreateDisputeSchema = z.object({
  orderId: ObjectIdSchema,
  reason: z.string().min(1).max(200),
  details: z.string().min(1).max(2000),
  attachments: z.array(ObjectIdSchema).max(5).optional()
});

export const UpdateDisputeStatusSchema = z.object({
  status: z.enum([
    DisputeStatus.UNDER_REVIEW,
    DisputeStatus.RESOLVED_REFUND,
    DisputeStatus.RESOLVED_RELEASE,
    DisputeStatus.DISMISSED
  ]),
  resolutionNotes: z.string().max(1000).optional()
});

// Category schemas
export const CreateCategorySchema = z.object({
  type: z.enum([CategoryType.PRODUCT, CategoryType.SERVICE]),
  name: z.string().min(1).max(100),
  parentId: ObjectIdSchema.optional(),
  order: z.number().min(0).optional()
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// Payout schemas
export const CreatePayoutRequestSchema = z.object({
  amount: z.number().min(1).max(DEFAULTS.MAX_ORDER_VALUE),
  currency: CurrencySchema.default('USD'),
  method: z.enum([PayoutMethod.PAYPAL, PayoutMethod.BANK, PayoutMethod.CRYPTO])
});

export const UpdatePayoutStatusSchema = z.object({
  status: z.enum([PayoutStatus.PROCESSING, PayoutStatus.PAID, PayoutStatus.FAILED])
});

// Search and filter schemas
export const SearchQuerySchema = z.object({
  query: z.string().max(200).optional(),
  type: z.enum(['product', 'service', 'all']).default('all'),
  category: ObjectIdSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  rating: z.number().min(1).max(5).optional(),
  deliveryDays: z.number().min(1).max(365).optional(),
  sortBy: z.enum(['relevance', 'newest', 'rating', 'price_asc', 'price_desc', 'delivery']).default('relevance'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(DEFAULTS.MAX_PAGINATION_LIMIT).default(DEFAULTS.PAGINATION_LIMIT)
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(DEFAULTS.MAX_PAGINATION_LIMIT).default(DEFAULTS.PAGINATION_LIMIT)
});

// Seller application schema
export const SellerApplicationSchema = z.object({
  businessName: z.string().min(1).max(100),
  businessType: z.string().min(1).max(100),
  experience: z.string().min(1).max(1000),
  portfolio: z.string().max(2000).optional(),
  skills: z.array(z.string()).min(1).max(20),
  languages: z.array(z.string()).min(1).max(10),
  timezone: z.string().optional(),
  availability: z.string().max(500).optional()
});

// File upload schemas
export const FileUploadSchema = z.object({
  type: z.enum([AssetType.PRODUCT_FILE, AssetType.MESSAGE_ATTACHMENT, AssetType.DELIVERY_FILE, AssetType.PREVIEW]),
  access: z.enum([AssetAccess.PRIVATE, AssetAccess.SIGNED, AssetAccess.PUBLIC]).default(AssetAccess.PRIVATE)
});

// Socket event schemas
export const SocketMessageSchema = z.object({
  threadId: ObjectIdSchema,
  text: z.string().min(1).max(2000),
  attachments: z.array(ObjectIdSchema).max(10).optional()
});

export const SocketTypingSchema = z.object({
  threadId: ObjectIdSchema,
  isTyping: z.boolean()
});

export const SocketPresenceSchema = z.object({
  status: z.enum(['online', 'offline', 'away', 'busy'])
});

// Validation middleware factory
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query
      });
      
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }
      
      next(error);
    }
  };
};
