"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AdminProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CheckCircle, History, Clock, Banknote } from "lucide-react";
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

  const handleApprove = async (milestoneId: string) => {
    setUpdating(milestoneId);
    try {
      await marketplaceApi.milestones.patch(milestoneId, { status: "Paid" });
      toast({ title: "Approved", description: "Payment recorded; startup has received the fund." });
      loadMilestones();
      loadPayments();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (milestoneId: string) => {
    setUpdating(milestoneId);
    try {
      await marketplaceApi.milestones.patch(milestoneId, { status: "Rejected" });
      toast({ title: "Rejected", description: "Milestone funding rejected." });
      loadMilestones();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const submitted = milestones.filter((m) => m.status === "Submitted");
  const paid = milestones.filter((m) => m.status === "Paid");
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <AdminProtected>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
              <DollarSign className="w-6 h-6" />
            </span>
            Funding
          </h1>
          <p className="text-muted-foreground pl-[52px]">
            Startups submit completed milestones for funding. Approve to release payment or Reject.
          </p>
        </div>

        {loading ? (
          <Card className="rounded-xl">
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading milestones…
            </CardContent>
          </Card>
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
                    <p className="text-2xl font-bold text-foreground">{submitted.length}</p>
                    <p className="text-sm text-muted-foreground">Submitted (awaiting decision)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{paid.length}</p>
                    <p className="text-sm text-muted-foreground">Paid milestones</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
                    <Banknote className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total paid</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submitted — Approve or Reject */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Submitted for funding ({submitted.length})
              </h2>
              {submitted.length > 0 ? (
                <ul className="space-y-4">
                  {submitted.map((m) => (
                    <li key={m._id} className="rounded-xl border border-border bg-card p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{m.title}</h3>
                        {m.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium text-foreground">{Number(m.amount).toLocaleString()}</span>
                          <span className="mx-1.5">·</span>
                          {getStartupName(m)}
                          {(m as Milestone & { submittedAt?: string }).submittedAt && (
                            <>
                              <span className="mx-1.5">·</span>
                              Submitted {new Date((m as Milestone & { submittedAt?: string }).submittedAt).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => handleReject(m._id)}
                          disabled={updating === m._id}
                        >
                          {updating === m._id ? "…" : "Reject"}
                        </Button>
                        <Button
                          onClick={() => handleApprove(m._id)}
                          disabled={updating === m._id}
                        >
                          {updating === m._id ? "…" : "Approve & pay"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Card className="rounded-xl border-dashed">
                  <CardContent className="py-6 px-4 text-center text-muted-foreground text-sm">
                    No milestones submitted yet. Startups complete milestones, then submit for funding; they will appear here.
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Paid milestones */}
            {paid.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Paid ({paid.length})
                </h2>
                <ul className="space-y-4">
                  {paid.map((m) => (
                    <li key={m._id} className="rounded-xl border border-border bg-card p-5 flex flex-wrap items-center justify-between gap-4 opacity-95">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">{m.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">{Number(m.amount).toLocaleString()}</span>
                          <span className="mx-1.5">·</span>
                          {getStartupName(m)}
                          {m.paidAt && (
                            <>
                              <span className="mx-1.5">·</span>
                              Paid {new Date(m.paidAt).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* No milestones at all */}
            {milestones.length === 0 && (
              <Card className="rounded-xl border-dashed">
                <CardContent className="py-12 px-6 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium">No completed milestones yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Startups assign milestones to contributors, contributors mark complete, then startups submit for funding. Submitted milestones appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Payment history */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            Payment history
          </h2>
          {paymentsLoading ? (
            <Card className="rounded-xl">
              <CardContent className="py-6 text-center text-muted-foreground text-sm">
                Loading payment history…
              </CardContent>
            </Card>
          ) : payments.length === 0 ? (
            <Card className="rounded-xl border-dashed">
              <CardContent className="py-6 px-4 text-center text-muted-foreground text-sm">
                No payments recorded yet. Use &quot;Approve & pay&quot; on a submitted milestone to record a payment.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {payments.map((p) => (
                <li key={p._id} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{p.milestoneTitle}</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{Number(p.amount).toLocaleString()}</span>
                    <span>{p.startupName || "—"}</span>
                    {p.paidAt && <span>{new Date(p.paidAt).toLocaleDateString()}</span>}
                    {p.payment_info?.paymentMethod && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{p.payment_info.paymentMethod}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminProtected>
  );
}
