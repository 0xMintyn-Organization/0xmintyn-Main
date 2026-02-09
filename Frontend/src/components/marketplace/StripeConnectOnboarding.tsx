"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { stripeApi, type StripeConnectStatus } from "@/lib/stripeApi";
import { useToast } from "@/hooks/use-toast";

type Props = {
  /** e.g. "Receive milestone funding", "Receive salary", "Receive course sales" */
  label?: string;
  className?: string;
};

export function StripeConnectOnboarding({ label = "Receive payments", className = "" }: Props) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const res = await stripeApi.getStatus();
      setStatus(res);
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg.includes("403") || msg.includes("Only instructors") || msg.includes("User not found")) {
        setStatus(null);
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCreateAndConnect = async () => {
    setConnecting(true);
    try {
      await stripeApi.createConnectAccount();
      const linkRes = await stripeApi.getOnboardingLink();
      if (linkRes.url) {
        window.location.href = linkRes.url;
        return;
      }
      toast({ title: "Error", description: "Could not get onboarding link", variant: "destructive" });
      fetchStatus();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      fetchStatus();
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const linkRes = await stripeApi.getOnboardingLink();
      if (linkRes.url) {
        window.location.href = linkRes.url;
        return;
      }
      toast({ title: "Error", description: "Could not get onboarding link", variant: "destructive" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking payment setup…</span>
      </div>
    );
  }

  // Not eligible or error
  if (!status) {
    return null;
  }

  const isFullyConnected = status.connected && status.chargesEnabled && status.payoutsEnabled;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <CreditCard className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      {isFullyConnected ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400 ring-1 ring-green-500/20">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Connected – you can receive payments
          </span>
        </div>
      ) : status.connected && status.detailsSubmitted ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Verification in progress. Re-open the link below if Stripe asked for more info or if your session expired.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={connecting}
            onClick={handleConnect}
            className="gap-2"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Re-onboard / complete verification
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Connect your bank account to receive payments securely via Stripe.
          </p>
          <Button
            size="sm"
            disabled={connecting}
            onClick={status.accountId ? handleConnect : handleCreateAndConnect}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {status.accountId ? "Complete setup" : "Connect bank account"}
          </Button>
        </div>
      )}
    </div>
  );
}
