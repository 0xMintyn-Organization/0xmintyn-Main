"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AdminProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle, XCircle, Clock, ExternalLink, Mail, Briefcase } from "lucide-react";
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

function StartupRow({
  p,
  updating,
  onStatus,
  showActions,
}: {
  p: StartupProfile;
  updating: string | null;
  onStatus: (id: string, status: "approved" | "rejected") => void;
  showActions: "approve-reject" | "view-reject" | "view-approve";
}) {
  const badge = STATUS_BADGES[p.status] ?? { label: p.status, className: "bg-muted" };
  return (
    <li className="rounded-xl border border-border bg-card p-5 flex flex-wrap items-start justify-between gap-4 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{getStartupName(p)}</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        {p.companyName && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            {p.companyName}
          </p>
        )}
        {p.contact && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            {p.contact}
          </p>
        )}
        {p.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/marketplace/startups/${p._id}`} className="inline-flex items-center gap-1.5">
            <ExternalLink className="w-4 h-4" />
            View
          </Link>
        </Button>
        {showActions === "approve-reject" && (
          <>
            <Button size="sm" onClick={() => onStatus(p._id, "approved")} disabled={updating === p._id}>
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {updating === p._id ? "…" : "Approve"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatus(p._id, "rejected")} disabled={updating === p._id}>
              <XCircle className="w-4 h-4 mr-1.5" />
              Reject
            </Button>
          </>
        )}
        {showActions === "view-reject" && (
          <Button size="sm" variant="outline" onClick={() => onStatus(p._id, "rejected")} disabled={updating === p._id}>
            <XCircle className="w-4 h-4 mr-1.5" />
            {updating === p._id ? "…" : "Reject"}
          </Button>
        )}
        {showActions === "view-approve" && (
          <Button size="sm" variant="outline" onClick={() => onStatus(p._id, "approved")} disabled={updating === p._id}>
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {updating === p._id ? "…" : "Approve"}
          </Button>
        )}
      </div>
    </li>
  );
}

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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
              <Building2 className="w-6 h-6" />
            </span>
            Startup profiles
          </h1>
          <p className="text-muted-foreground pl-[52px]">
            Approve or reject startup profiles. Only approved startups appear in the marketplace Startups list.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading startup profiles…
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pending.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{approved.length}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{rejected.length}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending */}
            {pending.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Pending ({pending.length})
                </h2>
                <ul className="space-y-4">
                  {pending.map((p) => (
                    <StartupRow key={p._id} p={p} updating={updating} onStatus={handleStatus} showActions="approve-reject" />
                  ))}
                </ul>
              </section>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Approved ({approved.length})
                </h2>
                <ul className="space-y-4">
                  {approved.map((p) => (
                    <StartupRow key={p._id} p={p} updating={updating} onStatus={handleStatus} showActions="view-reject" />
                  ))}
                </ul>
              </section>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Rejected ({rejected.length})
                </h2>
                <ul className="space-y-4">
                  {rejected.map((p) => (
                    <StartupRow key={p._id} p={p} updating={updating} onStatus={handleStatus} showActions="view-approve" />
                  ))}
                </ul>
              </section>
            )}

            {/* Empty state */}
            {startups.length === 0 && (
              <Card className="rounded-xl border-dashed">
                <CardContent className="py-12 px-6 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium">No startup profiles yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Startups create profiles from their Startup Hub; they will appear here for approval.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminProtected>
  );
}
