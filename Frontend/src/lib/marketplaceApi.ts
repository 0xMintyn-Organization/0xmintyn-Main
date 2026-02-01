/**
 * Marketplace APIs: milestone, application, startup-profile.
 * Uses credentials so cookies are sent.
 */

/** Structured payment method — only last 4 digits / masked data stored; full card number and CVC never sent. */
export type PaymentMethodBody = {
  methodType: "card" | "paypal" | "bank" | "crypto" | "";
  cardLast4?: string;
  cardExpiry?: string;
  cardholderName?: string;
  paypalEmail?: string;
  bankName?: string;
  accountHolderName?: string;
  accountLast4?: string;
  routing?: string;
  cryptoAddress?: string;
};

export type PaymentMethodStored = PaymentMethodBody;

export type StartupProfilePutBody = {
  companyName?: string;
  description?: string;
  image?: string;
  fundingState?: string;
  contact?: string;
  aim?: string;
  positionsHiring?: string;
  personsNeeded?: number;
  paymentMethod?: PaymentMethodBody;
  status?: string;
};

export type ContributorProfilePutBody = {
  image?: string;
  headline?: string;
  bio?: string;
  experience?: string;
  location?: string;
  skills?: string[];
  portfolio?: string;
  availability?: string;
  linkedIn?: string;
  website?: string;
  github?: string;
  paymentMethod?: PaymentMethodBody;
};

const getBase = () => (process.env.NEXT_PUBLIC_SERVER_URI || "").replace(/\/+$/, "") || "https://api.equalmint.com/api/v1";

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
    headers: { "Content-Type": "application/json", ...(rest.headers as Record<string, string>) },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data as T;
}

export const marketplaceApi = {
  milestones: {
    list: () => fetchApi<{ success: boolean; milestones: unknown[] }>("milestone"),
    create: (body: { title: string; description?: string; amount: number }) =>
      fetchApi<{ success: boolean; milestone: unknown }>("milestone", { method: "POST", body }),
    get: (id: string) => fetchApi<{ success: boolean; milestone: unknown }>(`milestone/${id}`),
    patch: (id: string, body: { status?: string }) =>
      fetchApi<{ success: boolean; milestone: unknown }>(`milestone/${id}`, { method: "PATCH", body }),
  },
  contributorPayout: {
    list: () => fetchApi<{ success: boolean; payouts: unknown[] }>("contributor-payout"),
    create: (body: { contributorId: string; amount: number; milestoneId?: string; note?: string }) =>
      fetchApi<{ success: boolean; payout: unknown }>("contributor-payout", { method: "POST", body }),
  },
  engagement: {
    list: () => fetchApi<{ success: boolean; engagements: unknown[] }>("engagement"),
    get: (id: string) => fetchApi<{ success: boolean; engagement: unknown }>(`engagement/${id}`),
    put: (body: { contributorId: string; startDate?: string; endDate?: string | null; agreedSalary?: number; status?: "active" | "ended"; note?: string }) =>
      fetchApi<{ success: boolean; engagement: unknown }>("engagement", { method: "PUT", body }),
    analytics: () => fetchApi<{ success: boolean; analytics: unknown }>("engagement/analytics"),
  },
  /** Payment history when admin marks milestone as Paid (like course order) */
  milestonePayment: {
    list: () => fetchApi<{ success: boolean; payments: unknown[] }>("milestone-payment"),
  },
  applications: {
    list: () => fetchApi<{ success: boolean; applications: unknown[] }>("application"),
    /** Contributor applies to a startup (body: startupId, coverMessage?, cvUrl?, monthlySalary?). Rejected can apply again. */
    create: (body: { startupId: string; coverMessage?: string; cvUrl?: string; monthlySalary?: number }) =>
      fetchApi<{ success: boolean; application: unknown }>("application", { method: "POST", body }),
    patch: (id: string, body: { status: string }) =>
      fetchApi<{ success: boolean; application: unknown }>(`application/${id}`, { method: "PATCH", body }),
  },
  /** Messenger: conversations and messages (marketplace startup <-> contributor) */
  messenger: {
    listConversations: () =>
      fetchApi<{ success: boolean; conversations: unknown[] }>("messenger/conversations"),
    getOrCreateConversation: (otherUserId: string) =>
      fetchApi<{ success: boolean; conversation: unknown }>("messenger/conversations", {
        method: "POST",
        body: { otherUserId },
      }),
    listMessages: (conversationId: string) =>
      fetchApi<{ success: boolean; messages: unknown[] }>(`messenger/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, text: string) =>
      fetchApi<{ success: boolean; message: unknown }>(`messenger/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { text },
      }),
  },
  startupProfile: {
    get: () => fetchApi<{ success: boolean; profile: unknown }>("startup-profile"),
    put: (body: StartupProfilePutBody) =>
      fetchApi<{ success: boolean; profile: unknown }>("startup-profile", { method: "PUT", body }),
    /** List approved startups (marketplace showcase) */
    list: () => fetchApi<{ success: boolean; startups: unknown[] }>("startup-profile/list"),
    /** Admin: list all startup profiles */
    listAdmin: () => fetchApi<{ success: boolean; startups: unknown[] }>("startup-profile/list/admin"),
    /** Admin: set startup profile status (pending | approved | rejected) */
    patchStatus: (id: string, body: { status: string }) =>
      fetchApi<{ success: boolean; profile: unknown }>(`startup-profile/${id}`, { method: "PATCH", body }),
    getById: (id: string) => fetchApi<{ success: boolean; profile: unknown }>(`startup-profile/${id}`),
    /** Public milestones (Open, In Progress) for an approved startup profile */
    getMilestones: (profileId: string) => fetchApi<{ success: boolean; milestones: unknown[] }>(`startup-profile/${profileId}/milestones`),
  },
  contributorProfile: {
    /** Get own contributor profile */
    get: () => fetchApi<{ success: boolean; profile: unknown }>("contributor-profile"),
    put: (body: ContributorProfilePutBody) =>
      fetchApi<{ success: boolean; profile: unknown }>("contributor-profile", { method: "PUT", body }),
    /** List contributors (marketplace showcase, public-safe fields) */
    list: () => fetchApi<{ success: boolean; contributors: unknown[] }>("contributor-profile/list"),
    getById: (id: string) => fetchApi<{ success: boolean; profile: unknown }>(`contributor-profile/${id}`),
  },
};
