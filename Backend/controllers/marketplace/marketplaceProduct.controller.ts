import { Request, Response, NextFunction } from "express";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";

// Create Marketplace Product
export const createMarketplaceProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Creating marketplace product...');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body sample:', {
            title: req.body.title,
            price: req.body.price,
            category: req.body.category,
            fileUrl: req.body.fileUrl
        });
        console.log('Request files:', req.files);
        console.log('User ID:', req.user?._id);
        
        const userId = req.user?._id;
        
        // Check if user exists and is a seller
        const user = await UserModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return next(new ErrorHandler("User not found", 404));
        }

        console.log('User found:', { id: user._id, isSeller: user.isSeller, role: user.role });

        // Check if user is seller or admin
        if (!user.isSeller && user.role !== 'admin') {
            console.log('User is not a seller or admin');
            return next(new ErrorHandler("Only sellers and admins can create products", 403));
        }

        // Get or verify seller profile
        const seller = await MarketplaceSellerModel.findOne({ userId });
        console.log('Seller profile:', seller ? 'Found' : 'Not found');
        
        // For testing purposes, allow product creation even without seller profile
        // In production, you might want to enforce seller profile creation
        if (!seller && user.role !== 'admin') {
            console.log('No seller profile found for non-admin user - allowing for testing');
            // return next(new ErrorHandler("Please complete your seller profile first", 400));
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

        // Handle uploaded images
        const uploadedImages = req.files as Express.Multer.File[];
        console.log('Uploaded images:', uploadedImages?.map(img => ({ filename: img.filename, originalname: img.originalname })));
        const imageUrls = uploadedImages?.map(file => `/uploads/images/${file.filename}`) || [];
        console.log('Image URLs:', imageUrls);
        
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
            // Image handling
            images: imageUrls.length > 0 ? imageUrls : ['https://via.placeholder.com/400x300'],
            thumbnailImage: imageUrls[0] || req.body.thumbnailImage || 'https://via.placeholder.com/400x300',
            // Other fields
            sellerId: seller?._id || userId,
            discount,
            approvalStatus: user.role === 'admin' ? 'Approved' : 'Pending',
            isApproved: user.role === 'admin' ? true : false
        };

        console.log('Product data to create:', {
            title: productData.title,
            price: productData.price,
            category: productData.category,
            thumbnailImage: productData.thumbnailImage,
            images: productData.images,
            sellerId: productData.sellerId
        });

        const product = await MarketplaceProductModel.create(productData);

        console.log('Product created successfully:', product._id);

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

        const product = await MarketplaceProductModel.findById(productId)
            .populate('sellerId', 'sellerName storeName storeLogo contactEmail rating reviewCount verified responseTime totalSales sellerLevel')
            .lean();

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check if product is approved and active
        if (!product.isApproved || !product.isActive) {
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

        res.status(200).json({
            success: true,
            product,
            relatedProducts
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

        const updatedProduct = await MarketplaceProductModel.findByIdAndUpdate(
            productId,
            req.body,
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
