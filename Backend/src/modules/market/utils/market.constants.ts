// Marketplace constants and enums

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded'
}

export enum OrderType {
  PRODUCT = 'product',
  SERVICE = 'service'
}

export enum OfferStatus {
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  WITHDRAWN = 'withdrawn'
}

export enum DeliveryStatus {
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum MessageKind {
  TEXT = 'text',
  ATTACHMENT = 'attachment',
  SYSTEM = 'system'
}

export enum ThreadType {
  DM = 'dm',
  ORDER = 'order'
}

export enum AssetType {
  PRODUCT_FILE = 'productFile',
  MESSAGE_ATTACHMENT = 'messageAttachment',
  DELIVERY_FILE = 'deliveryFile',
  PREVIEW = 'preview'
}

export enum AssetAccess {
  PRIVATE = 'private',
  SIGNED = 'signed',
  PUBLIC = 'public'
}

export enum ShopVisibility {
  ACTIVE = 'active',
  SUSPENDED = 'suspended'
}

export enum ItemStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED_REFUND = 'resolved_refund',
  RESOLVED_RELEASE = 'resolved_release',
  DISMISSED = 'dismissed'
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed'
}

export enum PayoutMethod {
  PAYPAL = 'paypal',
  BANK = 'bank',
  CRYPTO = 'crypto'
}

export enum ReviewVisibility {
  ACTIVE = 'active',
  HIDDEN = 'hidden'
}

export enum CategoryType {
  PRODUCT = 'product',
  SERVICE = 'service'
}

// Rate limiting buckets
export const RATE_LIMIT_BUCKETS = {
  MESSAGING: 'market:messaging',
  OFFERS: 'market:offers',
  UPLOADS: 'market:uploads',
  AUTH: 'market:auth'
} as const;

// Rate limits (requests per minute)
export const RATE_LIMITS = {
  MESSAGING: 60,
  OFFERS: 10,
  UPLOADS: 20,
  AUTH: 100
} as const;

// File size limits (in bytes)
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 250 * 1024 * 1024, // 250MB
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB for JSON payloads
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg']
} as const;

// Socket.io events
export const SOCKET_EVENTS = {
  // Client -> Server
  PRESENCE_UPDATE: 'market:presence:update',
  THREAD_JOIN: 'market:thread:join',
  THREAD_LEAVE: 'market:thread:leave',
  MESSAGE_SEND: 'market:message:send',
  TYPING: 'market:typing',
  DELIVERY_SEND: 'market:delivery:send',
  
  // Server -> Client
  MESSAGE_NEW: 'market:message:new',
  MESSAGE_READ: 'market:message:read',
  ORDER_STATUS: 'market:order:status',
  DELIVERY_NEW: 'market:delivery:new',
  OFFER_NEW: 'market:offer:new',
  NOTIFICATION: 'market:notification'
} as const;

// Socket.io rooms
export const SOCKET_ROOMS = {
  USER: (userId: string) => `user:${userId}`,
  THREAD: (threadId: string) => `thread:${threadId}`,
  ORDER: (orderId: string) => `order:${orderId}`,
  SHOP: (shopId: string) => `shop:${shopId}`
} as const;

// Default values
export const DEFAULTS = {
  OFFER_EXPIRY_DAYS: 7,
  DELIVERY_EXTENSION_DAYS: 3,
  REVIEW_WINDOW_DAYS: 30,
  DISPUTE_WINDOW_DAYS: 7,
  COMMISSION_RATE: 0.1, // 10%
  MIN_ORDER_VALUE: 5, // $5
  MAX_ORDER_VALUE: 10000, // $10,000
  PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100
} as const;

// Error messages
export const ERROR_MESSAGES = {
  SHOP_NOT_FOUND: 'Shop not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  SERVICE_NOT_FOUND: 'Service not found',
  ORDER_NOT_FOUND: 'Order not found',
  OFFER_NOT_FOUND: 'Offer not found',
  THREAD_NOT_FOUND: 'Thread not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  ASSET_NOT_FOUND: 'Asset not found',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to this resource',
  INVALID_ORDER_STATUS: 'Invalid order status transition',
  OFFER_EXPIRED: 'Offer has expired',
  ORDER_ALREADY_EXISTS: 'Order already exists for this item',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed limit',
  INVALID_FILE_TYPE: 'File type not allowed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later'
} as const;
