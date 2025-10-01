import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";

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

        // Get or verify seller profile
        const seller = await MarketplaceSellerModel.findOne({ userId });
        if (!seller && user.role !== 'admin') {
            return next(new ErrorHandler("Please complete your seller profile first", 400));
        }

        // Validate packages
        if (!req.body.packages || req.body.packages.length === 0) {
            return next(new ErrorHandler("At least one package is required", 400));
        }

        // Set delivery time and revisions from first package if not provided
        const deliveryTime = req.body.deliveryTime || req.body.packages[0]?.deliveryTime || '3 Days';
        const revisions = req.body.revisions || `${req.body.packages[0]?.revisions || 2} Revisions`;

        // Prepare service data
        const serviceData = {
            ...req.body,
            sellerId: seller?._id || userId,
            thumbnailImage: req.body.images?.[0] || req.body.thumbnailImage,
            deliveryTime,
            revisions,
            approvalStatus: user.role === 'admin' ? 'Approved' : 'Pending',
            isApproved: user.role === 'admin' ? true : false
        };

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

        const service = await MarketplaceServiceModel.findById(serviceId)
            .populate('sellerId', 'sellerName storeName storeLogo rating reviewCount verified responseTime totalSales sellerLevel');

        if (!service) {
            return next(new ErrorHandler("Service not found", 404));
        }

        // Increment view count
        await MarketplaceServiceModel.findByIdAndUpdate(serviceId, {
            $inc: { viewCount: 1 }
        });

        res.status(200).json({
            success: true,
            service
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

        const updatedService = await MarketplaceServiceModel.findByIdAndUpdate(
            serviceId,
            req.body,
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
