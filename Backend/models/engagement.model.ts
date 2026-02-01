require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

/** Engagement = startup–contributor working relationship: start/end dates, agreed salary. Created when application is accepted. */
export type EngagementStatus = 'active' | 'ended';

export interface IEngagement extends Document {
  startupId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  agreedSalary: number; // monthly or per-period; editable by startup
  status: EngagementStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const engagementSchema = new Schema<IEngagement>(
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
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    endDate: {
      type: Date,
      default: null,
    },
    agreedSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

engagementSchema.index({ startupId: 1, contributorId: 1 }, { unique: true });
engagementSchema.index({ contributorId: 1 });
engagementSchema.index({ startupId: 1, status: 1 });

const EngagementModel: Model<IEngagement> = mongoose.model('Engagement', engagementSchema);
export default EngagementModel;
