import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { cloudinaryStorage } from "../middleware/cloudinaryStorage";
import { FileCategory, uploadToCloudinary } from "../utils/cloudinary";
import logger from "../utils/logger";

// Use Cloudinary storage instead of disk storage
const upload = cloudinaryStorage({
    folder: FileCategory.GENERAL,
    resourceType: 'auto'
});

// Upload single file
export const uploadFile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.debug('Upload request received', { 
            hasFile: !!req.file,
            fieldname: req.file?.fieldname,
            mimetype: req.file?.mimetype,
            filename: req.file?.originalname,
            fileSize: req.file?.size,
            bufferSize: req.file?.buffer?.length,
            queryType: req.query.type,
            bodyType: req.body.type
        });
        
        if (!req.file) {
            logger.warn('No file in request');
            return next(new ErrorHandler("No file uploaded", 400));
        }
        
        // Ensure buffer exists
        if (!req.file.buffer) {
            logger.error('File buffer is missing');
            return next(new ErrorHandler("File buffer is missing", 400));
        }
        
        logger.debug('File buffer received', {
            bufferLength: req.file.buffer.length,
            originalSize: req.file.size
        });

        // Check if this is a product file upload - accept all compressed/archive formats
        const isProductFile = req.query.type === 'product' || req.body.type === 'product';
        
        if (isProductFile) {
            // For product files, accept all compressed/archive formats
            const fileExtension = req.file.originalname.toLowerCase().substring(
                req.file.originalname.lastIndexOf('.')
            );
            
            // All compressed/archive file extensions
            const allowedExtensions = [
                '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
                '.zipx', '.ace', '.cab', '.deb', '.rpm', '.dmg', '.pkg',
                '.sit', '.sitx', '.lz', '.lzh', '.arj', '.z', '.lzma'
            ];
            
            // All compressed/archive MIME types
            const allowedMimeTypes = [
                'application/zip',
                'application/x-zip-compressed',
                'application/x-zip',
                'application/x-rar-compressed',
                'application/x-rar',
                'application/x-7z-compressed',
                'application/x-tar',
                'application/gzip',
                'application/x-gzip',
                'application/x-bzip2',
                'application/x-xz',
                'application/x-compress',
                'application/x-compressed',
                'application/octet-stream', // Some systems report archives as octet-stream
                'application/x-archive',
                'application/vnd.rar'
            ];
            
            const isValidExtension = allowedExtensions.includes(fileExtension);
            const isValidMimeType = allowedMimeTypes.includes(req.file.mimetype);
            
            // Check file signature (magic bytes) for common archive formats - safely
            let isValidSignature = false;
            try {
                if (req.file.buffer && req.file.buffer.length >= 4) {
                    const signature = req.file.buffer.slice(0, 4);
                    
                    // ZIP: PK (50 4B)
                    // RAR: Rar! (52 61 72 21)
                    // 7Z: 37 7A BC AF 27 1C
                    // GZIP: 1F 8B
                    if (signature[0] === 0x50 && signature[1] === 0x4B) { // ZIP
                        isValidSignature = true;
                    } else if (signature[0] === 0x52 && signature[1] === 0x61 && signature[2] === 0x72 && signature[3] === 0x21) { // RAR
                        isValidSignature = true;
                    } else if (signature[0] === 0x37 && signature[1] === 0x7A && signature[2] === 0xBC && signature[3] === 0xAF) { // 7Z
                        isValidSignature = true;
                    } else if (signature[0] === 0x1F && signature[1] === 0x8B) { // GZIP
                        isValidSignature = true;
                    }
                }
            } catch (sigError) {
                logger.warn('Error checking archive signature', { error: sigError });
                // Continue validation without signature check
            }
            
            // Accept if extension is valid (primary check)
            if (!isValidExtension) {
                logger.warn('Product file validation failed - invalid extension', {
                    filename: req.file.originalname,
                    extension: fileExtension,
                    mimetype: req.file.mimetype
                });
                return next(new ErrorHandler(
                    "Product files must be compressed/archive files (ZIP, RAR, 7Z, TAR, GZ, etc.). Please upload a supported archive format.",
                    400
                ));
            }
            
            // Warn if MIME type doesn't match but extension is correct
            if (!isValidMimeType && !isValidSignature) {
                logger.warn('Product file has archive extension but MIME type/signature mismatch', {
                    filename: req.file.originalname,
                    mimetype: req.file.mimetype,
                    extension: fileExtension
                });
                // Still accept if extension is valid - extension is the primary validator
            }
            
            logger.debug('Product file validated as archive', {
                filename: req.file.originalname,
                extension: fileExtension,
                mimetype: req.file.mimetype,
                hasValidSignature: isValidSignature
            });
        }

        // Determine resource type based on file MIME type
        // Product files (ZIP) should always be 'raw'
        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');
        let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
        
        if (isProductFile) {
            // Product files are always raw
            resourceType = 'raw';
        } else if (isImage) {
            resourceType = 'image';
        } else if (isVideo) {
            resourceType = 'video';
        } else {
            // PDFs, ZIPs, documents, etc. should be 'raw'
            resourceType = 'raw';
        }
        
        logger.debug('Determined resource type for upload', {
            mimetype: req.file.mimetype,
            resourceType,
            filename: req.file.originalname,
            isProductFile
        });
        
        // Upload to Cloudinary with correct resource type
        // IMPORTANT: Set access_mode to 'public' for direct downloads
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: isProductFile ? FileCategory.PRODUCT_FILES : FileCategory.GENERAL,
            resourceType: resourceType,
            access_mode: 'public' // Explicitly public for direct access
        });
        
        logger.info('File uploaded to Cloudinary successfully', {
            public_id: result.public_id,
            url: result.secure_url,
            size: result.bytes,
            resource_type: result.resource_type,
            isProductFile
        });
        
        // Extract file extension from original filename
        const fileExtension = req.file.originalname.toLowerCase().substring(
            req.file.originalname.lastIndexOf('.')
        ).replace('.', '');
        
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            url: result.secure_url,
            public_id: result.public_id,
            filename: req.file.originalname,
            originalName: req.file.originalname,
            size: result.bytes,
            mimetype: req.file.mimetype,
            format: result.format || fileExtension || 'zip', // Use actual file extension
            resource_type: result.resource_type
        });

    } catch (error: any) {
        logger.error('Upload error', { error: error.message, stack: error.stack });
        return next(new ErrorHandler(error.message, 400));
    }
});

// Upload multiple files
export const uploadMultipleFiles = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return next(new ErrorHandler("No files uploaded", 400));
        }

        // Upload all files to Cloudinary
        const files = req.files as Express.Multer.File[];
        
        const uploadPromises = files.map(file => {
            // Determine resource type based on file MIME type
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
            
            if (isImage) {
                resourceType = 'image';
            } else if (isVideo) {
                resourceType = 'video';
            } else {
                resourceType = 'raw';
            }
            
            return uploadToCloudinary(file.buffer, {
                folder: FileCategory.GENERAL,
                resourceType: resourceType,
                access_mode: 'public' // Explicitly public for direct access
            });
        });

        const results = await Promise.all(uploadPromises);
        
        const fileUrls = results.map((result, index) => ({
            url: result.secure_url,
            public_id: result.public_id,
            filename: files[index].originalname,
            originalName: files[index].originalname,
            size: result.bytes,
            mimetype: files[index].mimetype,
            format: result.format,
            resource_type: result.resource_type
        }));
        
        logger.info('Multiple files uploaded to Cloudinary', { count: fileUrls.length });
        
        res.status(200).json({
            success: true,
            message: "Files uploaded successfully",
            files: fileUrls
        });

    } catch (error: any) {
        logger.error('Multiple files upload error', { error: error.message });
        return next(new ErrorHandler(error.message, 400));
    }
});

// Export multer middleware
export { upload };
