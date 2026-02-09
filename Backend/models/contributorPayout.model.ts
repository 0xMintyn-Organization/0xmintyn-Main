require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

/** Startup pays contributor (salary or for a milestone). */
export interface IContributorPayout extends Document {
  startupId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  milestoneId?: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid';
  note?: string;
  paidAt?: Date;
  stripeTransferId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contributorPayoutSchema = new Schema<IContributorPayout>(
  {
    startupId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'paid',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    stripeTransferId: { type: String, required: false },
  },
  { timestamps: true }
);

contributorPayoutSchema.index({ startupId: 1, createdAt: -1 });
contributorPayoutSchema.index({ contributorId: 1, createdAt: -1 });
contributorPayoutSchema.index({ milestoneId: 1 }, { sparse: true });

const ContributorPayoutModel: Model<IContributorPayout> = mongoose.model(
  'ContributorPayout',
  contributorPayoutSchema
);
export default ContributorPayoutModel;
