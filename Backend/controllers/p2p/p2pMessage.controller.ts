import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorHandler';
import P2PMessageModel from '../../models/p2p/p2pMessage.model';
import P2PTradeModel from '../../models/p2p/p2pTrade.model';
import { logger } from '../../utils/logger';
import DOMPurify from 'isomorphic-dompurify';

// Save message to database
export const saveMessage = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { orderId, message, attachments } = req.body;

      // Validation
      if (!orderId || !message) {
        return next(new ErrorHandler('Order ID and message are required', 400));
      }

      // Validate message length
      const trimmedMessage = message.trim();
      if (trimmedMessage.length === 0) {
        return next(new ErrorHandler('Message cannot be empty', 400));
      }

      if (trimmedMessage.length > 1000) {
        return next(new ErrorHandler('Message cannot exceed 1000 characters', 400));
      }

      // Verify user is part of this trade
      const trade = await P2PTradeModel.findById(orderId);
      if (!trade) {
        return next(new ErrorHandler('Trade not found', 404));
      }

      const buyerId = trade.buyerId?._id ? String(trade.buyerId._id) : String(trade.buyerId);
      const sellerId = trade.sellerId?._id ? String(trade.sellerId._id) : String(trade.sellerId);
      const currentUserId = String(userId);

      if (buyerId !== currentUserId && sellerId !== currentUserId) {
        return next(new ErrorHandler('Unauthorized: You are not part of this trade', 403));
      }

      // Sanitize message to prevent XSS attacks
      const sanitizedMessage = DOMPurify.sanitize(trimmedMessage, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
      });

      // Validate attachments if provided
      if (attachments && Array.isArray(attachments)) {
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const maxFiles = 5;
        
        if (attachments.length > maxFiles) {
          return next(new ErrorHandler(`Maximum ${maxFiles} attachments allowed`, 400));
        }

        for (const attachment of attachments) {
          if (attachment.fileSize > maxFileSize) {
            return next(new ErrorHandler(`File size cannot exceed 10MB`, 400));
          }
        }
      }

      // Create and save message
      const savedMessage = await P2PMessageModel.create({
        orderId: trade._id,
        senderId: userId,
        message: sanitizedMessage,
        attachments: attachments || [],
        isRead: false,
      });

      // Populate sender info
      await savedMessage.populate('senderId', 'firstName lastName username email avatar');

      res.status(201).json({
        success: true,
        message: 'Message saved successfully',
        data: {
          id: savedMessage._id.toString(),
          orderId: savedMessage.orderId.toString(),
          senderId: savedMessage.senderId,
          message: savedMessage.message,
          attachments: savedMessage.attachments,
          isRead: savedMessage.isRead,
          createdAt: savedMessage.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('Error saving message:', error);
      return next(new ErrorHandler(error.message || 'Failed to save message', 500));
    }
  }
);

// Get messages for an order
export const getOrderMessages = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { orderId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify user is part of this trade
      const trade = await P2PTradeModel.findById(orderId);
      if (!trade) {
        return next(new ErrorHandler('Trade not found', 404));
      }

      const buyerId = trade.buyerId?._id ? String(trade.buyerId._id) : String(trade.buyerId);
      const sellerId = trade.sellerId?._id ? String(trade.sellerId._id) : String(trade.sellerId);
      const currentUserId = String(userId);

      if (buyerId !== currentUserId && sellerId !== currentUserId) {
        return next(new ErrorHandler('Unauthorized: You are not part of this trade', 403));
      }

      // Fetch messages with pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per page
      const skip = (pageNum - 1) * limitNum;

      const messages = await P2PMessageModel.find({ orderId: trade._id })
        .populate('senderId', 'firstName lastName username email avatar')
        .sort({ createdAt: -1 }) // Most recent first
        .limit(limitNum)
        .skip(skip);

      const total = await P2PMessageModel.countDocuments({ orderId: trade._id });

      // Mark messages as read if they're not from current user
      const unreadMessageIds = messages
        .filter((msg) => {
          const senderId = msg.senderId?._id ? String(msg.senderId._id) : String(msg.senderId);
          return senderId !== currentUserId && !msg.isRead;
        })
        .map((msg) => msg._id);

      if (unreadMessageIds.length > 0) {
        await P2PMessageModel.updateMany(
          { _id: { $in: unreadMessageIds } },
          { isRead: true, readAt: new Date() }
        );
      }

      res.status(200).json({
        success: true,
        data: {
          messages: messages.reverse().map((msg) => ({
            id: msg._id.toString(),
            orderId: msg.orderId.toString(),
            senderUserId: msg.senderId?._id ? String(msg.senderId._id) : String(msg.senderId),
            message: msg.message,
            attachments: msg.attachments || [],
            isRead: msg.isRead,
            createdAt: msg.createdAt.toISOString(),
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching messages:', error);
      return next(new ErrorHandler(error.message || 'Failed to fetch messages', 500));
    }
  }
);

// Mark messages as read
export const markMessagesAsRead = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { orderId } = req.params;

      // Verify user is part of this trade
      const trade = await P2PTradeModel.findById(orderId);
      if (!trade) {
        return next(new ErrorHandler('Trade not found', 404));
      }

      const buyerId = trade.buyerId?._id ? String(trade.buyerId._id) : String(trade.buyerId);
      const sellerId = trade.sellerId?._id ? String(trade.sellerId._id) : String(trade.sellerId);
      const currentUserId = String(userId);

      if (buyerId !== currentUserId && sellerId !== currentUserId) {
        return next(new ErrorHandler('Unauthorized: You are not part of this trade', 403));
      }

      // Mark all unread messages (not from current user) as read
      await P2PMessageModel.updateMany(
        {
          orderId: trade._id,
          senderId: { $ne: userId },
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error: any) {
      logger.error('Error marking messages as read:', error);
      return next(new ErrorHandler(error.message || 'Failed to mark messages as read', 500));
    }
  }
);

