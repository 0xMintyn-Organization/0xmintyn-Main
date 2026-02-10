/**
 * Stripe Connect API – Phase 2.
 * Create account, get onboarding link, get status.
 */

const getBase = () =>
  (process.env.NEXT_PUBLIC_SERVER_URI || "").replace(/\/+$/, "") ||
  "https://api.equalmint.com/api/v1";

async function fetchApi<T>(
  path: string,
  options: RequestInit & { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body, ...rest } = options;
  const url = `${getBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers as Record<string, string>),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data as T;
}

export type StripeConnectStatus = {
  success: boolean;
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  status?: "pending" | "active";
};

export type StripeBalance = {
  success: boolean;
  available: number;
  pending: number;
  currency: string;
  connected?: boolean;
  message?: string;
};

export type Withdrawal = {
  _id: string;
  amount: number;
  currency: string;
  stripePayoutId: string;
  status: string;
  createdAt: string;
  bankName?: string;
  last4?: string;
  arrivalDate?: number;
};

export const stripeApi = {
  createConnectAccount: () =>
    fetchApi<{ success: boolean; accountId: string; message?: string }>(
      "stripe/connect/create-account",
      { method: "POST" }
    ),
  getOnboardingLink: () =>
    fetchApi<{ success: boolean; url: string }>(
      "stripe/connect/onboarding-link"
    ),
  getStatus: () =>
    fetchApi<StripeConnectStatus>("stripe/connect/status"),
  getDashboardLink: () =>
    fetchApi<{ success: boolean; url: string }>("stripe/connect/dashboard-link"),
  // Phase 6: Withdraw
  getBalance: () =>
    fetchApi<StripeBalance>("stripe/balance"),
  withdraw: (amount: number) =>
    fetchApi<{ success: boolean; payoutId: string; status: string; amount: number; message?: string }>(
      "stripe/withdraw",
      { method: "POST", body: { amount } }
    ),
  listWithdrawals: () =>
    fetchApi<{ success: boolean; withdrawals: Withdrawal[] }>("stripe/withdrawals"),
};
