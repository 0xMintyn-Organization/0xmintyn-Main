import { Request, Response, NextFunction } from "express";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";
import { uploadProductImage, uploadProductFile, extractPublicIdFromUrl, deleteFromCloudinary, deleteMultipleFromCloudinary } from "../../utils/cloudinary";
import logger from "../../utils/logger";
import { getSellerProfile, autoCreateSellerProfile } from "../../utils/sellerProfileHelper";

// Create Marketplace Product
export const createMarketplaceProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.operation('createMarketplaceProduct', {
            userId: req.user?._id,
            bodyKeys: Object.keys(req.body),
            hasFiles: !!req.files,
            filesCount: Array.isArray(req.files) ? req.files.length : (req.files ? 1 : 0)
        });
        
        const userId = req.user?._id;
        
        // Check if user exists and is a seller
        const user = await UserModel.findById(userId);
        if (!user) {
            logger.warn('User not found for product creation', { userId });
            return next(new ErrorHandler("User not found", 404));
        }

        logger.debug('User found for product creation', { 
            userId: user._id, 
            isSeller: user.isSeller, 
            role: user.role 
        });

        // Check if user is seller or admin
        if (!user.isSeller && user.role !== 'admin') {
            logger.warn('Unauthorized product creation attempt', { 
                userId: user._id, 
                isSeller: user.isSeller, 
                role: user.role 
            });
            return next(new ErrorHandler("Only sellers and admins can create products", 403));
        }

        // Get or verify seller profile using helper function
        let seller = await getSellerProfile(userId);
        
        logger.debug('Seller profile check for product creation', { 
            userId, 
            sellerFound: !!seller,
            userIsSeller: user.isSeller,
            userRole: user.role,
            sellerId: seller?._id 
        });
        
        // If user has isSeller flag but no profile, auto-create a minimal profile
        if (!seller && user.isSeller && user.role !== 'admin') {
            seller = await autoCreateSellerProfile(userId, user);
            
            if (!seller) {
                logger.warn('Failed to auto-create seller profile for product creation', { userId });
                // Allow product creation to continue (for backward compatibility)
                // But log the issue
            }
        }

        // Calculate discount if originalPrice is provided
        let discount = 0;
        if (req.body.originalPrice && req.body.originalPrice > req.body.price) {
            discount = Math.round(((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100);
        }

        // Parse JSON fields from form data
        const parseJsonField = (field: any) => {
            if (typeof field === 'string') {
                try {
                    return JSON.parse(field);
                } catch {
                    return field;
                }
            }
            return field;
        };

        // Handle uploaded images - upload to Cloudinary
        const uploadedImages = req.files as Express.Multer.File[];
        logger.debug('Processing uploaded images', {
            imageCount: uploadedImages?.length || 0,
            imageFiles: uploadedImages?.map(img => ({ originalname: img.originalname, size: img.size }))
        });
        
        // Upload all images to Cloudinary
        const imageUploadPromises = uploadedImages.map(file => 
            uploadProductImage(file.buffer, undefined)
        );
        const imageUrls = await Promise.all(imageUploadPromises);
        
        logger.debug('Generated Cloudinary image URLs', { imageUrls, count: imageUrls.length });
        
        // Prepare product data
        const productData = {
            ...req.body,
            // Parse JSON fields
            tags: parseJsonField(req.body.tags),
            features: parseJsonField(req.body.features),
            whatIncluded: parseJsonField(req.body.whatIncluded),
            requirements: parseJsonField(req.body.requirements),
            specifications: parseJsonField(req.body.specifications),
            digitalDelivery: parseJsonField(req.body.digitalDelivery),
            updates: parseJsonField(req.body.updates),
            support: parseJsonField(req.body.support),
            // Image handling - use Cloudinary URLs
            images: imageUrls.length > 0 ? imageUrls : [],
            thumbnailImage: imageUrls[0] || req.body.thumbnailImage || '',
            // Other fields
            sellerId: seller?._id || userId,
            discount,
            approvalStatus: 'Approved',
            isApproved: true,
            isActive: true
        };

        logger.debug('Creating product with data', {
            title: productData.title,
            price: productData.price,
            category: productData.category,
            sellerId: productData.sellerId,
            imageCount: productData.images.length
        });

        const product = await MarketplaceProductModel.create(productData);

        logger.operation('productCreated', {
            productId: product._id,
            title: product.title,
            sellerId: product.sellerId,
            price: product.price
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get Single Marketplace Product by ID (Public)
export const getMarketplaceProductById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const userId = req.user?._id;

        const product = await MarketplaceProductModel.findById(productId)
            .populate('sellerId', 'sellerName storeName storeLogo contactEmail rating reviewCount verified responseTime totalSales sellerLevel')
            .lean();

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check if user is the owner or admin
        let isOwner = false;
        if (userId) {
            const seller = await MarketplaceSellerModel.findOne({ _id: product.sellerId });
            isOwner = seller && seller.userId.toString() === userId.toString();
        }
        const isAdmin = req.user?.role === 'admin';

        // Check if product is approved and active (unless user is owner or admin)
        if (!isOwner && !isAdmin && (!product.isApproved || !product.isActive)) {
            return next(new ErrorHandler("Product not available", 404));
        }

        // Get related products (same category, excluding current product)
        const relatedProducts = await MarketplaceProductModel.find({
            category: product.category,
            _id: { $ne: productId },
            isApproved: true,
            isActive: true
        })
        .select('title price thumbnailImage rating reviewCount')
        .limit(4)
        .lean();

        // Check if user has purchased this product
        let isPurchased = false;
        if (userId) {
            const user = await UserModel.findById(userId).select('purchasedProducts');
            if (user && user.purchasedProducts) {
                isPurchased = user.purchasedProducts.some((p: any) => 
                    p.productId?.toString() === productId || p.toString() === productId
                );
            }
            
            // If not found in purchasedProducts, check orders directly
            // For digital products, allow if order exists and is not cancelled/refunded
            if (!isPurchased) {
                const order = await MarketplaceOrderModel.findOne({
                    buyerId: userId,
                    'items.itemId': productId,
                    'items.itemType': 'product',
                    orderStatus: { $nin: ['cancelled', 'refunded'] }, // Exclude cancelled/refunded
                    paymentStatus: { $nin: ['refunded', 'cancelled'] } // Exclude refunded/cancelled payments
                });
                isPurchased = !!order;
            }
        }

        // Remove sensitive fields from product response (unless purchased)
        const { fileUrl, previewUrl, ...safeProduct } = product;
        
        res.status(200).json({
            success: true,
            product: safeProduct,
            relatedProducts,
            isPurchased,
            downloadUrl: isPurchased ? `/marketplace/purchase/product/${productId}/file` : null
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get All Marketplace Products (Public + Filters)
export const getAllMarketplaceProducts = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            subcategory,
            minPrice,
            maxPrice,
            fileFormat,
            license,
            sortBy = 'createdAt',
            order = 'desc',
            search,
            featured,
            sellerId
        } = req.query;

        // Build filter object
        let filter: any = { isActive: true, isApproved: true };

        if (category) filter.category = category;
        if (subcategory) filter.subcategory = subcategory;
        if (fileFormat) filter.fileFormat = fileFormat;
        if (license) filter.license = license;
        if (featured === 'true') filter.isFeatured = true;
        if (sellerId) filter.sellerId = sellerId;

        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Search filter
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search as string, 'i')] } }
            ];
        }

        // Sort options
        const sortOptions: any = {};
        sortOptions[sortBy as string] = order === 'asc' ? 1 : -1;

        // Execute query with pagination
        const products = await MarketplaceProductModel.find(filter)
            .select('-fileUrl -previewUrl') // Exclude sensitive fields
            .populate('sellerId', 'sellerName storeName rating reviewCount verified')
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await MarketplaceProductModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            products,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
                limit: Number(limit)
            }
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


// Get Seller's Products (Protected - Seller/Admin only)
export const getSellerProducts = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 10, status = 'all' } = req.query;

        // Get seller profile
        const seller = await MarketplaceSellerModel.findOne({ userId });
        if (!seller) {
            return next(new ErrorHandler("Seller profile not found", 404));
        }

        // Build filter
        let filter: any = { sellerId: seller._id };

        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        } else if (status === 'pending') {
            filter.approvalStatus = 'Pending';
        } else if (status === 'approved') {
            filter.approvalStatus = 'Approved';
        } else if (status === 'rejected') {
            filter.approvalStatus = 'Rejected';
        }

        const products = await MarketplaceProductModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await MarketplaceProductModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            products,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total
            }
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Update Marketplace Product (Seller/Admin only)
export const updateMarketplaceProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { productId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get product
        const product = await MarketplaceProductModel.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check ownership (seller can only update their own products, admin can update all)
        if (user.role !== 'admin') {
            const seller = await MarketplaceSellerModel.findOne({ userId });
            if (!seller || product.sellerId.toString() !== seller._id.toString()) {
                return next(new ErrorHandler("You don't have permission to update this product", 403));
            }
        }

        // Calculate discount if originalPrice is updated
        if (req.body.originalPrice && req.body.price) {
            req.body.discount = Math.round(((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100);
        }

        // If product is updated by seller, reset approval status to pending
        if (user.role !== 'admin') {
            req.body.approvalStatus = 'Pending';
            req.body.isApproved = false;
        }

        // For updates, only validate fields that are being changed
        const updateData = { ...req.body };
        
        // If fileUrl is empty or not provided, don't include it in the update
        if (!updateData.fileUrl || updateData.fileUrl.trim() === '') {
            delete updateData.fileUrl;
        }

        const updatedProduct = await MarketplaceProductModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Delete Marketplace Product (Seller/Admin only)
export const deleteMarketplaceProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { productId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get product
        const product = await MarketplaceProductModel.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check ownership
        if (user.role !== 'admin') {
            const seller = await MarketplaceSellerModel.findOne({ userId });
            if (!seller || product.sellerId.toString() !== seller._id.toString()) {
                return next(new ErrorHandler("You don't have permission to delete this product", 403));
            }
        }

        // Delete files from Cloudinary
        const publicIdsToDelete: string[] = [];
        
        // Delete product images
        if (product.images && product.images.length > 0) {
            product.images.forEach((imageUrl: string) => {
                const publicId = extractPublicIdFromUrl(imageUrl);
                if (publicId) publicIdsToDelete.push(publicId);
            });
        }
        
        // Delete thumbnail
        if (product.thumbnailImage) {
            const publicId = extractPublicIdFromUrl(product.thumbnailImage);
            if (publicId) publicIdsToDelete.push(publicId);
        }
        
        // Delete product file
        if (product.fileUrl) {
            const publicId = extractPublicIdFromUrl(product.fileUrl);
            if (publicId) publicIdsToDelete.push(publicId);
        }
        
        // Delete preview file
        if (product.previewUrl) {
            const publicId = extractPublicIdFromUrl(product.previewUrl);
            if (publicId) publicIdsToDelete.push(publicId);
        }
        
        // Bulk delete from Cloudinary
        if (publicIdsToDelete.length > 0) {
            try {
                await deleteMultipleFromCloudinary(publicIdsToDelete, 'image');
                logger.info('Deleted product files from Cloudinary', { 
                    productId, 
                    count: publicIdsToDelete.length 
                });
            } catch (error) {
                logger.warn('Failed to delete some product files from Cloudinary', { 
                    productId, 
                    error: (error as Error).message 
                });
            }
        }

        await MarketplaceProductModel.findByIdAndDelete(productId);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Toggle Product Active Status (Seller/Admin only)
export const toggleMarketplaceProductStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { productId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get product
        const product = await MarketplaceProductModel.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check ownership
        if (user.role !== 'admin') {
            const seller = await MarketplaceSellerModel.findOne({ userId });
            if (!seller || product.sellerId.toString() !== seller._id.toString()) {
                return next(new ErrorHandler("You don't have permission to update this product", 403));
            }
        }

        product.isActive = !product.isActive;
        await product.save();

        res.status(200).json({
            success: true,
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: product.isActive
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Approve/Reject Product (Admin only)
export const approveMarketplaceProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const { approvalStatus, rejectionReason } = req.body;

        if (!['Approved', 'Rejected'].includes(approvalStatus)) {
            return next(new ErrorHandler("Invalid approval status", 400));
        }

        const product = await MarketplaceProductModel.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        product.approvalStatus = approvalStatus;
        product.isApproved = approvalStatus === 'Approved';
        
        if (approvalStatus === 'Rejected' && rejectionReason) {
            product.rejectionReason = rejectionReason;
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: `Product ${approvalStatus.toLowerCase()} successfully`,
            product
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
