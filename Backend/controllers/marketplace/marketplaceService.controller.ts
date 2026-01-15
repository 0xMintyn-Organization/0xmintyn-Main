import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";
import { uploadServiceImage, extractPublicIdFromUrl, deleteMultipleFromCloudinary } from "../../utils/cloudinary";
import logger from "../../utils/logger";
import { getSellerProfile, autoCreateSellerProfile } from "../../utils/sellerProfileHelper";

// Create Marketplace Service
export const createMarketplaceService = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        
        // Check if user exists and is a seller
        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Check if user is seller or admin
        if (!user.isSeller && user.role !== 'admin') {
            return next(new ErrorHandler("Only sellers and admins can create services", 403));
        }

        // Get or verify seller profile using helper function
        let seller = await getSellerProfile(userId);
        
        // Log for debugging
        logger.debug('Seller profile check for service creation', {
            userId,
            userIdType: typeof userId,
            hasSellerProfile: !!seller,
            userIsSeller: user.isSeller,
            userRole: user.role,
            sellerId: seller?._id
        });
        
        // If user has isSeller flag but no profile, auto-create a minimal profile
        // This MUST happen before service creation as service requires sellerId
        if (!seller && user.isSeller && user.role !== 'admin') {
            logger.info('Auto-creating seller profile for service creation', { userId });
            seller = await autoCreateSellerProfile(userId, user);
            
            if (!seller) {
                logger.error('Failed to auto-create seller profile - retrying with force', { userId });
                // Retry once more with detailed error logging
                try {
                    seller = await autoCreateSellerProfile(userId, user);
                } catch (retryError: any) {
                    logger.error('Retry also failed', {
                        error: retryError.message,
                        stack: retryError.stack,
                        userId
                    });
                }
            }
        }
        
        // If still no seller profile and not admin, block creation
        // Service requires sellerId, so we can't proceed without it
        if (!seller && user.role !== 'admin') {
            logger.error('No seller profile found and auto-create failed', {
                userId,
                userIsSeller: user.isSeller,
                userRole: user.role
            });
            return next(new ErrorHandler(
                "Seller profile is required. Please complete your seller profile first or contact support if you have isSeller: true.",
                400
            ));
        }
        
        // Ensure we have a seller profile at this point
        if (!seller) {
            logger.error('Seller profile is null after all checks', { userId });
            return next(new ErrorHandler("Seller profile error. Please contact support.", 500));
        }

        // Validate packages
        if (!req.body.packages || req.body.packages.length === 0) {
            return next(new ErrorHandler("At least one package is required", 400));
        }

        // Set delivery time and revisions from first package if not provided
        const deliveryTime = req.body.deliveryTime || req.body.packages[0]?.deliveryTime || '3 Days';
        const revisions = req.body.revisions || `${req.body.packages[0]?.revisions || 2} Revisions`;

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
        logger.debug('Processing uploaded service images', {
            imageCount: uploadedImages?.length || 0
        });
        
        // Upload all images to Cloudinary
        const imageUploadPromises = uploadedImages.map(file => 
            uploadServiceImage(file.buffer, undefined)
        );
        const imageUrls = await Promise.all(imageUploadPromises);
        
        logger.debug('Generated Cloudinary service image URLs', { imageUrls, count: imageUrls.length });
        
        // Ensure we have at least one image for thumbnail
        if (imageUrls.length === 0) {
            console.log('No images uploaded');
            return next(new ErrorHandler("At least one image is required", 400));
        }

        // Prepare service data
        const serviceData = {
            ...req.body,
            sellerId: seller?._id || userId,
            thumbnailImage: imageUrls[0], // Use first uploaded image as thumbnail
            images: imageUrls, // Set all uploaded images
            deliveryTime,
            revisions,
            // Parse JSON fields
            whatYouGet: parseJsonField(req.body.whatYouGet),
            requirements: parseJsonField(req.body.requirements),
            faqs: parseJsonField(req.body.faqs),
            tags: parseJsonField(req.body.tags),
            packages: parseJsonField(req.body.packages),
            approvalStatus: 'Approved',
            isApproved: true,
            isActive: true
        };

        console.log('Service data to create:', {
            title: serviceData.title,
            category: serviceData.category,
            thumbnailImage: serviceData.thumbnailImage,
            images: serviceData.images,
            sellerId: serviceData.sellerId
        });

        const service = await MarketplaceServiceModel.create(serviceData);

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            service
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get All Marketplace Services (Public + Filters)
export const getAllMarketplaceServices = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            subcategory,
            minPrice,
            maxPrice,
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
        if (featured === 'true') filter.isFeatured = true;
        if (sellerId) filter.sellerId = sellerId;

        // Price range filter (check minimum package price)
        if (minPrice || maxPrice) {
            const priceFilter: any = {};
            if (minPrice) priceFilter.$gte = Number(minPrice);
            if (maxPrice) priceFilter.$lte = Number(maxPrice);
            filter['packages.price'] = priceFilter;
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
        const services = await MarketplaceServiceModel.find(filter)
            .populate('sellerId', 'sellerName storeName rating reviewCount verified responseTime totalSales sellerLevel')
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await MarketplaceServiceModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            services,
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

// Get Single Marketplace Service by ID
export const getMarketplaceServiceById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { serviceId } = req.params;
        const userId = req.user?._id;

        const service = await MarketplaceServiceModel.findById(serviceId)
            .select('title description category subcategory images thumbnailImage videoUrl packages whatYouGet requirements faqs tags deliveryTime revisions rating reviewCount orderCount inQueueCount viewCount favoriteCount responseTime isActive isFeatured isApproved approvalStatus rejectionReason createdAt updatedAt sellerId')
            .populate('sellerId', 'sellerName storeName storeLogo rating reviewCount verified responseTime totalSales sellerLevel description skills languages location joinDate')
            .lean();

        if (!service) {
            return next(new ErrorHandler("Service not found", 404));
        }

        // Check if user is the owner or admin
        let isOwner = false;
        if (userId) {
            const seller = await MarketplaceSellerModel.findOne({ _id: service.sellerId });
            isOwner = seller && seller.userId.toString() === userId.toString();
        }
        const isAdmin = req.user?.role === 'admin';

        // Check if service is approved and active (unless user is owner or admin)
        if (!isOwner && !isAdmin && (!service.isApproved || !service.isActive)) {
            return next(new ErrorHandler("Service not available", 404));
        }

        // Get related services (same seller, excluding current service)
        const relatedServices = await MarketplaceServiceModel.find({
            sellerId: service.sellerId,
            _id: { $ne: serviceId },
            isApproved: true,
            isActive: true
        })
        .select('title price thumbnailImage rating reviewCount deliveryTime')
        .limit(4)
        .lean();

        // Increment view count
        await MarketplaceServiceModel.findByIdAndUpdate(serviceId, {
            $inc: { viewCount: 1 }
        });

        res.status(200).json({
            success: true,
            service,
            relatedServices
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get Seller's Services (Protected - Seller/Admin only)
export const getSellerServices = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
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

        const services = await MarketplaceServiceModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await MarketplaceServiceModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            services,
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

// Update Marketplace Service (Seller/Admin only)
export const updateMarketplaceService = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { serviceId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get service
        const service = await MarketplaceServiceModel.findById(serviceId);
        if (!service) {
            return next(new ErrorHandler("Service not found", 404));
        }

        // Check ownership (seller can only update their own services, admin can update all)
        if (user.role !== 'admin') {
            const seller = await MarketplaceSellerModel.findOne({ userId });
            if (!seller || service.sellerId.toString() !== seller._id.toString()) {
                return next(new ErrorHandler("You don't have permission to update this service", 403));
            }
        }

        // If service is updated by seller, reset approval status to pending
        if (user.role !== 'admin') {
            req.body.approvalStatus = 'Pending';
            req.body.isApproved = false;
        }

        // For updates, only validate fields that are being changed
        const updateData = { ...req.body };
        
        // If images or thumbnailImage are empty, don't include them in the update
        if (!updateData.images || (Array.isArray(updateData.images) && updateData.images.length === 0)) {
            delete updateData.images;
        }
        if (!updateData.thumbnailImage || updateData.thumbnailImage.trim() === '') {
            delete updateData.thumbnailImage;
        }

        const updatedService = await MarketplaceServiceModel.findByIdAndUpdate(
            serviceId,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Service updated successfully",
            service: updatedService
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Delete Marketplace Service (Seller/Admin only)
export const deleteMarketplaceService = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { serviceId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get service
        const service = await MarketplaceServiceModel.findById(serviceId);
        if (!service) {
            return next(new ErrorHandler("Service not found", 404));
        }

        // Check ownership
        if (user.role !== 'admin') {
            const seller = await MarketplaceSellerModel.findOne({ userId });
            if (!seller || service.sellerId.toString() !== seller._id.toString()) {
                return next(new ErrorHandler("You don't have permission to delete this service", 403));
            }
        }

        // Delete files from Cloudinary
        const publicIdsToDelete: string[] = [];
        
        // Delete service images
        if (service.images && service.images.length > 0) {
            service.images.forEach((imageUrl: string) => {
                const publicId = extractPublicIdFromUrl(imageUrl);
                if (publicId) publicIdsToDelete.push(publicId);
            });
        }
        
        // Delete thumbnail
        if (service.thumbnailImage) {
            const publicId = extractPublicIdFromUrl(service.thumbnailImage);
            if (publicId) publicIdsToDelete.push(publicId);
        }
        
        // Bulk delete from Cloudinary
        if (publicIdsToDelete.length > 0) {
            try {
                await deleteMultipleFromCloudinary(publicIdsToDelete, 'image');
                logger.info('Deleted service files from Cloudinary', { 
                    serviceId, 
                    count: publicIdsToDelete.length 
                });
            } catch (error) {
                logger.warn('Failed to delete some service files from Cloudinary', { 
                    serviceId, 
                    error: (error as Error).message 
                });
            }
        }

        await MarketplaceServiceModel.findByIdAndDelete(serviceId);

        res.status(200).json({
            success: true,
            message: "Service deleted successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Toggle Service Active Status (Seller/Admin only)
export const toggleMarketplaceServiceStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { serviceId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get service
        const service = await MarketplaceServiceModel.findById(serviceId);
        if (!service) {
            return next(new ErrorHandler("Service not found", 404));
        }

        // Check ownership
        if (user.role !== 'admin') {
            const seller = await MarketplaceSellerModel.findOne({ userId });
            if (!seller || service.sellerId.toString() !== seller._id.toString()) {
                return next(new ErrorHandler("You don't have permission to update this service", 403));
            }
        }

        service.isActive = !service.isActive;
        await service.save();

        res.status(200).json({
            success: true,
            message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: service.isActive
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Approve/Reject Service (Admin only)
export const approveMarketplaceService = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { serviceId } = req.params;
        const { approvalStatus, rejectionReason } = req.body;

        if (!['Approved', 'Rejected'].includes(approvalStatus)) {
            return next(new ErrorHandler("Invalid approval status", 400));
        }

        const service = await MarketplaceServiceModel.findById(serviceId);
        if (!service) {
            return next(new ErrorHandler("Service not found", 404));
        }

        service.approvalStatus = approvalStatus;
        service.isApproved = approvalStatus === 'Approved';
        
        if (approvalStatus === 'Rejected' && rejectionReason) {
            service.rejectionReason = rejectionReason;
        }

        await service.save();

        res.status(200).json({
            success: true,
            message: `Service ${approvalStatus.toLowerCase()} successfully`,
            service
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
