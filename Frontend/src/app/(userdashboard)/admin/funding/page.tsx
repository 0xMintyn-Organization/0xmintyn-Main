"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AdminProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CheckCircle, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  completedAt?: string;
  paidAt?: string;
  startupId?: { _id?: string; startupName?: string; email?: string; firstName?: string; lastName?: string };
};

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

function getStartupName(m: Milestone): string {
  const s = m.startupId;
  if (!s || typeof s !== "object") return "—";
  if ("startupName" in s && s.startupName) return s.startupName as string;
  if ("firstName" in s || "lastName" in s) return [s.firstName, s.lastName].filter(Boolean).join(" ") || (s.email as string) || "—";
  return (s.email as string) || "—";
}

export default function AdminFundingPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [payments, setPayments] = useState<MilestonePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMilestones = async () => {
    try {
      const res = await marketplaceApi.milestones.list();
      setMilestones((res.milestones as Milestone[]) || []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await marketplaceApi.milestonePayment.list();
      setPayments((res.payments as MilestonePayment[]) || []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  useEffect(() => {
    loadPayments();
  }, []);

  const handlePayAndProceed = async (milestoneId: string) => {
    setUpdating(milestoneId);
    try {
      await marketplaceApi.milestones.patch(milestoneId, { status: "Paid" });
      toast({ title: "Paid", description: "Payment recorded; startup has received the fund." });
      loadMilestones();
      loadPayments();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const completed = milestones.filter((m) => m.status === "Completed");
  const paid = milestones.filter((m) => m.status === "Paid");

  return (
    <AdminProtected>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Funding
          </h1>
          <p className="text-muted-foreground mt-1">
            Completed milestones appear below. Click &quot;Paid & proceed&quot; to mark as paid and create a payment record in history (like course purchase). Stripe can be added later.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            {completed.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Awaiting payment ({completed.length})
                </h2>
                <ul className="space-y-3">
                  {completed.map((m) => (
                    <li key={m._id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-foreground">{m.title}</h3>
                        {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                        <p className="text-sm mt-1">
                          Amount: {Number(m.amount).toLocaleString()} · Startup: {getStartupName(m)}
                          {m.completedAt && ` · Completed: ${new Date(m.completedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        onClick={() => handlePayAndProceed(m._id)}
                        disabled={updating === m._id}
                      >
                        {updating === m._id ? "…" : "Paid & proceed"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {paid.length > 0 && (
              <section>
                <h2 className="font-semibold text-foreground mb-2">Paid ({paid.length})</h2>
                <ul className="space-y-2">
                  {paid.map((m) => (
                    <li key={m._id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between opacity-90">
                      <span className="font-medium">{m.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {Number(m.amount).toLocaleString()} · {getStartupName(m)}
                        {m.paidAt && ` · Paid ${new Date(m.paidAt).toLocaleDateString()}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {milestones.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No completed milestones yet. Startups mark milestones complete from their Milestones page; then they appear here for payment.
                </CardContent>
              </Card>
            )}
          </>
        )}

        <section>
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <History className="w-4 h-4" />
            Payment history
          </h2>
          {paymentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading payment history…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet. Use &quot;Paid & proceed&quot; above to record a payment.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p._id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.milestoneTitle}</span>
                  <span className="text-muted-foreground">
                    {Number(p.amount).toLocaleString()} · {p.startupName || "—"}
                    {p.paidAt && ` · ${new Date(p.paidAt).toLocaleDateString()}`}
                    {p.payment_info?.paymentMethod && ` · ${p.payment_info.paymentMethod}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminProtected>
  );
}
