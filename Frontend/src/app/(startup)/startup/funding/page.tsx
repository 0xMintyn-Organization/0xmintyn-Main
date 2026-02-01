"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MilestonePayment = {
  _id: string;
  milestoneId: unknown;
  startupId: unknown;
  amount: number;
  milestoneTitle: string;
  startupName?: string;
  status: string;
  payment_info?: { paymentMethod?: string; paymentStatus?: string; amount?: number; currency?: string };
  paidAt: string;
  createdAt?: string;
};

type Payout = { _id: string; amount: number };

export default function StartupFundingPage() {
  const [payments, setPayments] = useState<MilestonePayment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [payRes, payoutRes] = await Promise.all([
          marketplaceApi.milestonePayment.list(),
          marketplaceApi.contributorPayout.list(),
        ]);
        setPayments((payRes.payments as MilestonePayment[]) || []);
        setPayouts((payoutRes.payouts as Payout[]) || []);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const net = totalReceived - totalPaidOut;

  return (
    <div className="w-full space-y-8">
      <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
        <DollarSign className="w-7 h-7 text-green-600" />
        Funding & money
      </h1>
      <p className="text-muted-foreground mb-6">
        Funding received from admin for completed milestones; payouts you sent to contributors. Stripe can be added later.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Funding received
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{Number(totalReceived).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" />
              Paid to contributors
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{Number(totalPaidOut).toLocaleString()}</p>
            <Link href="/startup/team" className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block">Team & payouts →</Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Net (received − paid)
            </p>
            <p className={`text-2xl font-bold mt-1 ${net >= 0 ? "text-foreground" : "text-red-600 dark:text-red-400"}`}>
              {Number(net).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {!loading && payments.length === 0 && payouts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-10 text-center text-muted-foreground">
            No payments yet. Complete milestones and have admin approve funding from Admin → Funding.
            <div className="mt-4">
              <Link href="/startup/milestones" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                Go to Milestones →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : !loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="font-semibold text-foreground mb-3">Funding received (from admin)</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-card p-6 text-center">
                No funding received yet. Complete milestones and have admin approve from Admin → Funding.
              </p>
            ) : (
              <ul className="space-y-3">
                {payments.map((p) => (
                  <li key={p._id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{p.milestoneTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.paidAt && new Date(p.paidAt).toLocaleDateString()}
                        {p.payment_info?.paymentMethod && ` · ${p.payment_info.paymentMethod}`}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground shrink-0">{Number(p.amount).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-3">Payouts to contributors</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Record payouts from <Link href="/startup/team" className="text-green-600 dark:text-green-400 hover:underline">Team</Link>.
            </p>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-card p-6 text-center">
                No payouts recorded yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {payouts.map((p) => (
                  <li key={p._id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payout</span>
                    <span className="font-semibold text-foreground">{Number(p.amount).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/startup/milestones" className="text-green-600 dark:text-green-400 hover:underline">
                View Milestones →
              </Link>
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
