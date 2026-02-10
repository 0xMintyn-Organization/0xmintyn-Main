/**
 * Stripe Payment – Phase 3: Course payments.
 * PaymentIntent with Connect destination (95% instructor, 5% platform).
 */
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_CONNECT_PLATFORM_FEE_PERCENT) || 5;

/** Create PaymentIntent for course purchase – 95% to instructor, 5% platform. */
export async function createCoursePaymentIntent(
  amountCents: number,
  instructorConnectAccountId: string,
  metadata: { courseId: string; userId: string; courseName: string; equalUsdToUse?: number }
): Promise<{ clientSecret: string; paymentIntentId: string } | { error: string }> {
  if (amountCents < 50) {
    return { error: 'Amount must be at least $0.50' };
  }
  if (!instructorConnectAccountId) {
    return { error: 'Instructor has not connected a payment account' };
  }

  const applicationFeeAmount = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: instructorConnectAccountId,
      },
      application_fee_amount: applicationFeeAmount,
      metadata: {
        courseId: metadata.courseId,
        userId: metadata.userId,
        courseName: metadata.courseName || '',
        ...(metadata.equalUsdToUse != null && metadata.equalUsdToUse > 0 && { equalUsdToUse: String(metadata.equalUsdToUse) }),
      },
    });

    if (!paymentIntent.client_secret) {
      return { error: 'Failed to create payment intent' };
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Transfer from platform balance to a Connect account (e.g. startup milestone funding). */
export async function createPlatformTransfer(
  amountCents: number,
  destinationConnectAccountId: string,
  metadata?: { milestoneId?: string; startupId?: string }
): Promise<{ transferId: string } | { error: string }> {
  if (amountCents < 1) {
    return { error: 'Amount must be at least $0.01' };
  }
  if (!destinationConnectAccountId) {
    return { error: 'Destination Connect account is required' };
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: destinationConnectAccountId,
      ...(metadata?.milestoneId && { metadata: { milestoneId: metadata.milestoneId } }),
    });
    return { transferId: transfer.id };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Phase 5: Reverse a transfer (pull from connected account back to platform). */
export async function reverseTransfer(
  transferId: string,
  amountCents: number,
  metadata?: { contributorPayoutId?: string; contributorId?: string }
): Promise<{ reversalId: string } | { error: string }> {
  if (amountCents < 1) {
    return { error: 'Amount must be at least $0.01' };
  }
  if (!transferId) {
    return { error: 'Transfer ID is required for reversal' };
  }

  try {
    const reversal = await stripe.transfers.createReversal(transferId, {
      amount: amountCents,
      ...(metadata && {
        metadata: Object.fromEntries(
          Object.entries(metadata).filter(([, v]) => v != null) as [string, string][]
        ),
      }),
    });
    return { reversalId: reversal.id };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Get remaining reversible amount for a transfer (amount - amount_reversed). */
export async function getTransferReversibleAmount(
  transferId: string
): Promise<{ amountCents: number } | { error: string }> {
  try {
    const transfer = await stripe.transfers.retrieve(transferId);
    const reversed = transfer.amount_reversed ?? 0;
    const remaining = Math.max(0, transfer.amount - reversed);
    return { amountCents: remaining };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Phase 8: Get platform balance (admin). */
export async function getPlatformBalance(): Promise<
  | { available: number; pending: number; currency: string }
  | { error: string }
> {
  try {
    const balance = await stripe.balance.retrieve();
    const getUsdCents = (arr: { amount: number; currency: string }[]) => {
      const usd = arr.find((b) => b.currency === 'usd');
      return usd ? usd.amount : 0;
    };
    return {
      available: getUsdCents(balance.available),
      pending: getUsdCents(balance.pending),
      currency: 'usd',
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Phase 8: List recent platform transfers (admin). */
export async function listRecentTransfers(
  limit: number = 20
): Promise<{ transfers: { id: string; amount: number; destination: string; created: number }[] } | { error: string }> {
  try {
    const list = await stripe.transfers.list({ limit });
    return {
      transfers: list.data.map((t) => ({
        id: t.id,
        amount: t.amount,
        destination: typeof t.destination === 'string' ? t.destination : t.destination?.id || '',
        created: t.created,
      })),
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Retrieve PaymentIntent and verify status. */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<{ status: string; amount: number } | { error: string }> {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: pi.status,
      amount: pi.amount,
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}
