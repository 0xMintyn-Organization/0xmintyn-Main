import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
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

        // TODO: Implement purchase verification
        // For now, we'll check if user is the seller or admin
        if (product.sellerId.toString() !== userId.toString() && user.role !== 'admin') {
            return next(new ErrorHandler("You must purchase this product to access the file", 403));
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

        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${product.title}.${product.fileFormat?.toLowerCase() || 'zip'}"`);
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
