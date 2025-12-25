import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IP2PMessage extends Document {
  orderId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  attachments?: Array<{
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileUrl?: string;
  }>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const p2pMessageSchema = new Schema<IP2PMessage>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'P2PTrade',
      required: [true, 'Order ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    attachments: [
      {
        originalName: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
          min: 0,
        },
        mimeType: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
        },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
p2pMessageSchema.index({ orderId: 1, createdAt: -1 });
p2pMessageSchema.index({ senderId: 1, isRead: 1 });
p2pMessageSchema.index({ orderId: 1, isRead: 1 });

const P2PMessageModel: Model<IP2PMessage> = mongoose.model<IP2PMessage>('P2PMessage', p2pMessageSchema);

export default P2PMessageModel;
