import multer from 'multer';
import { uploadToCloudinary, FileCategory } from '../utils/cloudinary';
import logger from '../utils/logger';

/**
 * Cloudinary storage engine for Multer
 * This replaces disk storage and uploads directly to Cloudinary
 */
export const cloudinaryStorage = (options: {
  folder?: FileCategory | string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
  tags?: string[];
} = {}) => {
  const storage = multer.memoryStorage(); // Store in memory before uploading to Cloudinary

  return multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      // FIRST: Check if file extension is a compressed/archive format - allow immediately (for product files)
      // This bypasses MIME type checking for archives since MIME types can be inconsistent
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      const archiveExtensions = [
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
        '.zipx', '.ace', '.cab', '.deb', '.rpm', '.dmg', '.pkg',
        '.sit', '.sitx', '.lz', '.lzh', '.arj', '.z', '.lzma'
      ];
      if (archiveExtensions.includes(fileExtension)) {
        cb(null, true);
        return;
      }
      
      // THEN: Check MIME types for other file formats
      const allowedTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp',
        // Documents
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Archives - All compressed/archive formats (comprehensive list)
        'application/zip', 
        'application/x-zip-compressed',
        'application/x-zip',
        'application/x-rar-compressed',
        'application/x-rar',
        'application/vnd.rar',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-gzip',
        'application/x-bzip2',
        'application/x-xz',
        'application/x-compress',
        'application/x-compressed', // This was missing!
        'application/x-archive',
        'application/compress',
        'application/x-compressed-tar',
        // Code files
        'text/html', 'text/css', 'text/javascript', 'application/javascript',
        'text/typescript', 'application/typescript',
        // Design files
        'application/vnd.adobe.illustrator', 'application/vnd.adobe.photoshop',
        // Audio/Video
        'video/mp4', 'audio/mpeg', 'audio/mp3',
        // Fonts
        'font/ttf', 'font/otf', 'application/x-font-ttf', 'application/x-font-otf',
        // Additional
        'application/octet-stream', // Some systems report archives as octet-stream
        'text/plain'
      ];
      
      // Check if MIME type is in allowed list
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Please upload a supported file format.`));
      }
    }
  });
};

/**
 * Middleware to upload file to Cloudinary after multer processes it
 */
export const uploadToCloudinaryMiddleware = async (
  req: any,
  res: any,
  next: any,
  options: {
    folder?: FileCategory | string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any[];
    tags?: string[];
    context?: Record<string, string>;
  } = {}
) => {
  try {
    // Handle single file
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: options.folder || FileCategory.GENERAL,
        resourceType: options.resourceType || 'auto',
        transformation: options.transformation,
        tags: options.tags,
        context: options.context,
      });

      // Attach Cloudinary info to file object
      req.file.cloudinary = {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resource_type: result.resource_type,
      };

      // Replace filename with Cloudinary URL
      req.file.filename = result.secure_url;
      req.file.path = result.secure_url;
    }

    // Handle multiple files
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map(async (file: any) => {
        const result = await uploadToCloudinary(file.buffer, {
          folder: options.folder || FileCategory.GENERAL,
          resourceType: options.resourceType || 'auto',
          transformation: options.transformation,
          tags: options.tags,
          context: options.context,
        });

        file.cloudinary = {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resource_type: result.resource_type,
        };

        file.filename = result.secure_url;
        file.path = result.secure_url;

        return file;
      });

      await Promise.all(uploadPromises);
    }

    next();
  } catch (error: any) {
    logger.error('Cloudinary upload middleware error', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

export default cloudinaryStorage;
