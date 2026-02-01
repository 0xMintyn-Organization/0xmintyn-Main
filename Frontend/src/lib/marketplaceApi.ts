/**
 * Marketplace APIs: milestone, application, startup-profile.
 * Uses credentials so cookies are sent.
 */
const getBase = () => (process.env.NEXT_PUBLIC_SERVER_URI || "").replace(/\/+$/, "") || "http://localhost:8000/api/v1";

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
    patch: (id: string, body: { status: string }) =>
      fetchApi<{ success: boolean; milestone: unknown }>(`milestone/${id}`, { method: "PATCH", body }),
  },
  /** Payment history when admin marks milestone as Paid (like course order) */
  milestonePayment: {
    list: () => fetchApi<{ success: boolean; payments: unknown[] }>("milestone-payment"),
  },
  applications: {
    list: () => fetchApi<{ success: boolean; applications: unknown[] }>("application"),
    /** Contributor applies to a startup (body: startupId, coverMessage?) */
    create: (body: { startupId: string; coverMessage?: string }) =>
      fetchApi<{ success: boolean; application: unknown }>("application", { method: "POST", body }),
    patch: (id: string, body: { status: string }) =>
      fetchApi<{ success: boolean; application: unknown }>(`application/${id}`, { method: "PATCH", body }),
  },
  startupProfile: {
    get: () => fetchApi<{ success: boolean; profile: unknown }>("startup-profile"),
    put: (body: { companyName?: string; description?: string; fundingState?: string; contact?: string; status?: string }) =>
      fetchApi<{ success: boolean; profile: unknown }>("startup-profile", { method: "PUT", body }),
    /** List approved startups (marketplace showcase) */
    list: () => fetchApi<{ success: boolean; startups: unknown[] }>("startup-profile/list"),
    /** Admin: list all startup profiles */
    listAdmin: () => fetchApi<{ success: boolean; startups: unknown[] }>("startup-profile/list/admin"),
    /** Admin: set startup profile status (pending | approved | rejected) */
    patchStatus: (id: string, body: { status: string }) =>
      fetchApi<{ success: boolean; profile: unknown }>(`startup-profile/${id}`, { method: "PATCH", body }),
    getById: (id: string) => fetchApi<{ success: boolean; profile: unknown }>(`startup-profile/${id}`),
  },
  contributorProfile: {
    /** Get own contributor profile */
    get: () => fetchApi<{ success: boolean; profile: unknown }>("contributor-profile"),
    put: (body: { skills?: string[]; portfolio?: string; availability?: string }) =>
      fetchApi<{ success: boolean; profile: unknown }>("contributor-profile", { method: "PUT", body }),
    /** List contributors (marketplace showcase, public-safe fields) */
    list: () => fetchApi<{ success: boolean; contributors: unknown[] }>("contributor-profile/list"),
    getById: (id: string) => fetchApi<{ success: boolean; profile: unknown }>(`contributor-profile/${id}`),
  },
};
