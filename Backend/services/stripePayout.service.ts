/**
 * Stripe Payout – Phase 6: Withdraw balance to bank.
 * For Connect Express accounts: get balance, create payout.
 */
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Get Connect account balance (available + pending) in cents per currency. */
export async function getConnectBalance(accountId: string): Promise<
  | { available: number; pending: number; currency: string }
  | { error: string }
> {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    // Stripe returns available/pending as arrays of { amount, currency }
    const getUsdCents = (arr: { amount: number; currency: string }[]) => {
      const usd = arr.find((b) => b.currency === 'usd');
      return usd ? usd.amount : 0;
    };

    const available = getUsdCents(balance.available);
    const pending = getUsdCents(balance.pending);

    return {
      available,
      pending,
      currency: 'usd',
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Get payout details including destination bank account (last4, bank_name). */
export async function getPayoutWithDestination(
  accountId: string,
  payoutId: string
): Promise<
  | { amount: number; status: string; bankName?: string; last4?: string; arrivalDate?: number }
  | { error: string }
> {
  try {
    const payout = await stripe.payouts.retrieve(payoutId, {
      stripeAccount: accountId,
      expand: ['destination'],
    });

    const dest = payout.destination;
    let bankName: string | undefined;
    let last4: string | undefined;

    if (dest && typeof dest === 'object' && 'object' in dest) {
      if ((dest as { object?: string }).object === 'bank_account') {
        const ba = dest as { bank_name?: string; last4?: string };
        bankName = ba.bank_name;
        last4 = ba.last4;
      }
    }

    return {
      amount: payout.amount,
      status: payout.status,
      bankName,
      last4,
      arrivalDate: payout.arrival_date ?? undefined,
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Create a payout from Connect account to their bank. */
export async function createPayout(
  accountId: string,
  amountCents: number,
  currency: string = 'usd',
  metadata?: { userId?: string }
): Promise<{ payoutId: string; status: string } | { error: string }> {
  if (amountCents < 100) {
    return { error: 'Minimum payout amount is $1.00' };
  }
  if (!accountId) {
    return { error: 'Connect account ID is required' };
  }

  try {
    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: currency.toLowerCase(),
        ...(metadata && {
          metadata: Object.fromEntries(
            Object.entries(metadata).filter(([, v]) => v != null) as [string, string][]
          ),
        }),
      },
      { stripeAccount: accountId }
    );

    return {
      payoutId: payout.id,
      status: payout.status,
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}
