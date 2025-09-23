import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  proposalId: mongoose.Types.ObjectId;
  voterId: mongoose.Types.ObjectId;
  voterName: string;
  voterWallet: string;
  vote: 'yes' | 'no' | 'abstain';
  votingPower: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema: Schema = new Schema({
  proposalId: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
    required: [true, 'Proposal ID is required']
  },
  voterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Voter ID is required']
  },
  voterName: {
    type: String,
    required: [true, 'Voter name is required'],
    trim: true
  },
  voterWallet: {
    type: String,
    required: [true, 'Voter wallet address is required'],
    trim: true
  },
  vote: {
    type: String,
    enum: ['yes', 'no', 'abstain'],
    required: [true, 'Vote choice is required']
  },
  votingPower: {
    type: Number,
    required: [true, 'Voting power is required'],
    min: [0, 'Voting power cannot be negative'],
    default: 1
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per user per proposal
VoteSchema.index({ proposalId: 1, voterId: 1 }, { unique: true });

// Index for efficient queries
VoteSchema.index({ proposalId: 1, vote: 1 });
VoteSchema.index({ voterId: 1, createdAt: -1 });
VoteSchema.index({ proposalId: 1, createdAt: -1 });

export default mongoose.model<IVote>('Vote', VoteSchema);
