"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import enrollmentService from "@/services/enrollmentService";
import equalUsdService from "@/services/equalUsdService";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type Props = {
  courseId: string;
  courseName: string;
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function CheckoutForm({
  courseId,
  paymentIntentId,
  onSuccess,
  onCancel,
}: {
  courseId: string;
  paymentIntentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?payment_success=1`,
          receipt_email: undefined,
        },
      });
      if (error) {
        toast({
          title: "Payment failed",
          description: error.message || "Could not complete payment",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const res = await enrollmentService.confirmEnroll(courseId, paymentIntentId);
      if (res.success) {
        toast({ title: "Success!", description: "You have been enrolled in this course!" });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: res.message || "Enrollment failed",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1 bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay & Enroll"}
        </Button>
      </div>
    </form>
  );
}

export function CoursePaymentCheckout({
  courseId,
  courseName,
  amount,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equalUsdBalance, setEqualUsdBalance] = useState<number>(0);
  const [equalUsdToUse, setEqualUsdToUse] = useState<number>(0);
  const [amountDue, setAmountDue] = useState<number>(amount);
  const [equalUsdApplied, setEqualUsdApplied] = useState<number>(0);
  const [step, setStep] = useState<"amount" | "payment">("amount");
  const { toast } = useToast();

  const maxEqualUsd = Math.min(Math.floor(amount), equalUsdBalance);

  useEffect(() => {
    if (!open || !courseId) return;
    setClientSecret(null);
    setPaymentIntentId(null);
    setError(null);
    setStep("amount");
    setEqualUsdToUse(0);
    setAmountDue(amount);
    setEqualUsdApplied(0);
    equalUsdService.getBalance().then((res) => {
      if (res.success && typeof res.balance === "number") setEqualUsdBalance(res.balance);
    }).catch(() => setEqualUsdBalance(0));
  }, [open, courseId, amount]);

  const handleApplyEqualUsd = () => {
    if (!open || !courseId) return;
    const toUse = Math.min(Math.max(0, equalUsdToUse), maxEqualUsd);
    setLoading(true);
    setError(null);
    enrollmentService.createPaymentIntent(courseId, toUse)
      .then((res) => {
        if (res.success && res.paidWithEqualUsdOnly) {
          handleSuccess("You have been enrolled using EqualUSD!");
          return;
        }
        if (res.success && res.clientSecret && res.paymentIntentId) {
          setClientSecret(res.clientSecret);
          setPaymentIntentId(res.paymentIntentId);
          setEqualUsdApplied(res.equalUsdApplied ?? toUse);
          setAmountDue(res.amountDue ?? Math.max(0, amount - toUse));
          setStep("payment");
        } else setError(res.message || "Could not create payment");
      })
      .catch((err) => setError(err?.response?.data?.message || err?.message || "Failed to start payment"))
      .finally(() => setLoading(false));
  };

  const handleSuccess = (message?: string) => {
    if (message) toast({ title: "Success!", description: message });
    onOpenChange(false);
    onSuccess();
  };

  const handleCancel = () => onOpenChange(false);

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <p className="text-destructive">
            Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete purchase</DialogTitle>
          <DialogDescription>
            {courseName} – ${amount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        {step === "amount" ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Course price: ${amount.toFixed(2)}</p>
              {equalUsdBalance > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Your EqualUSD balance: <span className="font-medium text-foreground">{equalUsdBalance}</span> (1 EqualUSD = $1)
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Use EqualUSD:</label>
                    <Input
                      type="number"
                      min={0}
                      max={maxEqualUsd}
                      value={equalUsdToUse || ""}
                      onChange={(e) => setEqualUsdToUse(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-20"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setEqualUsdToUse(maxEqualUsd)}>
                      Use max
                    </Button>
                  </div>
                  {equalUsdToUse > 0 && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-500">
                      Amount to pay: ${(Math.max(0, amount - equalUsdToUse)).toFixed(2)}
                    </p>
                  )}
                </>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="flex-1">Cancel</Button>
              <Button onClick={handleApplyEqualUsd} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : equalUsdToUse > 0 ? `Pay $${(Math.max(0, amount - equalUsdToUse)).toFixed(2)}` : "Continue to payment"}
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => { setError(null); setStep("amount"); }}>Back</Button>
            <Button variant="outline" onClick={handleCancel}>Close</Button>
          </div>
        ) : clientSecret && paymentIntentId ? (
          <div className="space-y-4">
            {equalUsdApplied > 0 && (
              <p className="text-sm text-green-600 dark:text-green-500">
                {equalUsdApplied} EqualUSD applied. Pay ${amountDue.toFixed(2)} via card.
              </p>
            )}
            <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <CheckoutForm
              courseId={courseId}
              paymentIntentId={paymentIntentId}
              onSuccess={() => handleSuccess()}
              onCancel={() => setStep("amount")}
            />
          </Elements>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
