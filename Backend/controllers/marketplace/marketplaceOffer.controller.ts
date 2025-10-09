import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceOfferModel } from "../../models/marketplace/MarketplaceOffer.model";
import { MarketplaceMessageModel } from "../../models/marketplace/MarketplaceMessage.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import ErrorHandler from "../../utils/errorHandler";

// Create custom offer (Seller only - service/product owner)
export const createCustomOffer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { 
            conversationId,
            buyerId, 
            serviceId, 
            productId,
            offerTitle, 
            offerDescription, 
            deliverables,
            price, 
            deliveryTime, 
            revisions,
            additionalTerms,
            expiresInDays = 3
        } = req.body;

        // Validation
        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        if (!conversationId || !buyerId) {
            return next(new ErrorHandler("Conversation ID and Buyer ID are required", 400));
        }

        if (!serviceId && !productId) {
            return next(new ErrorHandler("Service ID or Product ID is required", 400));
        }

        // Verify the user is the owner of the service/product
        let isOwner = false;
        
        if (serviceId) {
            const service = await MarketplaceServiceModel.findById(serviceId).populate('sellerId');
            if (!service) {
                return next(new ErrorHandler("Service not found", 404));
            }
            // Check if user is the service owner
            isOwner = service.sellerId.userId.toString() === userId.toString();
        }

        if (productId) {
            const product = await MarketplaceProductModel.findById(productId).populate('sellerId');
            if (!product) {
                return next(new ErrorHandler("Product not found", 404));
            }
            // Check if user is the product owner
            isOwner = product.sellerId.userId.toString() === userId.toString();
        }

        if (!isOwner) {
            return next(new ErrorHandler("Only the service/product owner can create offers", 403));
        }

        // Check if buyer and seller are not the same
        if (userId.toString() === buyerId.toString()) {
            return next(new ErrorHandler("Cannot create offer for yourself", 400));
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

        // Create offer
        const offer = await MarketplaceOfferModel.create({
            conversationId,
            sellerId: userId,
            buyerId,
            serviceId: serviceId || undefined,
            productId: productId || undefined,
            offerTitle,
            offerDescription,
            deliverables: Array.isArray(deliverables) ? deliverables : [deliverables],
            price,
            deliveryTime,
            revisions: revisions || 0,
            additionalTerms: additionalTerms || '',
            status: 'pending',
            expiresAt
        });

        const populatedOffer = await MarketplaceOfferModel.findById(offer._id)
            .populate('sellerId', 'firstName lastName email avatar username')
            .populate('buyerId', 'firstName lastName email avatar username')
            .populate('serviceId', 'title category thumbnailImage')
            .populate('productId', 'title category thumbnailImage');

        res.status(201).json({
            success: true,
            message: "Custom offer created successfully",
            offer: populatedOffer
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get offers for a conversation
export const getConversationOffers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { conversationId } = req.params;

        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        // Get all offers for this conversation where user is buyer or seller
        const offers = await MarketplaceOfferModel.find({
            conversationId,
            $or: [
                { sellerId: userId },
                { buyerId: userId }
            ]
        })
        .populate('sellerId', 'firstName lastName email avatar username')
        .populate('buyerId', 'firstName lastName email avatar username')
        .populate('serviceId', 'title category thumbnailImage')
        .populate('productId', 'title category thumbnailImage')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            offers
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Accept offer (Buyer only)
export const acceptOffer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { offerId } = req.params;

        const offer = await MarketplaceOfferModel.findById(offerId);
        
        if (!offer) {
            return next(new ErrorHandler("Offer not found", 404));
        }

        // Only buyer can accept
        if (offer.buyerId.toString() !== userId?.toString()) {
            return next(new ErrorHandler("Only the buyer can accept this offer", 403));
        }

        // Check if offer is still pending and not expired
        if (offer.status !== 'pending') {
            return next(new ErrorHandler("This offer is no longer available", 400));
        }

        if (new Date() > offer.expiresAt) {
            offer.status = 'expired';
            await offer.save();
            return next(new ErrorHandler("This offer has expired", 400));
        }

        // Accept the offer
        offer.status = 'accepted';
        offer.acceptedAt = new Date();
        await offer.save();

        // TODO: Create order/payment flow here

        const populatedOffer = await MarketplaceOfferModel.findById(offer._id)
            .populate('sellerId', 'firstName lastName email avatar username')
            .populate('buyerId', 'firstName lastName email avatar username')
            .populate('serviceId', 'title category')
            .populate('productId', 'title category');

        res.status(200).json({
            success: true,
            message: "Offer accepted successfully",
            offer: populatedOffer
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Reject offer (Buyer only)
export const rejectOffer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { offerId } = req.params;
        const { reason } = req.body;

        const offer = await MarketplaceOfferModel.findById(offerId);
        
        if (!offer) {
            return next(new ErrorHandler("Offer not found", 404));
        }

        // Only buyer can reject
        if (offer.buyerId.toString() !== userId?.toString()) {
            return next(new ErrorHandler("Only the buyer can reject this offer", 403));
        }

        // Check if offer is still pending
        if (offer.status !== 'pending') {
            return next(new ErrorHandler("This offer cannot be rejected", 400));
        }

        // Reject the offer
        offer.status = 'rejected';
        offer.rejectedAt = new Date();
        offer.rejectionReason = reason || '';
        await offer.save();

        res.status(200).json({
            success: true,
            message: "Offer rejected successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Cancel offer (Seller only - before acceptance)
export const cancelOffer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { offerId } = req.params;
        const { reason } = req.body;

        const offer = await MarketplaceOfferModel.findById(offerId);
        
        if (!offer) {
            return next(new ErrorHandler("Offer not found", 404));
        }

        // Only seller can cancel
        if (offer.sellerId.toString() !== userId?.toString()) {
            return next(new ErrorHandler("Only the seller can cancel this offer", 403));
        }

        // Check if offer is still pending
        if (offer.status !== 'pending') {
            return next(new ErrorHandler("This offer cannot be cancelled", 400));
        }

        // Cancel the offer
        offer.status = 'cancelled';
        offer.cancelledAt = new Date();
        offer.cancellationReason = reason || '';
        await offer.save();

        res.status(200).json({
            success: true,
            message: "Offer cancelled successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get user's sent offers (as seller)
export const getSentOffers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { status, page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = { sellerId: userId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const offers = await MarketplaceOfferModel.find(query)
            .populate('buyerId', 'firstName lastName email avatar username')
            .populate('serviceId', 'title category thumbnailImage')
            .populate('productId', 'title category thumbnailImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await MarketplaceOfferModel.countDocuments(query);

        res.status(200).json({
            success: true,
            offers,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            }
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get user's received offers (as buyer)
export const getReceivedOffers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { status, page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = { buyerId: userId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const offers = await MarketplaceOfferModel.find(query)
            .populate('sellerId', 'firstName lastName email avatar username')
            .populate('serviceId', 'title category thumbnailImage')
            .populate('productId', 'title category thumbnailImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await MarketplaceOfferModel.countDocuments(query);

        res.status(200).json({
            success: true,
            offers,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            }
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

