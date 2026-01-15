import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";
import path from "path";
import fs from "fs";
import axios from "axios";
import { v2 as cloudinary } from 'cloudinary';
import { extractPublicIdFromUrl } from "../../utils/cloudinary";
import logger from "../../utils/logger";

// Get product file after purchase (Protected - Buyer only)
export const getProductFile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const userId = req.user?._id;

        // Check if user exists
        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get product
        const product = await MarketplaceProductModel.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check if product is approved and active
        if (!product.isApproved || !product.isActive) {
            return next(new ErrorHandler("Product not available", 404));
        }

        // Verify purchase: Check multiple sources
        // 1. Check user.purchasedProducts array
        let hasPurchased = user.purchasedProducts?.some((p: any) => 
            p.productId?.toString() === productId || p.toString() === productId
        );
        
        // 2. If not found in purchasedProducts, check orders directly
        // For digital products, allow download if order exists and is not cancelled/refunded
        if (!hasPurchased) {
            const order = await MarketplaceOrderModel.findOne({
                buyerId: userId,
                'items.itemId': productId,
                'items.itemType': 'product',
                orderStatus: { $nin: ['cancelled', 'refunded'] }, // Exclude cancelled/refunded
                paymentStatus: { $nin: ['refunded', 'cancelled'] } // Exclude refunded/cancelled payments
            });
            hasPurchased = !!order;
        }
        
        // Allow access if: user purchased it, user is the seller, or user is admin
        const isSeller = product.sellerId.toString() === userId.toString();
        const isAdmin = user.role === 'admin';
        
        if (!hasPurchased && !isSeller && !isAdmin) {
            return next(new ErrorHandler("You must purchase this product to download the file", 403));
        }

        // Check if file exists
        if (!product.fileUrl) {
            return next(new ErrorHandler("File not available", 404));
        }

        // If file is on Cloudinary, download it directly
        if (product.fileUrl.includes('cloudinary.com')) {
            try {
                logger.debug('Downloading file from Cloudinary', { 
                    productId, 
                    fileUrl: product.fileUrl 
                });

                // Sanitize filename and remove any existing extensions
                const sanitizeFileName = (filename: string) => {
                    if (!filename) return 'download';
                    
                    let cleanName = filename;
                    
                    // STEP 1: Remove compound extensions FIRST (before single extensions)
                    // This handles "image.jpg_png" -> "image" (MUST be first!)
                    cleanName = cleanName.replace(/\.[a-z]+_[a-z]+$/i, ''); // .jpg_png, .png_jpg, etc.
                    cleanName = cleanName.replace(/_[a-z]+\.[a-z]+$/i, ''); // _jpg.png, _png.jpg, etc.
                    cleanName = cleanName.replace(/\.[a-z]+\.[a-z]+$/i, ''); // .jpg.png, .png.jpg, etc.
                    cleanName = cleanName.replace(/_[a-z]+_[a-z]+$/i, ''); // _jpg_png, _png_jpg, etc.
                    
                    // STEP 2: Remove any file extensions (common ones) - single extensions only
                    const extensionsToRemove = [
                        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
                        '.zipx', '.ace', '.cab', '.deb', '.rpm', '.dmg', '.pkg',
                        '.sit', '.sitx', '.lz', '.lzh', '.arj', '.z', '.lzma',
                        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
                        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                        '.mp4', '.mp3', '.avi', '.mov', '.wav', '.ogg'
                    ];
                    
                    // Remove extension if present (case insensitive)
                    for (const ext of extensionsToRemove) {
                        const regex = new RegExp(`\\${ext}$`, 'i');
                        cleanName = cleanName.replace(regex, '');
                    }
                    
                    // STEP 2: Remove patterns with separators like .jpg.png, _jpg_png
                    cleanName = cleanName.replace(/[._](jpg|jpeg|png|gif|webp|svg|zip|rar|7z|pdf|doc|docx|mp4|mp3|avi|mov|wav|ogg|txt|html|css|js|json|xml)[._](jpg|jpeg|png|gif|webp|svg|zip|rar|7z|pdf|doc|docx|mp4|mp3|avi|mov|wav|ogg|txt|html|css|js|json|xml)$/i, '');
                    
                    // STEP 3: Remove single extensions with dots or underscores
                    cleanName = cleanName.replace(/[._](jpg|jpeg|png|gif|webp|svg|zip|rar|7z|pdf|doc|docx|mp4|mp3|avi|mov|wav|ogg|txt|html|css|js|json|xml)$/i, '');
                    
                    // STEP 4: Remove any trailing underscore + short alphanumeric (catch-all for extensions)
                    cleanName = cleanName.replace(/_[a-z0-9]{1,10}$/i, '');
                    
                    // STEP 5: Remove any trailing dot + short alphanumeric (catch-all for extensions)
                    cleanName = cleanName.replace(/\.[a-z0-9]{1,10}$/i, '');
                    
                    // Clean the filename
                    return cleanName
                        .replace(/["\n\r\t]/g, '_')
                        .replace(/[^\w\s.-]/g, '_')
                        .replace(/\s+/g, '_')
                        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
                        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
                .trim()
                        .substring(0, 200) || 'download'; // Ensure we have a name
        };

                // For product files, ALWAYS save as .zip regardless of actual file type
                // IGNORE fileFormat completely - it might be wrong
                const safeFileName = sanitizeFileName(product.title);
                const fileExtension = 'zip'; // ALWAYS use zip for product files
                
                logger.debug('Product file download - forcing .zip extension', {
                    fileExtension: 'zip',
                    fileUrl: product.fileUrl,
                    fileFormat: product.fileFormat,
                    productTitle: product.title
                });

                // Extract public ID and try to download
                const publicId = extractPublicIdFromUrl(product.fileUrl);
                
                if (!publicId) {
                    return next(new ErrorHandler("Could not extract file ID from URL", 400));
                }
                
                let cloudinaryResponse: any = null;
                
                // Try resource types: raw first (for PDFs/ZIPs), then image, then video
                const resourceTypesToTry: Array<'raw' | 'image' | 'video'> = ['raw', 'image', 'video'];
                
                for (const resourceType of resourceTypesToTry) {
                    try {
                        // Check if file exists with this resource type
                        const resource = await cloudinary.api.resource(publicId, {
                            resource_type: resourceType,
                            type: 'upload'
                        });
                        
                        if (resource) {
                            // Generate download URL (use signed URL to bypass restrictions)
                            const downloadUrl = cloudinary.url(publicId, {
                                resource_type: resourceType,
                                secure: true,
                                type: 'upload',
                                sign_url: true, // Always use signed URL for reliability
                                expiration: Math.floor(Date.now() / 1000) + 3600
                            });
                            
                            // Download the file
                            cloudinaryResponse = await axios.get(downloadUrl, {
                                responseType: 'stream',
                                timeout: 30000,
                                maxRedirects: 5
                            });
                            
                            if (cloudinaryResponse.status >= 200 && cloudinaryResponse.status < 300) {
                                logger.debug('File downloaded successfully', { resourceType });
                                break; // Success!
                            }
                        }
                    } catch (error: any) {
                        // Try next resource type
                        continue;
                    }
                }
                
                // If all resource types failed, return error
                if (!cloudinaryResponse || cloudinaryResponse.status >= 400) {
                    return next(new ErrorHandler(
                        `File not accessible. Please ensure PDF/ZIP delivery is enabled in Cloudinary Security settings.`,
                        404
                    ));
                }

                // Finalize filename - ALWAYS use .zip extension for product files
                // safeFileName has already been cleaned (extensions removed from product.title)
                // So fileName will be: "Product_Title.zip" (never "Product_Title.jpg_png.zip")
                // COMPLETELY IGNORE fileFormat - it's not used in filename at all
                const fileName = `${safeFileName}.zip`;
                
                // Log for debugging
                logger.debug('Final download filename', {
                    originalTitle: product.title,
                    cleanedFileName: safeFileName,
                    finalFileName: fileName,
                    fileFormat: product.fileFormat, // Just for logging, NOT used in filename
                    fileUrl: product.fileUrl
                });

                // Set Content-Type FIRST (before Content-Disposition) - ALWAYS application/zip for product files
                res.setHeader('Content-Type', 'application/zip');
                
                // Set Content-Disposition AFTER Content-Type
                // Use both standard and RFC 5987 format for maximum browser compatibility
                const encodedFileName = encodeURIComponent(fileName);
                // Standard format for basic ASCII compatibility
                const safeFileName = fileName.replace(/"/g, '\\"').replace(/\n/g, '');
                // RFC 5987 format for UTF-8 support
                res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
                
                logger.debug('Download headers set', {
                    fileName,
                    fileExtension: 'zip',
                    contentType: 'application/zip',
                    contentDisposition: `attachment; filename="${fileName}"`
                });
                
                // Set content length if available
                if (cloudinaryResponse.headers['content-length']) {
                    res.setHeader('Content-Length', cloudinaryResponse.headers['content-length']);
                }

                // Handle stream errors before piping
                cloudinaryResponse.data.on('error', (streamError: any) => {
                    logger.error('Error streaming file from Cloudinary', { 
                        error: streamError.message, 
                        productId 
                    });
                    if (!res.headersSent) {
                        res.status(500).json({ 
                            success: false, 
                            message: "Error downloading file" 
                        });
                    } else {
                        // If headers already sent, we can't send JSON, just end the response
                        res.end();
                    }
                });

                // Stream the file to the client
                cloudinaryResponse.data.pipe(res);

                // Handle client disconnect
                res.on('close', () => {
                    if (cloudinaryResponse.data && !cloudinaryResponse.data.destroyed) {
                        cloudinaryResponse.data.destroy();
                    }
                });

                return;
            } catch (error: any) {
                logger.error('Unexpected error downloading file from Cloudinary', { 
                    error: error.message,
                    stack: error.stack,
                    productId,
                    fileUrl: product.fileUrl
                });
                return next(new ErrorHandler("Failed to download file from Cloudinary", 500));
            }
        }

        // Fallback for local files (legacy support) - handle any file type
        const filePath = path.join(__dirname, '../../uploads/files', path.basename(product.fileUrl));
        
        if (fs.existsSync(filePath)) {
            // Get file stats
            const stats = fs.statSync(filePath);
            const originalFileName = path.basename(product.fileUrl);
            
            // Extract extension from original filename or use detected extension
            const originalExt = path.extname(originalFileName).toLowerCase().replace('.', '') || fileExtension;
            const finalExtension = originalExt || 'bin';
            const finalFileName = `${safeFileName}.${finalExtension}`;
            
            // Detect content type from extension (comprehensive MIME type mapping)
            const mimeTypes: Record<string, string> = {
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'zip': 'application/zip',
                'rar': 'application/x-rar-compressed',
                '7z': 'application/x-7z-compressed',
                'tar': 'application/x-tar',
                'gz': 'application/gzip',
                'html': 'text/html',
                'css': 'text/css',
                'js': 'application/javascript',
                'json': 'application/json',
                'xml': 'application/xml',
                'txt': 'text/plain',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'webp': 'image/webp',
                'mp3': 'audio/mpeg',
                'wav': 'audio/wav',
                'ogg': 'audio/ogg',
                'mp4': 'video/mp4',
                'webm': 'video/webm',
                'avi': 'video/x-msvideo',
                'ttf': 'font/ttf',
                'otf': 'font/otf',
                'woff': 'font/woff',
                'woff2': 'font/woff2',
            };
            
            const contentType = mimeTypes[finalExtension] || 'application/octet-stream';
            const encodedFileName = encodeURIComponent(finalFileName);
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${finalFileName.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedFileName}`);
            res.setHeader('Content-Length', stats.size.toString());
            
        const fileStream = fs.createReadStream(filePath);
            
            fileStream.on('error', (error: any) => {
                logger.error('Error streaming local file', { error: error.message, filePath });
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: "Error downloading file" });
                } else {
                    res.end();
                }
            });
            
        fileStream.pipe(res);
        } else {
            return next(new ErrorHandler("File not found on server", 404));
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get product preview file (Public - for preview only)
export const getProductPreview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        // Get product
        const product = await MarketplaceProductModel.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check if product is approved and active
        if (!product.isApproved || !product.isActive) {
            return next(new ErrorHandler("Product not available", 404));
        }

        // Check if preview file exists
        if (!product.previewUrl) {
            return next(new ErrorHandler("Preview not available", 404));
        }

        // Construct preview file path
        const previewPath = path.join(__dirname, '../../uploads/files', path.basename(product.previewUrl));
        
        // Check if preview file exists on disk
        if (!fs.existsSync(previewPath)) {
            return next(new ErrorHandler("Preview file not found on server", 404));
        }

        // Set appropriate headers for preview
        res.setHeader('Content-Type', 'application/pdf'); // Assuming preview is PDF
        res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');

        // Stream the preview file
        const fileStream = fs.createReadStream(previewPath);
        fileStream.pipe(res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
