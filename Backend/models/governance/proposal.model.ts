import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  title: string;
  category: 'Platform Upgrade' | 'Policy Change' | 'Treasury Allocation' | 'UBI Distribution' | 'AI/Tech Development' | 'Community Engagement' | 'Other';
  proposerName: string;
  proposerWallet: string;
  proposerId: mongoose.Types.ObjectId;
  summary: string;
  detailedDescription: string;
  expectedImpact: string;
  implementationPlan: string;
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: string[];
  };
  resourcesNeeded: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  votingOptions: {
    yes: number;
    no: number;
    abstain: number;
  };
  totalVotes: number;
  status: 'Draft' | 'Active' | 'Passed' | 'Rejected' | 'Expired';
  startDate: Date;
  endDate: Date;
  proposalFee: number;
  isPaid: boolean;
  requiredVotes: number;
  quorum: number;
  blockchainAddress?: string;
  blockchainTx?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Proposal title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: ['Platform Upgrade', 'Policy Change', 'Treasury Allocation', 'UBI Distribution', 'AI/Tech Development', 'Community Engagement', 'Other'],
    required: [true, 'Proposal category is required']
  },
  proposerName: {
    type: String,
    required: [true, 'Proposer name is required'],
    trim: true
  },
  proposerWallet: {
    type: String,
    required: [true, 'Proposer wallet address is required'],
    trim: true
  },
  proposerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proposer ID is required']
  },
  summary: {
    type: String,
    required: [true, 'Proposal summary is required'],
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  detailedDescription: {
    type: String,
    required: [true, 'Detailed description is required'],
    trim: true,
    maxlength: [5000, 'Detailed description cannot exceed 5000 characters']
  },
  expectedImpact: {
    type: String,
    required: [true, 'Expected impact is required'],
    trim: true,
    maxlength: [2000, 'Expected impact cannot exceed 2000 characters']
  },
  implementationPlan: {
    type: String,
    required: [true, 'Implementation plan is required'],
    trim: true,
    maxlength: [3000, 'Implementation plan cannot exceed 3000 characters']
  },
  timeline: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    milestones: [{
      type: String,
      trim: true
    }]
  },
  resourcesNeeded: {
    type: String,
    required: [true, 'Resources needed is required'],
    trim: true,
    maxlength: [1000, 'Resources needed cannot exceed 1000 characters']
  },
  attachments: [{
    name: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: false
    },
    type: {
      type: String,
      required: false
    }
  }],
  votingOptions: {
    yes: {
      type: Number,
      default: 0,
      min: 0
    },
    no: {
      type: Number,
      default: 0,
      min: 0
    },
    abstain: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Passed', 'Rejected', 'Expired'],
    default: 'Active'
  },
  startDate: {
    type: Date,
    required: [true, 'Voting start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Voting end date is required']
  },
  proposalFee: {
    type: Number,
    default: 0,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: true // Free proposals are considered "paid"
  },
  requiredVotes: {
    type: Number,
    default: 100,
    min: 1
  },
  quorum: {
    type: Number,
    default: 65,
    min: 0,
    max: 100
  },
  blockchainAddress: {
    type: String,
    trim: true
  },
  blockchainTx: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProposalSchema.index({ status: 1, createdAt: -1 });
ProposalSchema.index({ proposerId: 1, createdAt: -1 });
ProposalSchema.index({ category: 1, status: 1 });
ProposalSchema.index({ totalVotes: -1, status: 1 });

// Virtual for calculating vote percentages
ProposalSchema.virtual('yesPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votingOptions.yes / this.totalVotes) * 100);
});

ProposalSchema.virtual('noPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votingOptions.no / this.totalVotes) * 100);
});

ProposalSchema.virtual('abstainPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votingOptions.abstain / this.totalVotes) * 100);
});

// Virtual for checking if proposal is active
ProposalSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'Active' && now >= this.startDate && now <= this.endDate;
});

// Virtual for checking if proposal has passed
ProposalSchema.virtual('hasPassed').get(function() {
  if (this.status !== 'Active') return false;
  const yesPercentage = this.yesPercentage;
  return yesPercentage > 50 && this.totalVotes >= this.requiredVotes;
});

export default mongoose.model<IProposal>('Proposal', ProposalSchema);
