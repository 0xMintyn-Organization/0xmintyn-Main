/**
 * Stripe Connect - Create Express accounts and onboarding links.
 * Phase 1: Account creation for instructor, startup, contributor.
 */
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export type ConnectAccountType = 'instructor' | 'startup' | 'contributor';

/** Create a Stripe Connect Express account for a user. */
export async function createConnectAccount(
  email: string,
  userType: ConnectAccountType
): Promise<{ accountId: string } | { error: string }> {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // TODO: make configurable per user
      email: email.trim(),
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });
    return { accountId: account.id };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Create an Account Link for user to complete Stripe onboarding. */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<{ url: string } | { error: string }> {
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return { url: link.url };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Create a Login Link for Express user to access their Stripe Dashboard (payouts, bank account, etc.). */
export async function createLoginLink(accountId: string): Promise<{ url: string } | { error: string }> {
  try {
    const link = await stripe.accounts.createLoginLink(accountId);
    return { url: link.url };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}

/** Get Connect account status (charges_enabled, payouts_enabled). */
export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
} | { error: string }> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    if (account.deleted) {
      return { error: 'Account has been deleted' };
    }
    return {
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    return { error: err.message || String(e) };
  }
}
