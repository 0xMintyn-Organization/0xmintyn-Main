require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

export interface IStartupProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  description?: string;
  /** Cloudinary image URL (logo/banner) */
  image?: string;
  fundingState?: string;
  contact?: string;
  /** Startup's aim / vision / goal */
  aim?: string;
  /** Who they are hiring – positions (e.g. "Frontend Dev, Backend Dev") */
  positionsHiring?: string;
  /** How many persons needed (number) */
  personsNeeded?: number;
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
    image: {
      type: String,
      trim: true,
      default: '',
    },
    aim: {
      type: String,
      trim: true,
      default: '',
    },
    positionsHiring: {
      type: String,
      trim: true,
      default: '',
    },
    personsNeeded: {
      type: Number,
      min: 0,
      default: 0,
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  { timestamps: true }
);

const StartupProfileModel: Model<IStartupProfile> = mongoose.model('StartupProfile', startupProfileSchema);
export default StartupProfileModel;
