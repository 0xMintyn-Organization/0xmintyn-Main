"use client";

import { useState, useEffect, ReactNode } from "react";
import { StripeConnectOnboarding } from "@/components/marketplace/StripeConnectOnboarding";
import { BookOpen, Loader2 } from "lucide-react";
import { stripeApi } from "@/lib/stripeApi";

type Props = {
  children: ReactNode;
  /** Shown when Stripe must be connected (instructor case) */
  gateTitle?: string;
  gateDescription?: string;
};

/**
 * Gates course creation until instructor has Stripe Connect active.
 * Admin users (403 from Stripe API) are allowed through.
 */
export function StripeGateForInstructor({ children, gateTitle = "Connect your bank account to create courses", gateDescription = "You must complete Stripe onboarding before you can create courses. This ensures you can receive payments from students." }: Props) {
  const [canProceed, setCanProceed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await stripeApi.getStatus();
        if (cancelled) return;
        const isFullyConnected = res.connected && res.chargesEnabled && res.payoutsEnabled;
        setCanProceed(isFullyConnected);
      } catch (e) {
        if (cancelled) return;
        const msg = (e as Error).message || "";
        if (msg.includes("403") || msg.includes("Only instructors") || msg.includes("User not found")) {
          setCanProceed(true);
        } else {
          setCanProceed(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (canProceed === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm">Checking payment setup…</p>
        </div>
      </div>
    );
  }

  if (!canProceed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{gateTitle}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{gateDescription}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-zinc-700 pt-6">
              <StripeConnectOnboarding label="Receive course sales" className="text-base" />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              After connecting your bank account and completing verification, you’ll be able to create and publish courses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
