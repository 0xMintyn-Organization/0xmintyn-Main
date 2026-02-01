require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ConversationModel from '../models/conversation.model';
import MessageModel from '../models/message.model';
import ErrorHandler from '../utils/errorHandler';

function isParticipant(conversation: { participants: unknown[] }, userId: string): boolean {
  return conversation.participants.some((p) => String(p) === String(userId));
}

/** GET /messenger/conversations/:conversationId/messages – list messages for a conversation */
export const listMessages = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as { _id: string })._id;
  const conversationId = req.params.conversationId;
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) return next(new ErrorHandler('Conversation not found', 404));
  if (!isParticipant(conversation, userId)) return next(new ErrorHandler('Not allowed to view this conversation', 403));

  const messages = await MessageModel.find({ conversationId })
    .populate('senderId', 'firstName lastName email startupName')
    .sort({ createdAt: 1 })
    .lean();
  res.status(200).json({ success: true, messages });
});

/** POST /messenger/conversations/:conversationId/messages – send a message (body: text) */
export const sendMessage = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as { _id: string })._id;
  const conversationId = req.params.conversationId;
  const { text } = req.body as { text?: string };
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) return next(new ErrorHandler('Message text is required', 400));

  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) return next(new ErrorHandler('Conversation not found', 404));
  if (!isParticipant(conversation, userId)) return next(new ErrorHandler('Not allowed to send in this conversation', 403));

  const message = await MessageModel.create({
    conversationId,
    senderId: userId,
    text: trimmed,
  });
  await ConversationModel.updateOne(
    { _id: conversationId },
    { lastMessageAt: message.createdAt, lastMessageText: trimmed.substring(0, 100) }
  );

  const populated = await MessageModel.findById(message._id)
    .populate('senderId', 'firstName lastName email startupName')
    .lean();
  res.status(201).json({ success: true, message: populated });
});
