require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

/**
 * Record created when admin marks a milestone as Paid (fund release to startup).
 * Similar to Order in education: one record per payment. Stripe can be added later.
 */
export interface IMilestonePayment extends Document {
  milestoneId: mongoose.Types.ObjectId;
  startupId: mongoose.Types.ObjectId;
  amount: number;
  milestoneTitle: string;
  startupName?: string;
  status: 'paid';
  payment_info: {
    paymentMethod: string;
    paymentStatus: string;
    amount?: number;
    currency?: string;
    transactionId?: string;
  };
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const milestonePaymentSchema = new Schema<IMilestonePayment>(
  {
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      required: true,
    },
    startupId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    milestoneTitle: {
      type: String,
      required: true,
      trim: true,
    },
    startupName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['paid'],
      default: 'paid',
    },
    payment_info: {
      paymentMethod: { type: String, default: 'manual' },
      paymentStatus: { type: String, default: 'completed' },
      amount: Number,
      currency: { type: String, default: 'USD' },
      transactionId: String,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

milestonePaymentSchema.index({ milestoneId: 1 }, { unique: true });
milestonePaymentSchema.index({ startupId: 1 });
milestonePaymentSchema.index({ paidAt: -1 });

const MilestonePaymentModel: Model<IMilestonePayment> = mongoose.model(
  'MilestonePayment',
  milestonePaymentSchema
);
export default MilestonePaymentModel;
