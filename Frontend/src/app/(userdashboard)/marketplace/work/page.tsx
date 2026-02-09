"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AllRolesProtected } from "@/components/RoleProtected";
import Link from "next/link";
import { Building2, DollarSign, Briefcase, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WithdrawSection } from "@/components/marketplace/WithdrawSection";

type Application = {
  _id: string;
  startupId: { _id: string; startupName?: string; firstName?: string; lastName?: string; email?: string } | string;
  status: string;
};

type Payout = {
  _id: string;
  amount: number;
  startupId?: { startupName?: string; firstName?: string; lastName?: string };
  milestoneId?: { title?: string };
  note?: string;
  paidAt?: string;
  createdAt: string;
};

function getStartupName(s: Application["startupId"]): string {
  if (typeof s !== "object" || !s) return "—";
  if ("startupName" in s && s.startupName) return s.startupName as string;
  if ("firstName" in s || "lastName" in s)
    return [s.firstName, s.lastName].filter(Boolean).join(" ") || (s.email as string) || "Startup";
  return "Startup";
}

function getStartupId(s: Application["startupId"]): string {
  if (typeof s !== "object" || !s || !("_id" in s)) return "";
  return s._id as string;
}

export default function MarketplaceWorkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [applications, setApplications] = useState<Application[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
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
      const [appRes, payRes] = await Promise.all([
        marketplaceApi.applications.list(),
        marketplaceApi.contributorPayout.list(),
      ]);
      setApplications((appRes.applications as Application[]) || []);
      setPayouts((payRes.payouts as Payout[]) || []);
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-green-600 dark:text-green-400" />
            My work
          </h1>
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Only contributors have a work dashboard. Register as a contributor to see your connected startup and earnings.
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
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </AllRolesProtected>
    );
  }

  const acceptedApp = applications.find((a) => a.status === "accepted");
  const connectedStartupName = acceptedApp ? getStartupName(acceptedApp.startupId) : null;
  const connectedStartupId = acceptedApp ? getStartupId(acceptedApp.startupId) : null;
  const totalReceived = payouts.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
              <Briefcase className="w-6 h-6" />
            </span>
            My work
          </h1>
          <p className="text-muted-foreground mt-2">
            Your connected startup, engagement details, and payouts you receive.
          </p>
        </div>

        {/* Connected startup */}
        <section>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Connected startup
          </h2>
          {!acceptedApp ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
              You are not hired by any startup yet. Apply from the marketplace and get accepted to see your work here.
              <div className="mt-4">
                <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                  Browse Startups →
                </Link>
                <span className="mx-2">·</span>
                <Link href="/marketplace/my-applications" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                  My applications
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{connectedStartupName}</p>
                <p className="text-sm text-muted-foreground">You were accepted to work with this startup.</p>
              </div>
              <Link href={`/marketplace/startups/${connectedStartupId}`}>
                <span className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline">
                  View startup <ExternalLink className="w-4 h-4" />
                </span>
              </Link>
            </div>
          )}
        </section>

        {/* Withdraw to bank */}
        <section>
          <WithdrawSection />
        </section>

        {/* My earnings */}
        <section>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            My earnings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total received (payouts)</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalReceived.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Payouts recorded</p>
              <p className="text-2xl font-bold text-foreground mt-1">{payouts.length}</p>
            </div>
          </div>
          {payouts.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Payout history</p>
              <ul className="space-y-2">
                {payouts.map((p) => (
                  <li key={p._id} className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {(p.startupId as { startupName?: string })?.startupName || "Startup"} · {Number(p.amount).toLocaleString()}
                      </p>
                      {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                      <p className="text-xs text-muted-foreground">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </AllRolesProtected>
  );
}
