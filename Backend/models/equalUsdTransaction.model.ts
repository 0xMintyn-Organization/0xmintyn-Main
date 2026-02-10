/**
 * EqualUSD transaction ledger – audit trail for all EqualUSD movements.
 * 1 EqualUSD = $1 USD. Platform points for registration, course completion, proposal approval, course discount.
 */
import mongoose, { Model, Document, Schema } from 'mongoose';

export type EqualUsdTransactionType =
  | 'registration_bonus'
  | 'course_completion'
  | 'proposal_approved'
  | 'course_purchase_discount'
  | 'admin_adjustment';

export interface IEqualUsdTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: EqualUsdTransactionType;
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdAt: Date;
}

const equalUsdTransactionSchema = new Schema<IEqualUsdTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['registration_bonus', 'course_completion', 'proposal_approved', 'course_purchase_discount', 'admin_adjustment'],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String, trim: true },
    referenceId: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

equalUsdTransactionSchema.index({ userId: 1, createdAt: -1 });
equalUsdTransactionSchema.index({ referenceType: 1, referenceId: 1 }, { sparse: true });

export default mongoose.model<IEqualUsdTransaction>('EqualUsdTransaction', equalUsdTransactionSchema);
