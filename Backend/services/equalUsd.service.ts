/**
 * EqualUSD – Platform points. 1 EqualUSD = $1 USD.
 * Credits: registration, course completion, proposal approved.
 * Debits: course purchase discount.
 */
import mongoose from 'mongoose';
import UserModel from '../models/user.mode';
import EqualUsdTransactionModel from '../models/equalUsdTransaction.model';

const REGISTRATION_BONUS = Number(process.env.EQUALUSD_REGISTRATION_BONUS) || 10;
const COURSE_COMPLETION_BONUS = Number(process.env.EQUALUSD_COURSE_COMPLETION) || 20;
const PROPOSAL_APPROVED_BONUS = Number(process.env.EQUALUSD_PROPOSAL_APPROVED) || 20;

export function getRegistrationBonus() { return REGISTRATION_BONUS; }
export function getCourseCompletionBonus() { return COURSE_COMPLETION_BONUS; }
export function getProposalApprovedBonus() { return PROPOSAL_APPROVED_BONUS; }

/** Credit EqualUSD to user. Returns new balance or error. Uses atomic $inc (works on standalone MongoDB, no replica set needed). */
export async function creditEqualUsd(
  userId: mongoose.Types.ObjectId,
  amount: number,
  type: 'registration_bonus' | 'course_completion' | 'proposal_approved' | 'admin_adjustment',
  options?: { referenceType?: string; referenceId?: string; description?: string }
): Promise<{ newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: 'Credit amount must be positive' };

  try {
    const updated = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $inc: { equalUsdBalance: amount } },
      { new: true }
    );
    if (!updated) return { error: 'User not found' };

    const newBalance = (updated as { equalUsdBalance?: number }).equalUsdBalance ?? 0;

    await EqualUsdTransactionModel.create({
      userId,
      type,
      amount: +amount,
      balanceAfter: newBalance,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      description: options?.description,
    });

    return { newBalance };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to credit EqualUSD' };
  }
}

/** Debit EqualUSD from user. Returns new balance or error. Uses atomic $inc (works on standalone MongoDB, no replica set needed). */
export async function debitEqualUsd(
  userId: mongoose.Types.ObjectId,
  amount: number,
  type: 'course_purchase_discount' | 'admin_adjustment',
  options?: { referenceType?: string; referenceId?: string; description?: string }
): Promise<{ newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: 'Debit amount must be positive' };

  try {
    const user = await UserModel.findById(userId).select('equalUsdBalance').lean();
    if (!user) return { error: 'User not found' };
    const current = (user as { equalUsdBalance?: number }).equalUsdBalance ?? 0;
    if (current < amount) {
      return { error: `Insufficient EqualUSD. You have ${current}, need ${amount}.` };
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: userId, equalUsdBalance: { $gte: amount } },
      { $inc: { equalUsdBalance: -amount } },
      { new: true }
    );
    if (!updated) return { error: 'Insufficient EqualUSD (balance changed)' };

    const newBalance = (updated as { equalUsdBalance?: number }).equalUsdBalance ?? 0;

    await EqualUsdTransactionModel.create({
      userId,
      type,
      amount: -amount,
      balanceAfter: newBalance,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      description: options?.description,
    });

    return { newBalance };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to debit EqualUSD' };
  }
}

/** Get user's EqualUSD balance. */
export async function getEqualUsdBalance(userId: mongoose.Types.ObjectId): Promise<number> {
  const user = await UserModel.findById(userId).select('equalUsdBalance').lean();
  return (user as { equalUsdBalance?: number })?.equalUsdBalance ?? 0;
}

/** Check if already credited for reference (idempotency). */
export async function hasCreditedFor(
  type: 'course_completion' | 'proposal_approved',
  referenceId: string
): Promise<boolean> {
  const exists = await EqualUsdTransactionModel.exists({
    type,
    referenceId,
    amount: { $gt: 0 },
  });
  return !!exists;
}

/** Check if already debited for course purchase (idempotency – prevents double debit when confirmEnroll called twice). */
export async function hasDebitedForCoursePurchase(paymentIntentId: string): Promise<boolean> {
  const exists = await EqualUsdTransactionModel.exists({
    type: 'course_purchase_discount',
    referenceId: paymentIntentId,
    amount: { $lt: 0 },
  });
  return !!exists;
}

/** Check if user already received registration bonus (idempotency). */
export async function hasCreditedRegistration(userId: mongoose.Types.ObjectId): Promise<boolean> {
  const exists = await EqualUsdTransactionModel.exists({
    userId,
    type: 'registration_bonus',
    amount: { $gt: 0 },
  });
  return !!exists;
}

/** Grant registration bonus if not already granted. Fire-and-forget safe. */
export async function grantRegistrationBonusIfEligible(userId: mongoose.Types.ObjectId): Promise<void> {
  if (REGISTRATION_BONUS <= 0) return;
  const already = await hasCreditedRegistration(userId);
  if (already) return;
  const result = await creditEqualUsd(userId, REGISTRATION_BONUS, 'registration_bonus', {
    description: 'Welcome bonus for registering',
  });
  if ('error' in result) {
    // Log but don't throw – user account is already created
    console.error('[EqualUSD] Registration bonus failed:', result.error, 'userId:', userId);
  }
}
