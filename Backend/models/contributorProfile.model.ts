require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

export interface IContributorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  skills: string[];
  portfolio?: string;
  paymentInfo?: string;
  earningsSummary?: number;
  availability?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contributorProfileSchema = new Schema<IContributorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
    },
    paymentInfo: {
      type: String,
      trim: true,
      default: '',
    },
    earningsSummary: {
      type: Number,
      default: 0,
    },
    availability: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const ContributorProfileModel: Model<IContributorProfile> = mongoose.model(
  'ContributorProfile',
  contributorProfileSchema
);
export default ContributorProfileModel;
