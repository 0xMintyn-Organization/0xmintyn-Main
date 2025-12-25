import mongoose, { Document, Schema, Model } from 'mongoose';

export interface PaymentMethodDetails {
  method: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
  routingNumber?: string;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  notes?: string;
}

export interface IP2PMerchantProfile extends Document {
  userId: mongoose.Types.ObjectId;
  displayName: string;
  paymentMethods: string[];
  paymentMethodDetails: PaymentMethodDetails[];
  timeLimitMinutes: number;
  terms: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const p2pMerchantProfileSchema = new Schema<IP2PMerchantProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [40, 'Display name cannot exceed 40 characters'],
    },
    paymentMethods: {
      type: [String],
      required: [true, 'Payment methods are required'],
      default: [],
      validate: {
        validator: (methods: string[]) => methods.length > 0,
        message: 'At least one payment method is required',
      },
    },
    paymentMethodDetails: {
      type: [
        {
          method: { type: String, required: true },
          accountNumber: { type: String, default: '' },
          accountHolderName: { type: String, default: '' },
          bankName: { type: String, default: '' },
          iban: { type: String, default: '' },
          swiftCode: { type: String, default: '' },
          routingNumber: { type: String, default: '' },
          email: { type: String, default: '' },
          phoneNumber: { type: String, default: '' },
          walletAddress: { type: String, default: '' },
          notes: { type: String, default: '' },
        },
      ],
      default: [],
    },
    timeLimitMinutes: {
      type: Number,
      required: [true, 'Time limit is required'],
      min: [5, 'Time limit must be at least 5 minutes'],
      max: [60, 'Time limit cannot exceed 60 minutes'],
      default: 15,
    },
    terms: {
      type: String,
      default: '',
      maxlength: [500, 'Terms cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
p2pMerchantProfileSchema.index({ userId: 1, isActive: 1 });

const P2PMerchantProfileModel: Model<IP2PMerchantProfile> = mongoose.model<IP2PMerchantProfile>(
  'P2PMerchantProfile',
  p2pMerchantProfileSchema
);

export default P2PMerchantProfileModel;

