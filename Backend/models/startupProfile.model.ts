require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

export interface IStartupProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  description?: string;
  fundingState?: string;
  contact?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const startupProfileSchema = new Schema<IStartupProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fundingState: {
      type: String,
      trim: true,
      default: '',
    },
    contact: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const StartupProfileModel: Model<IStartupProfile> = mongoose.model('StartupProfile', startupProfileSchema);
export default StartupProfileModel;
