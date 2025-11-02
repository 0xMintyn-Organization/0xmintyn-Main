import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";
import path from "path";
import fs from "fs";

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

        // Construct file path
        const filePath = path.join(__dirname, '../../uploads/files', path.basename(product.fileUrl));
        
        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            return next(new ErrorHandler("File not found on server", 404));
        }

        // Sanitize filename for HTTP headers (remove special characters, limit length)
        const sanitizeFileName = (filename: string) => {
            if (!filename) return 'download';
            // Remove or replace special characters that are not safe for HTTP headers
            return filename
                .replace(/["\n\r\t]/g, '_') // Replace quotes, newlines, tabs
                .replace(/[^\w\s.-]/g, '_') // Replace other special chars with underscore
                .replace(/\s+/g, '_') // Replace spaces with underscore
                .trim()
                .substring(0, 200); // Limit length
        };

        const safeFileName = sanitizeFileName(product.title);
        const fileExtension = product.fileFormat?.toLowerCase() || 'zip';
        const fileName = `${safeFileName}.${fileExtension}`;

        // Set appropriate headers for file download
        // Escape quotes and use simple filename format
        const escapedFileName = fileName.replace(/"/g, '\\"');
        res.setHeader('Content-Disposition', `attachment; filename="${escapedFileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

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
