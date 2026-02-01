"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
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

export default function StartupFundingPage() {
  const [payments, setPayments] = useState<MilestonePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await marketplaceApi.milestonePayment.list();
        setPayments((res.payments as MilestonePayment[]) || []);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
        <DollarSign className="w-7 h-7 text-green-600" />
        Funding received
      </h1>
      <p className="text-muted-foreground mb-6">
        Payments released by admin for your completed milestones. Stripe integration can be added later.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No payments yet. Complete milestones and have admin approve funding from Admin → Funding.
            <div className="mt-4">
              <Link href="/startup/milestones" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                Go to Milestones →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card p-4 mb-6">
            <p className="text-sm text-muted-foreground">Total received</p>
            <p className="text-2xl font-bold text-foreground">{Number(totalReceived).toLocaleString()}</p>
          </div>
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p._id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{p.milestoneTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.paidAt && new Date(p.paidAt).toLocaleDateString()}
                    {p.payment_info?.paymentMethod && ` · ${p.payment_info.paymentMethod}`}
                  </p>
                </div>
                <span className="font-semibold text-foreground">{Number(p.amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/startup/milestones" className="text-green-600 dark:text-green-400 hover:underline">
          View Milestones →
        </Link>
      </p>
    </div>
  );
}
