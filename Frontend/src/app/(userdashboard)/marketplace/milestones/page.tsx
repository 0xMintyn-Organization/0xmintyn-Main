"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Store, Target, CheckCircle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { useToast } from "@/hooks/use-toast";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  startupId?: { _id?: string; startupName?: string; firstName?: string; lastName?: string; email?: string };
};

function getStartupName(s: Milestone["startupId"]): string {
  if (!s || typeof s !== "object") return "—";
  if (s.startupName) return s.startupName;
  return [s.firstName, s.lastName].filter(Boolean).join(" ") || (s.email as string) || "—";
}

const statusStyles: Record<string, string> = {
  Open: "bg-zinc-500/20 text-zinc-300",
  "In Progress": "bg-blue-500/20 text-blue-300",
  Completed: "bg-amber-500/20 text-amber-300",
  Submitted: "bg-violet-500/20 text-violet-300",
  Paid: "bg-green-500/20 text-green-300",
  Rejected: "bg-red-500/20 text-red-300",
};

export default function MarketplaceMilestonesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const isContributor = (user as { marketplace_role?: string })?.marketplace_role === "contributor";

  useEffect(() => {
    if (user != null && !isContributor) {
      router.replace("/marketplace/startups");
    }
  }, [user, isContributor, router]);

  useEffect(() => {
    if (!isContributor) {
      setLoading(false);
      return;
    }
    marketplaceApi.milestones
      .list()
      .then((res) => setMilestones((res.milestones as Milestone[]) || []))
      .catch(() => setMilestones([]))
      .finally(() => setLoading(false));
  }, [isContributor]);

  const handleMarkComplete = async (id: string) => {
    setUpdating(id);
    try {
      await marketplaceApi.milestones.patch(id, { status: "Completed" });
      toast({ title: "Marked complete", description: "Startup can now submit for funding." });
      const res = await marketplaceApi.milestones.list();
      setMilestones((res.milestones as Milestone[]) || []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  if (user != null && !isContributor) {
    return null;
  }
  if (!isContributor) {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                  <Store className="w-6 h-6" />
                </span>
                Marketplace — Milestones
              </h1>
              <p className="text-muted-foreground mt-2">
                Milestones assigned to you appear when you are logged in as a contributor.
              </p>
            </div>
            <Link
              href="/marketplace/startups"
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline shrink-0"
            >
              Browse Startups →
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <span className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted text-muted-foreground">
                <Target className="w-8 h-8" />
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">For contributors only</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Apply to startups from the Startups page to get hired and receive milestone assignments.
            </p>
            <Link
              href="/marketplace/startups"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Browse Startups
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </AllRolesProtected>
    );
  }

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header – same layout as Marketplace Startups */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <Target className="w-6 h-6" />
              </span>
              My milestones
            </h1>
            <p className="text-muted-foreground mt-2">
              Milestones assigned to you by startups. Mark complete when you finish the work.
            </p>
          </div>
          <Link
            href="/marketplace/startups"
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline shrink-0"
          >
            Browse Startups →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-card border border-border overflow-hidden animate-pulse">
                <div className="h-24 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <span className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted text-muted-foreground">
                <Target className="w-8 h-8" />
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No milestones assigned yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Get hired by a startup from the Startups page. Once they assign you a milestone, it will appear here.
            </p>
            <Link
              href="/marketplace/startups"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Browse Startups
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => (
              <li key={m._id}>
                <article className="h-full rounded-lg shadow-md bg-card dark:bg-zinc-800 border border-border overflow-hidden flex flex-col">
                  {/* Card header with status badge */}
                  <div className="relative h-20 bg-gradient-to-br from-green-500/10 via-muted/50 to-muted flex items-center justify-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[m.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <h2 className="font-semibold text-lg text-foreground line-clamp-2">
                      {m.title}
                    </h2>
                    {m.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                        {m.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{getStartupName(m.startupId)}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      {m.status === "In Progress" && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleMarkComplete(m._id)}
                          disabled={updating === m._id}
                        >
                          {updating === m._id ? "Updating…" : "Mark complete"}
                        </Button>
                      )}
                      {m.status === "Completed" && (
                        <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          Completed — startup will submit for funding
                        </p>
                      )}
                      {(m.status === "Submitted" || m.status === "Paid") && (
                        <p className="text-sm text-muted-foreground">{m.status}</p>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-muted-foreground">
          <Link href="/marketplace/startups" className="text-green-600 dark:text-green-400 hover:underline">
            Browse Startups →
          </Link>
        </p>
      </div>
    </AllRolesProtected>
  );
}
