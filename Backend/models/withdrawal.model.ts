require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

/** Record of user withdrawing balance to bank via Stripe Payout. */
export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  stripePayoutId: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'usd',
      trim: true,
    },
    stripePayoutId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'canceled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ stripePayoutId: 1 }, { unique: true });

const WithdrawalModel: Model<IWithdrawal> = mongoose.model(
  'Withdrawal',
  withdrawalSchema
);
export default WithdrawalModel;
