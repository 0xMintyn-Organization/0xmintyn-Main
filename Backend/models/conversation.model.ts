require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

/** Two participants (e.g. startup user and contributor). */
export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessageAt?: Date;
  lastMessageText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: [(v: mongoose.Types.ObjectId[]) => v.length === 2, 'Exactly 2 participants required'],
    },
    lastMessageAt: { type: Date, default: null },
    lastMessageText: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ lastMessageAt: -1 });

const ConversationModel: Model<IConversation> = mongoose.model('Conversation', conversationSchema);
export default ConversationModel;
