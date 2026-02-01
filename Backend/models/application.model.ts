require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Contributor applies to a Startup (to work with them). Not per-milestone. */
export interface IApplication extends Document {
  startupId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  coverMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
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
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending',
    },
    coverMessage: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

applicationSchema.index({ startupId: 1, contributorId: 1 }, { unique: true });
applicationSchema.index({ contributorId: 1 });
applicationSchema.index({ startupId: 1, status: 1 });

const ApplicationModel: Model<IApplication> = mongoose.model('Application', applicationSchema);
export default ApplicationModel;
