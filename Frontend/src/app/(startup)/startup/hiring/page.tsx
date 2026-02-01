"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Application = {
  _id: string;
  startupId: unknown;
  contributorId: { _id: string; email?: string; firstName?: string; lastName?: string } | string;
  status: string;
  coverMessage?: string;
  createdAt: string;
};

function getContributorName(c: Application["contributorId"]): string {
  if (typeof c !== "object" || !c) return "—";
  const first = "firstName" in c ? (c.firstName as string) : "";
  const last = "lastName" in c ? (c.lastName as string) : "";
  const email = "email" in c ? (c.email as string) : "";
  return [first, last].filter(Boolean).join(" ") || email || "—";
}

export default function StartupHiringPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await marketplaceApi.applications.list();
      setApplications((res.applications as Application[]) || []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (applicationId: string) => {
    setUpdating(applicationId);
    try {
      await marketplaceApi.applications.patch(applicationId, { status: "accepted" });
      toast({ title: "Accepted", description: "Contributor accepted." });
      load();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    setUpdating(applicationId);
    try {
      await marketplaceApi.applications.patch(applicationId, { status: "rejected" });
      toast({ title: "Rejected", description: "Application rejected." });
      load();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading applications…</p>;

  const pending = applications.filter((a) => a.status === "pending");
  const other = applications.filter((a) => a.status !== "pending");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Hiring</h1>
      <p className="text-muted-foreground mb-6">Review and accept or reject applications from contributors who want to work with your startup.</p>

      {applications.length === 0 ? (
        <p className="text-muted-foreground">No applications yet. Contributors apply to your startup from the marketplace Startups page.</p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-2">Pending ({pending.length})</h2>
              <ul className="space-y-3">
                {pending.map((a) => (
                  <li key={a._id} className="rounded-lg border border-border bg-card p-4">
                    <p className="font-medium text-foreground">Applicant: {getContributorName(a.contributorId)}</p>
                    {a.coverMessage && <p className="text-sm text-muted-foreground mt-1">{a.coverMessage}</p>}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => handleAccept(a._id)} disabled={updating === a._id}>
                        {updating === a._id ? "…" : "Accept"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(a._id)} disabled={updating === a._id}>
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {other.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-2">Other</h2>
              <ul className="space-y-2">
                {other.map((a) => (
                  <li key={a._id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                    <span>{getContributorName(a.contributorId)}</span>
                    <span className="text-sm text-muted-foreground">{a.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/startup/milestones" className="text-green-600 dark:text-green-400 hover:underline">View milestones</Link> to manage your work and mark them complete.
      </p>
    </div>
  );
}
