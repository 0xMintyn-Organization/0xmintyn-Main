import mongoose, { Document, Schema } from "mongoose";

export interface IMarketplaceMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  senderDeleted: boolean;
  receiverDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceMessageSchema: Schema<IMarketplaceMessage> = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceService',
    required: false
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceProduct',
    required: false
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    required: false
  },
  senderDeleted: {
    type: Boolean,
    default: false
  },
  receiverDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
marketplaceMessageSchema.index({ senderId: 1, createdAt: -1 });
marketplaceMessageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });
marketplaceMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
marketplaceMessageSchema.index({ serviceId: 1 });
marketplaceMessageSchema.index({ productId: 1 });

export const MarketplaceMessageModel = mongoose.model<IMarketplaceMessage>('MarketplaceMessage', marketplaceMessageSchema);

