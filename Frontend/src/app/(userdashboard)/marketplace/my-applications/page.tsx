"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Store, FileCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type Application = {
  _id: string;
  startupId: { _id: string; startupName?: string; firstName?: string; lastName?: string; email?: string } | string;
  status: string;
  coverMessage?: string;
  createdAt?: string;
};

function getStartupName(s: Application["startupId"]): string {
  if (typeof s === "object" && s && "startupName" in s && s.startupName) return s.startupName as string;
  if (typeof s === "object" && s && ("firstName" in s || "lastName" in s))
    return [s.firstName, s.lastName].filter(Boolean).join(" ") || (s.email as string) || "Startup";
  return "Startup";
}

export default function MarketplaceMyApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user != null && marketplaceRole !== "contributor") {
      router.replace("/marketplace/startups");
    }
  }, [user, marketplaceRole, router]);

  const load = async () => {
    if (marketplaceRole !== "contributor") {
      setLoading(false);
      return;
    }
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
  }, [marketplaceRole]);

  if (user != null && marketplaceRole !== "contributor") {
    return null;
  }
  if (marketplaceRole !== "contributor") {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
              <FileCheck className="w-6 h-6" />
            </span>
            My applications
          </h1>
          <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-8 text-center text-muted-foreground shadow-sm">
              Only contributors have applications. Register as a contributor to see your applications to startups here.
              <div className="mt-4">
                <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                  Browse Startups →
                </Link>
              </div>
          </div>
        </div>
      </AllRolesProtected>
    );
  }

  if (loading) {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading applications…</p>
        </div>
      </AllRolesProtected>
    );
  }

  const pending = applications.filter((a) => a.status === "pending");
  const accepted = applications.filter((a) => a.status === "accepted");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <FileCheck className="w-6 h-6" />
              </span>
              My applications
            </h1>
            <p className="text-muted-foreground mt-2">
            Applications you’ve sent to startups. Pending, accepted, and rejected are listed below.
          </p>
          </div>
          <Link href="/marketplace/startups" className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline shrink-0">
            Browse Startups →
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-8 text-center text-muted-foreground shadow-sm">
              You haven’t applied to any startups yet. Browse startups and click “Apply to this startup” on a startup’s profile.
            <div className="mt-4">
              <Link href="/marketplace/startups" className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline">
                Browse Startups →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Pending ({pending.length})</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pending.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm space-y-2">
                      <p className="font-semibold text-foreground">{getStartupName(a.startupId)}</p>
                      <p className="text-sm text-muted-foreground">Status: {a.status}</p>
                      {a.coverMessage && <p className="text-sm text-foreground/90 mt-2">{a.coverMessage}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {accepted.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Accepted ({accepted.length})</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accepted.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm space-y-2">
                      <p className="font-semibold text-foreground">{getStartupName(a.startupId)}</p>
                      <p className="text-sm text-muted-foreground">Status: {a.status}</p>
                      {a.coverMessage && <p className="text-sm text-foreground/90 mt-2">{a.coverMessage}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {rejected.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Rejected ({rejected.length})</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rejected.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm space-y-2 opacity-80">
                      <p className="font-semibold text-foreground">{getStartupName(a.startupId)}</p>
                      <p className="text-sm text-muted-foreground">Status: {a.status}</p>
                      {a.coverMessage && <p className="text-sm text-foreground/90 mt-2">{a.coverMessage}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
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
