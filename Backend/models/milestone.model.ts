require('dotenv').config();
import mongoose, { Model, Document, Schema } from 'mongoose';

/** Startup creates → assigns to hired → contributor marks complete → startup submits → admin approve/reject. */
export const MILESTONE_STATUSES = ['Open', 'In Progress', 'Completed', 'Submitted', 'Paid', 'Rejected'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface IMilestone extends Document {
  startupId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  status: MilestoneStatus;
  assignedContributorId?: mongoose.Types.ObjectId;
  completedAt?: Date;
  submittedAt?: Date;
  paidAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    startupId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: MILESTONE_STATUSES,
      default: 'Open',
    },
    assignedContributorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

milestoneSchema.index({ startupId: 1, status: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ assignedContributorId: 1, status: 1 });

const MilestoneModel: Model<IMilestone> = mongoose.model('Milestone', milestoneSchema);
export default MilestoneModel;
