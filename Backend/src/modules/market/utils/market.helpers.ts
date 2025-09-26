import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { DEFAULTS } from './market.constants';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate signed URL for private assets
 */
export const generateSignedUrl = async (
  publicId: string,
  options: {
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    expires_in?: number;
    transformation?: any;
  } = {}
): Promise<string> => {
  const {
    resource_type = 'auto',
    expires_in = 3600, // 1 hour default
    transformation = {}
  } = options;

  try {
    const url = cloudinary.url(publicId, {
      resource_type,
      expires_in,
      sign_url: true,
      transformation
    });
    
    return url;
  } catch (error) {
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
};

/**
 * Upload file to Cloudinary with security settings
 */
export const uploadToCloudinary = async (
  file: any, // Simplified for now
  options: {
    folder?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any;
    access_mode?: 'public' | 'authenticated';
  } = {}
): Promise<{
  public_id: string;
  secure_url: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
}> => {
  const {
    folder = 'marketplace',
    resource_type = 'auto',
    transformation = {},
    access_mode = 'authenticated'
  } = options;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type,
      transformation,
      access_mode,
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Failed to upload to Cloudinary: ${error}`);
  }
};

/**
 * Delete asset from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Failed to delete from Cloudinary: ${error}`);
  }
};

/**
 * Calculate pricing with commission
 */
export const calculatePricing = (basePrice: number, commissionRate: number = DEFAULTS.COMMISSION_RATE) => {
  const commission = basePrice * commissionRate;
  const sellerEarnings = basePrice - commission;
  
  return {
    basePrice,
    commission,
    sellerEarnings,
    commissionRate
  };
};

/**
 * Generate unique slug from title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 100); // Limit length
};

/**
 * Ensure unique slug by appending number if needed
 */
export const ensureUniqueSlug = async (
  baseSlug: string,
  checkFunction: (slug: string) => Promise<boolean>
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (await checkFunction(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

/**
 * Calculate delivery deadline
 */
export const calculateDeliveryDeadline = (deliveryDays: number, startDate?: Date): Date => {
  const start = startDate || new Date();
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + deliveryDays);
  return deadline;
};

/**
 * Check if offer is expired
 */
export const isOfferExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

/**
 * Generate file checksum for integrity
 */
export const generateFileChecksum = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Validate file type
 */
export const validateFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};

/**
 * Generate order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

/**
 * Calculate rating average
 */
export const calculateRatingAverage = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
};

/**
 * Check if user can access resource
 */
export const canAccessResource = (
  userId: string,
  resourceOwnerId: string,
  userRole: string,
  adminRoles: string[] = ['admin']
): boolean => {
  return userId === resourceOwnerId || adminRoles.includes(userRole);
};

/**
 * Generate pagination metadata
 */
export const generatePaginationMeta = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

/**
 * Build search query for text search
 */
export const buildSearchQuery = (searchTerm: string, fields: string[]) => {
  if (!searchTerm) return {};
  
  return {
    $or: fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

/**
 * Validate price range
 */
export const validatePriceRange = (minPrice?: number, maxPrice?: number): boolean => {
  if (minPrice !== undefined && minPrice < 0) return false;
  if (maxPrice !== undefined && maxPrice < 0) return false;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) return false;
  return true;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};
