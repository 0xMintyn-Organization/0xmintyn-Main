"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Card, CardContent } from "@/components/ui/card";
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
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  if (marketplaceRole !== "contributor") {
    return (
      <AllRolesProtected>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-7 h-7 text-green-600" />
            My applications
          </h1>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Only contributors have applications. Register or switch to a contributor account to see your applications to startups here.
              <div className="mt-4">
                <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                  Browse Startups →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AllRolesProtected>
    );
  }

  if (loading) {
    return (
      <AllRolesProtected>
        <p className="text-muted-foreground">Loading applications…</p>
      </AllRolesProtected>
    );
  }

  const pending = applications.filter((a) => a.status === "pending");
  const accepted = applications.filter((a) => a.status === "accepted");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <AllRolesProtected>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-green-600" />
            My applications
          </h1>
          <p className="text-muted-foreground mt-1">
            Applications you’ve sent to startups. Pending, accepted, and rejected are listed below.
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You haven’t applied to any startups yet. Browse startups and click “Apply to this startup” on a startup’s profile.
              <div className="mt-4">
                <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                  Browse Startups →
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2">Pending ({pending.length})</h2>
                <ul className="space-y-2">
                  {pending.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-card p-4">
                      <p className="font-medium text-foreground">{getStartupName(a.startupId)}</p>
                      <p className="text-sm text-muted-foreground">Status: {a.status}</p>
                      {a.coverMessage && <p className="text-sm mt-2">{a.coverMessage}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {accepted.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2">Accepted ({accepted.length})</h2>
                <ul className="space-y-2">
                  {accepted.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-card p-4">
                      <p className="font-medium text-foreground">{getStartupName(a.startupId)}</p>
                      <p className="text-sm text-muted-foreground">Status: {a.status}</p>
                      {a.coverMessage && <p className="text-sm mt-2">{a.coverMessage}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {rejected.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2">Rejected ({rejected.length})</h2>
                <ul className="space-y-2">
                  {rejected.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-card p-4 opacity-80">
                      <p className="font-medium text-foreground">{getStartupName(a.startupId)}</p>
                      <p className="text-sm text-muted-foreground">Status: {a.status}</p>
                      {a.coverMessage && <p className="text-sm mt-2">{a.coverMessage}</p>}
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
