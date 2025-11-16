"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useActivationMutation } from "@/redux/features/auth/authApi";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ActivationLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [activateByLink, { isLoading, isSuccess, error }] = useActivationMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid activation link",
        description: "No activation token provided.",
        variant: "destructive",
      });
      return;
    }

    // Call backend link-based activation endpoint
    activateByLink({ activation_token: token, activation_code: null });
  }, [token, activateByLink, toast]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Account Activated",
        description: "Your account has been successfully activated. You can now log in.",
      });
      router.push("/login");
    }

    if (error && "data" in (error as any)) {
      const err = error as any;
      toast({
        title: "Activation Failed",
        description: err.data?.error || err.data?.message || "Failed to activate account.",
        variant: "destructive",
      });
    }
  }, [isSuccess, error, toast, router]);

  if (!token || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner text="Activating your account..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Activation Link</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          We attempted to activate your account using the link. If nothing happened, please try again.
        </p>
        <Button
          className="w-full bg-green-700 hover:bg-green-800 text-white"
          onClick={() => token && activateByLink({ activation_token: token, activation_code: null })}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}


