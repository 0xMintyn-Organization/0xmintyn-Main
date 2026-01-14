import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import logger from './logger';

// Configure Cloudinary using the CLOUDINARY_URL environment variable
// CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  // Fallback to individual env vars if CLOUDINARY_URL is not set
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// File type categories for organization
export enum FileCategory {
  COURSE_THUMBNAILS = 'course-thumbnails',
  PRODUCT_IMAGES = 'product-images',
  PRODUCT_FILES = 'product-files',
  SERVICE_IMAGES = 'service-images',
  USER_AVATARS = 'user-avatars',
  USER_BANNERS = 'user-banners',
  ORDER_DELIVERY = 'order-delivery',
  GENERAL = 'general'
}

// Upload options interface
interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
  publicId?: string;
  overwrite?: boolean;
  invalidate?: boolean;
  tags?: string[];
  context?: Record<string, string>;
  access_mode?: 'public' | 'authenticated' | 'private';
}

/**
 * Upload a file buffer to Cloudinary
 */
export const uploadToCloudinary = async (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<{
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
}> => {
  // Add timeout wrapper (10 minutes for large files)
  const uploadPromise = new Promise<{
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    resource_type: string;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resourceType || 'auto',
        folder: options.folder || 'general',
        transformation: options.transformation,
        public_id: options.publicId,
        overwrite: options.overwrite || false,
        invalidate: options.invalidate || true,
        tags: options.tags,
        context: options.context,
        access_mode: options.access_mode || 'public', // Ensure files are publicly accessible
        timeout: 600000, // 10 minutes timeout for Cloudinary API
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error', { 
            error: error.message, 
            errorCode: (error as any).http_code,
            options 
          });
          reject(error);
        } else if (result) {
          logger.debug('Cloudinary upload success', {
            public_id: result.public_id,
            url: result.secure_url,
            bytes: result.bytes,
            resource_type: result.resource_type
          });
          resolve(result);
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    // Convert buffer to stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });

  // Wrap with timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Cloudinary upload timeout: Upload took longer than 10 minutes'));
    }, 10 * 60 * 1000); // 10 minutes
  });

  return Promise.race([uploadPromise, timeoutPromise]);
};

/**
 * Upload a file from a file path (for existing files)
 */
export const uploadFileFromPath = async (
  filePath: string,
  options: UploadOptions = {}
): Promise<{
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
}> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: options.resourceType || 'auto',
      folder: options.folder || 'general',
      transformation: options.transformation,
      public_id: options.publicId,
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
      tags: options.tags,
      context: options.context,
      access_mode: options.access_mode || 'public', // Ensure files are publicly accessible
    });

    logger.debug('Cloudinary upload from path success', {
      public_id: result.public_id,
      url: result.secure_url,
      bytes: result.bytes
    });

    return result;
  } catch (error: any) {
    logger.error('Cloudinary upload from path error', {
      error: error.message,
      filePath,
      options
    });
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });

    if (result.result === 'ok') {
      logger.debug('Cloudinary delete success', { publicId, resourceType });
    } else {
      logger.warn('Cloudinary delete failed', {
        publicId,
        resourceType,
        result: result.result
      });
    }
  } catch (error: any) {
    logger.error('Cloudinary delete error', {
      error: error.message,
      publicId,
      resourceType
    });
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 */
export const deleteMultipleFromCloudinary = async (
  publicIds: string[],
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
      type: 'upload',
      invalidate: true
    });

    logger.debug('Cloudinary bulk delete success', {
      deleted: result.deleted,
      not_found: result.not_found,
      count: publicIds.length
    });
  } catch (error: any) {
    logger.error('Cloudinary bulk delete error', {
      error: error.message,
      publicIds,
      resourceType
    });
    throw error;
  }
};

/**
 * Generate a signed download URL for Cloudinary resources
 * Use this for authenticated/private files or when you need time-limited access
 */
export const generateSignedDownloadUrl = (
  publicId: string,
  options: {
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    expiration?: number; // Unix timestamp, defaults to 1 hour from now
  } = {}
): string => {
  const expiration = options.expiration || Math.floor(Date.now() / 1000) + 3600; // 1 hour default
  
  return cloudinary.url(publicId, {
    resource_type: options.resourceType || 'raw',
    secure: true,
    type: 'upload',
    sign_url: true,
    expiration: expiration
  });
};

/**
 * Generate a download URL that forces raw resource type
 * Useful when files were incorrectly uploaded as 'image' but are actually PDFs/ZIPs
 */
export const generateRawDownloadUrl = (
  publicId: string,
  options: {
    signed?: boolean;
    expiration?: number;
  } = {}
): string => {
  const urlOptions: any = {
    resource_type: 'raw',
    secure: true,
    type: 'upload'
  };
  
  if (options.signed) {
    urlOptions.sign_url = true;
    urlOptions.expiration = options.expiration || Math.floor(Date.now() / 1000) + 3600;
  }
  
  return cloudinary.url(publicId, urlOptions);
};

/**
 * Extract public ID from Cloudinary URL
 * Handles URLs with or without transformations, versions, and format extensions
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }
    
    // Cloudinary URL formats:
    // 1. https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
    // 2. https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{version}/{public_id}.{format}
    // 3. https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
    
    // Find the /upload/ part
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) {
      return null;
    }
    
    // Get everything after /upload/
    const afterUpload = url.substring(uploadIndex + '/upload/'.length);
    
    // Remove query parameters if any
    const withoutQuery = afterUpload.split('?')[0];
    
    // Extract version if present (format: v1234567890/)
    const versionMatch = withoutQuery.match(/^(v\d+\/)/);
    const afterVersion = versionMatch ? withoutQuery.substring(versionMatch[0].length) : withoutQuery;
    
    // Remove format extension (e.g., .pdf, .zip)
    const withoutFormat = afterVersion.replace(/\.[^.]+$/, '');
    
    // Remove any transformation flags (e.g., fl_attachment, etc.)
    // These are usually at the start before the version or public_id
    const parts = withoutFormat.split('/');
    const cleanParts = parts.filter(part => 
      !part.startsWith('fl_') && 
      !part.startsWith('q_') && 
      !part.startsWith('w_') && 
      !part.startsWith('h_') &&
      !part.match(/^[a-z_]+:/) // Skip transformation parameters like "w_500,h_300"
    );
    
    const publicId = cleanParts.join('/');
    
    if (publicId && publicId.length > 0) {
      logger.debug('Extracted public ID from URL', {
        originalUrl: url.substring(0, 100) + '...',
        publicId
      });
      return publicId;
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to extract public ID from URL', { url, error });
    return null;
  }
};

/**
 * Generate optimized image URL with transformations
 */
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    gravity?: string;
  } = {}
): string => {
  const transformations: any = {
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto',
  };

  if (options.width || options.height) {
    transformations.width = options.width;
    transformations.height = options.height;
    transformations.crop = options.crop || 'fill';
    if (options.gravity) {
      transformations.gravity = options.gravity;
    }
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [transformations]
  });
};

/**
 * Upload course thumbnail with optimizations
 */
export const uploadCourseThumbnail = async (buffer: Buffer, courseId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.COURSE_THUMBNAILS,
    resourceType: 'image',
    transformation: [
      { width: 800, height: 450, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
    ],
    tags: courseId ? [`course-${courseId}`] : ['course-thumbnail'],
    context: courseId ? { course_id: courseId } : undefined
  });

  return result.secure_url;
};

/**
 * Upload product image with optimizations
 */
export const uploadProductImage = async (buffer: Buffer, productId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.PRODUCT_IMAGES,
    resourceType: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
    ],
    tags: productId ? [`product-${productId}`] : ['product-image'],
    context: productId ? { product_id: productId } : undefined
  });

  return result.secure_url;
};

/**
 * Upload product file (ZIP, PDF, etc.)
 * IMPORTANT: Product files are uploaded as 'public' to allow direct downloads
 */
export const uploadProductFile = async (buffer: Buffer, productId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.PRODUCT_FILES,
    resourceType: 'raw',
    access_mode: 'public', // Explicitly set to public for direct downloads
    tags: productId ? [`product-${productId}`, 'downloadable'] : ['product-file'],
    context: productId ? { product_id: productId } : undefined
  });

  logger.debug('Product file uploaded', {
    public_id: result.public_id,
    resource_type: result.resource_type,
    access_mode: 'public',
    url: result.secure_url
  });

  return result.secure_url;
};

/**
 * Upload service image
 */
export const uploadServiceImage = async (buffer: Buffer, serviceId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.SERVICE_IMAGES,
    resourceType: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
    ],
    tags: serviceId ? [`service-${serviceId}`] : ['service-image'],
    context: serviceId ? { service_id: serviceId } : undefined
  });

  return result.secure_url;
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (buffer: Buffer, userId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.USER_AVATARS,
    resourceType: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }
    ],
    tags: userId ? [`user-${userId}`] : ['user-avatar'],
    context: userId ? { user_id: userId } : undefined
  });

  return result.secure_url;
};

/**
 * Upload user banner
 */
export const uploadUserBanner = async (buffer: Buffer, userId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.USER_BANNERS,
    resourceType: 'image',
    transformation: [
      { width: 1920, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
    ],
    tags: userId ? [`user-${userId}`] : ['user-banner'],
    context: userId ? { user_id: userId } : undefined
  });

  return result.secure_url;
};

/**
 * Upload order delivery file
 */
export const uploadDeliveryFile = async (buffer: Buffer, orderId?: string): Promise<string> => {
  const result = await uploadToCloudinary(buffer, {
    folder: FileCategory.ORDER_DELIVERY,
    resourceType: 'raw',
    tags: orderId ? [`order-${orderId}`] : ['delivery-file'],
    context: orderId ? { order_id: orderId } : undefined
  });

  return result.secure_url;
};

export default cloudinary;
