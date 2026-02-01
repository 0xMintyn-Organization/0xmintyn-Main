require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

export interface IContributorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  /** Cloudinary image URL (avatar/photo) */
  image?: string;
  /** Short tagline (e.g. "Full-stack developer") */
  headline?: string;
  /** Longer bio / about me */
  bio?: string;
  /** Experience description (e.g. "5 years", "Senior dev at X") */
  experience?: string;
  /** Location or timezone */
  location?: string;
  skills: string[];
  portfolio?: string;
  availability?: string;
  /** Optional links */
  linkedIn?: string;
  website?: string;
  github?: string;
  /** Structured payment method for receiving/sending – only owner sees details; we never store full card number or CVC */
  paymentMethod?: {
    methodType: 'card' | 'paypal' | 'bank' | 'crypto' | '';
    cardLast4?: string;
    cardExpiry?: string;
    cardholderName?: string;
    paypalEmail?: string;
    bankName?: string;
    accountHolderName?: string;
    accountLast4?: string;
    routing?: string;
    cryptoAddress?: string;
  };
  earningsSummary?: number;
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
    image: {
      type: String,
      trim: true,
      default: '',
    },
    headline: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
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
    availability: {
      type: String,
      trim: true,
      default: '',
    },
    linkedIn: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      methodType: { type: String, enum: ['card', 'paypal', 'bank', 'crypto', ''], default: '' },
      cardLast4: { type: String, trim: true, default: '' },
      cardExpiry: { type: String, trim: true, default: '' },
      cardholderName: { type: String, trim: true, default: '' },
      paypalEmail: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
      accountHolderName: { type: String, trim: true, default: '' },
      accountLast4: { type: String, trim: true, default: '' },
      routing: { type: String, trim: true, default: '' },
      cryptoAddress: { type: String, trim: true, default: '' },
    },
    earningsSummary: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const ContributorProfileModel: Model<IContributorProfile> = mongoose.model(
  'ContributorProfile',
  contributorProfileSchema
);
export default ContributorProfileModel;
