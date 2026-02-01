require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ConversationModel from '../models/conversation.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** GET /messenger/conversations – list my conversations (participant is current user), sorted by lastMessageAt */
export const listMyConversations = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as { _id: string })._id;
  const conversations = await ConversationModel.find({ participants: userId })
    .populate('participants', 'firstName lastName email startupName avatar')
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  const withOther = conversations.map((c) => {
    const participants = c.participants as unknown as { _id: string; firstName?: string; lastName?: string; email?: string; startupName?: string; avatar?: string }[];
    const other = participants.find((p) => String(p._id) !== String(userId));
    return {
      _id: c._id,
      otherUser: other
        ? {
            _id: other._id,
            firstName: other.firstName,
            lastName: other.lastName,
            email: other.email,
            startupName: other.startupName,
            avatar: other.avatar,
          }
        : null,
      lastMessageAt: c.lastMessageAt,
      lastMessageText: c.lastMessageText,
      updatedAt: c.updatedAt,
    };
  });

  res.status(200).json({ success: true, conversations: withOther });
});

/** POST /messenger/conversations – get or create conversation with another user (body: otherUserId) */
export const getOrCreateConversation = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const currentUserId = (req.user as { _id: string })._id;
  const { otherUserId } = req.body as { otherUserId?: string };
  if (!otherUserId) return next(new ErrorHandler('otherUserId is required', 400));
  if (String(otherUserId) === String(currentUserId)) return next(new ErrorHandler('Cannot chat with yourself', 400));

  const other = await UserModel.findById(otherUserId).select('marketplace_role').lean();
  if (!other) return next(new ErrorHandler('User not found', 404));
  const current = await UserModel.findById(currentUserId).select('marketplace_role').lean();
  if (!current) return next(new ErrorHandler('User not found', 404));
  const roles = [current.marketplace_role, (other as { marketplace_role?: string }).marketplace_role].filter(Boolean);
  if (!roles.includes('startup') || !roles.includes('contributor')) {
    return next(new ErrorHandler('Messaging is only between marketplace startups and contributors', 403));
  }

  const ids = [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(otherUserId)].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );
  let conversation = await ConversationModel.findOne({ participants: { $all: ids } })
    .populate('participants', 'firstName lastName email startupName avatar')
    .lean();
  if (!conversation) {
    const created = await ConversationModel.create({
      participants: ids,
      lastMessageAt: null,
      lastMessageText: '',
    });
    conversation = await ConversationModel.findById(created._id)
      .populate('participants', 'firstName lastName email startupName avatar')
      .lean();
  }

  const participants = conversation!.participants as unknown as { _id: string; firstName?: string; lastName?: string; email?: string; startupName?: string; avatar?: string }[];
  const otherUser = participants.find((p) => String(p._id) !== String(currentUserId));
  res.status(200).json({
    success: true,
    conversation: {
      _id: conversation!._id,
      otherUser: otherUser ?? null,
      lastMessageAt: conversation!.lastMessageAt,
      lastMessageText: conversation!.lastMessageText,
      updatedAt: conversation!.updatedAt,
    },
  });
});
