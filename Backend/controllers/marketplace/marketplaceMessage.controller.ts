import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { MarketplaceMessageModel } from "../../models/marketplace/MarketplaceMessage.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import ErrorHandler from "../../utils/errorHandler";
import UserModel from "../../models/user.mode";

// Send message to seller
export const sendMessageToSeller = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { sellerId, receiverId: directReceiverId, subject, message, serviceId, productId } = req.body;

        // Validation
        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        if (!subject || !message) {
            return next(new ErrorHandler("Subject and message are required", 400));
        }

        let receiverId;

        // If sellerId is provided, get the user ID from seller
        if (sellerId) {
            const seller = await MarketplaceSellerModel.findById(sellerId);
            if (!seller) {
                return next(new ErrorHandler("Seller not found", 404));
            }
            receiverId = seller.userId;
        } else if (directReceiverId) {
            // Direct receiver ID provided (for replies)
            receiverId = directReceiverId;
        } else {
            return next(new ErrorHandler("Receiver ID or Seller ID is required", 400));
        }

        // Check if user is trying to message themselves
        if (userId.toString() === receiverId.toString()) {
            return next(new ErrorHandler("You cannot send messages to yourself", 400));
        }

        // Verify service or product if provided
        if (serviceId) {
            const service = await MarketplaceServiceModel.findById(serviceId);
            if (!service) {
                return next(new ErrorHandler("Service not found", 404));
            }
        }

        if (productId) {
            const product = await MarketplaceProductModel.findById(productId);
            if (!product) {
                return next(new ErrorHandler("Product not found", 404));
            }
        }

        // Handle file attachments
        const attachments: any[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadedFiles = req.files as Express.Multer.File[];
            uploadedFiles.forEach(file => {
                attachments.push({
                    filename: file.filename,
                    originalName: file.originalname,
                    fileUrl: `/uploads/files/${file.filename}`,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    uploadedAt: new Date()
                });
            });
        }

        // Create message
        const newMessage = await MarketplaceMessageModel.create({
            senderId: userId,
            receiverId,
            serviceId: serviceId || undefined,
            productId: productId || undefined,
            subject: subject.trim(),
            message: message.trim(),
            attachments,
            isRead: false,
            senderDeleted: false,
            receiverDeleted: false
        });

        // Populate sender and receiver info
        const populatedMessage = await MarketplaceMessageModel.findById(newMessage._id)
            .populate('senderId', 'firstName lastName email avatar username')
            .populate('receiverId', 'firstName lastName email avatar username')
            .populate('serviceId', 'title')
            .populate('productId', 'title');

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: populatedMessage
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get user's sent messages
export const getSentMessages = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const messages = await MarketplaceMessageModel.find({
            senderId: userId,
            senderDeleted: false
        })
        .populate('receiverId', 'firstName lastName email avatar username')
        .populate('serviceId', 'title thumbnailImage')
        .populate('productId', 'title thumbnailImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

        const total = await MarketplaceMessageModel.countDocuments({
            senderId: userId,
            senderDeleted: false
        });

        res.status(200).json({
            success: true,
            messages,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total,
                limit: limitNum
            }
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get user's received messages (inbox)
export const getReceivedMessages = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {
            receiverId: userId,
            receiverDeleted: false
        };

        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const messages = await MarketplaceMessageModel.find(query)
        .populate('senderId', 'firstName lastName email avatar username')
        .populate('serviceId', 'title thumbnailImage')
        .populate('productId', 'title thumbnailImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

        const total = await MarketplaceMessageModel.countDocuments(query);
        const unreadCount = await MarketplaceMessageModel.countDocuments({
            receiverId: userId,
            receiverDeleted: false,
            isRead: false
        });

        res.status(200).json({
            success: true,
            messages,
            unreadCount,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total,
                limit: limitNum
            }
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Mark message as read
export const markMessageAsRead = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { messageId } = req.params;

        const message = await MarketplaceMessageModel.findById(messageId);

        if (!message) {
            return next(new ErrorHandler("Message not found", 404));
        }

        // Only receiver can mark message as read
        if (message.receiverId.toString() !== userId?.toString()) {
            return next(new ErrorHandler("You don't have permission to mark this message as read", 403));
        }

        if (!message.isRead) {
            message.isRead = true;
            message.readAt = new Date();
            await message.save();
        }

        res.status(200).json({
            success: true,
            message: "Message marked as read"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Delete message (soft delete)
export const deleteMessage = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { messageId } = req.params;

        const message = await MarketplaceMessageModel.findById(messageId);

        if (!message) {
            return next(new ErrorHandler("Message not found", 404));
        }

        // Mark as deleted for the appropriate user
        if (message.senderId.toString() === userId?.toString()) {
            message.senderDeleted = true;
        } else if (message.receiverId.toString() === userId?.toString()) {
            message.receiverDeleted = true;
        } else {
            return next(new ErrorHandler("You don't have permission to delete this message", 403));
        }

        await message.save();

        // If both users deleted, permanently delete the message
        if (message.senderDeleted && message.receiverDeleted) {
            await MarketplaceMessageModel.findByIdAndDelete(messageId);
        }

        res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get unread message count
export const getUnreadCount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        const unreadCount = await MarketplaceMessageModel.countDocuments({
            receiverId: userId,
            receiverDeleted: false,
            isRead: false
        });

        res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

