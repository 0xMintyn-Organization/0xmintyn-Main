"use client";

import { useEffect, useState } from "react";
import { stripeApi, type StripeBalance, type Withdrawal } from "@/lib/stripeApi";
import { StripeConnectOnboarding } from "./StripeConnectOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowDownToLine, History, Loader2, ExternalLink, Building2 } from "lucide-react";
import { format } from "date-fns";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function WithdrawSection() {
  const [balance, setBalance] = useState<StripeBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [balRes, wRes] = await Promise.all([
        stripeApi.getBalance(),
        stripeApi.listWithdrawals(),
      ]);
      setBalance(balRes);
      setWithdrawals(wRes.withdrawals || []);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) {
      toast({ title: "Error", description: "Enter at least $1.00", variant: "destructive" });
      return;
    }
    const availableDollars = (balance?.available ?? 0) / 100;
    if (amt > availableDollars) {
      toast({ title: "Error", description: `Available balance is ${formatCurrency((balance?.available ?? 0))}`, variant: "destructive" });
      return;
    }
    setWithdrawing(true);
    try {
      await stripeApi.withdraw(amt);
      toast({ title: "Withdrawal started", description: "Funds will arrive in 2–3 business days." });
      setAmount("");
      load();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const { url } = await stripeApi.getDashboardLink();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoadingDashboard(false);
    }
  };

  const formatBankAccount = (w: Withdrawal) => {
    if (w.bankName && w.last4) return `${w.bankName} •••• ${w.last4}`;
    if (w.last4) return `•••• ${w.last4}`;
    if (w.bankName) return w.bankName;
    return null;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "paid") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Paid</Badge>;
    if (s === "pending") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
    if (s === "failed" || s === "canceled") return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Withdraw to bank
        </CardTitle>
        <CardDescription>
          Withdraw your available balance to your connected bank account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!balance?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {balance?.message || "Connect your bank account to withdraw earnings."}
            </p>
            <StripeConnectOnboarding />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(balance.available)}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(balance.pending)}</p>
                <p className="text-xs text-muted-foreground mt-1">Arriving soon</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground">
                View payouts, bank account details, and full history in Stripe.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenStripeDashboard}
                disabled={loadingDashboard}
                className="gap-1.5"
              >
                {loadingDashboard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage payouts in Stripe
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  step={0.01}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing || balance.available < 100}
                  className="gap-2"
                >
                  {withdrawing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-4 h-4" />
                  )}
                  Withdraw
                </Button>
              </div>
              {balance.available < 100 && balance.available >= 0 && (
                <p className="text-xs text-muted-foreground">Minimum withdrawal is $1.00</p>
              )}
            </div>

            {withdrawals.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <History className="w-4 h-4" />
                  Withdrawal history
                </h4>
                <ul className="space-y-3">
                  {withdrawals.slice(0, 10).map((w) => (
                    <li
                      key={w._id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-border last:border-0"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">${Number(w.amount).toFixed(2)}</span>
                        {formatBankAccount(w) && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {formatBankAccount(w)}
                          </span>
                        )}
                        {w.arrivalDate && w.status === "pending" && (
                          <span className="text-xs text-muted-foreground">
                            Est. arrival: {format(new Date(w.arrivalDate * 1000), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(w.status)}
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(w.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
