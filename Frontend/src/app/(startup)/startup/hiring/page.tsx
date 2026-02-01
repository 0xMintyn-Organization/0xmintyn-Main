"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { FileText, ExternalLink, DollarSign } from "lucide-react";

type Application = {
  _id: string;
  startupId: unknown;
  contributorId: { _id: string; email?: string; firstName?: string; lastName?: string } | string;
  status: string;
  coverMessage?: string;
  cvUrl?: string;
  monthlySalary?: number;
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
  const hired = applications.filter((a) => a.status === "accepted");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Hiring</h1>
      <p className="text-muted-foreground mb-6">Review and accept or reject applications from contributors who want to work with your startup.</p>

      {applications.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed border-border bg-card p-8 text-center">No applications yet. Contributors apply to your startup from the marketplace Startups page.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground">Pending ({pending.length})</h2>
              <ul className="space-y-3">
                {pending.map((a) => (
                  <li key={a._id} className="rounded-lg border border-border bg-card p-4">
                    <p className="font-medium text-foreground">Applicant: {getContributorName(a.contributorId)}</p>
                    {a.coverMessage && <p className="text-sm text-muted-foreground mt-1">{a.coverMessage}</p>}
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-foreground">
                        {a.monthlySalary != null && a.monthlySalary > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                            <span className="font-medium">Expected monthly salary:</span>
                            <span>{Number(a.monthlySalary).toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Expected monthly salary: Not specified</span>
                        )}
                      </p>
                      {a.cvUrl ? (
                        <a
                          href={a.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                        >
                          <FileText className="w-4 h-4 shrink-0" />
                          View CV / Resume (PDF)
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">CV / Resume: Not attached</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
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
          {hired.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground flex flex-wrap items-center gap-2">
                Hired ({hired.length})
                <Link href="/startup/team">
                  <Button variant="outline" size="sm">Team & payouts →</Button>
                </Link>
              </h2>
              <ul className="space-y-2">
                {hired.map((a) => (
                  <li key={a._id} className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">{getContributorName(a.contributorId)}</span>
                      {a.monthlySalary != null && a.monthlySalary > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">· {Number(a.monthlySalary).toLocaleString()}/mo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.cvUrl && (
                        <a
                          href={a.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 hover:underline"
                        >
                          <FileText className="w-4 h-4 shrink-0" />
                          View CV
                        </a>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Hired</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {rejected.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground">Rejected</h2>
              <ul className="space-y-2">
                {rejected.map((a) => (
                  <li key={a._id} className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{getContributorName(a.contributorId)}</span>
                    <span className="text-sm text-muted-foreground">{a.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/startup/team" className="text-green-600 dark:text-green-400 hover:underline mr-4">Team & payouts</Link>
        <Link href="/startup/milestones" className="text-green-600 dark:text-green-400 hover:underline">Milestones</Link>
      </p>
    </div>
  );
}
