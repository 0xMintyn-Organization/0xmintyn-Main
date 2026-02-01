"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AdminProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StartupProfile = {
  _id: string;
  companyName: string;
  description?: string;
  fundingState?: string;
  contact?: string;
  status: string;
  userId?: { _id?: string; startupName?: string; email?: string; firstName?: string; lastName?: string };
};

function getStartupName(p: StartupProfile): string {
  const u = p.userId;
  if (!u || typeof u !== "object") return p.companyName || "—";
  if ("startupName" in u && u.startupName) return u.startupName as string;
  if ("firstName" in u || "lastName" in u) return [u.firstName, u.lastName].filter(Boolean).join(" ") || (u.email as string) || p.companyName || "—";
  return p.companyName || (u.email as string) || "—";
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export default function AdminStartupProfilesPage() {
  const [startups, setStartups] = useState<StartupProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await marketplaceApi.startupProfile.listAdmin();
      setStartups((res.startups as StartupProfile[]) || []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (profileId: string, status: "approved" | "rejected") => {
    setUpdating(profileId);
    try {
      await marketplaceApi.startupProfile.patchStatus(profileId, { status });
      toast({ title: status === "approved" ? "Approved" : "Rejected", description: `Startup profile ${status}.` });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const pending = startups.filter((s) => s.status === "pending");
  const approved = startups.filter((s) => s.status === "approved");
  const rejected = startups.filter((s) => s.status === "rejected");

  return (
    <AdminProtected>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-green-600" />
            Startup profiles
          </h1>
          <p className="text-muted-foreground mt-1">
            Approve or reject startup profiles. Only approved startups appear in the marketplace Startups list.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({pending.length})
                </h2>
                <ul className="space-y-3">
                  {pending.map((p) => (
                    <li key={p._id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-foreground">{getStartupName(p)}</h3>
                        <p className="text-sm text-muted-foreground">{p.companyName}</p>
                        {p.description && <p className="text-sm mt-1 line-clamp-2">{p.description}</p>}
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${STATUS_BADGES[p.status]?.className ?? "bg-muted"}`}>
                          {STATUS_BADGES[p.status]?.label ?? p.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleStatus(p._id, "approved")} disabled={updating === p._id}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {updating === p._id ? "…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatus(p._id, "rejected")} disabled={updating === p._id}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {approved.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Approved ({approved.length})
                </h2>
                <ul className="space-y-2">
                  {approved.map((p) => (
                    <li key={p._id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                      <span className="font-medium">{getStartupName(p)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGES.approved.className}`}>Approved</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {rejected.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejected ({rejected.length})
                </h2>
                <ul className="space-y-2">
                  {rejected.map((p) => (
                    <li key={p._id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between opacity-80">
                      <span className="font-medium">{getStartupName(p)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGES.rejected.className}`}>Rejected</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {startups.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No startup profiles yet. Startups create profiles from their Startup Hub; they appear here for approval.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminProtected>
  );
}
