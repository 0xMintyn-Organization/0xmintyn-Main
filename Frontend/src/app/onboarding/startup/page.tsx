"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/userAuth";
import { useCompleteStartupOnboardingMutation } from "@/redux/features/auth/authApi";
import { getPostLoginPath } from "@/lib/onboarding";
import Spinner from "@/components/Spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  startupName: z.string().min(1, "Startup name is required"),
  startupDescription: z.string().optional(),
});

export default function OnboardingStartupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [completeOnboarding, { isLoading: submitting }] = useCompleteStartupOnboardingMutation();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { startupName: "", startupDescription: "" },
  });

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.marketplace_role !== "startup") {
      router.replace("/dashboard");
      return;
    }
    if (user.startupOnboardingComplete) {
      router.replace("/dashboard");
      return;
    }
    form.reset({
      startupName: (user as { startupName?: string }).startupName ?? "",
      startupDescription: (user as { startupDescription?: string }).startupDescription ?? "",
    });
  }, [user, authLoading, router]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await completeOnboarding({
        startupName: values.startupName.trim(),
        startupDescription: values.startupDescription?.trim() || undefined,
      }).unwrap();
      toast({ title: "Profile complete", description: "You can now access your startup dashboard." });
      router.push("/startup/dashboard");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err && typeof (err as { data?: { message?: string } }).data?.message === "string"
        ? (err as { data: { message: string } }).data.message
        : "Failed to complete onboarding";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (user.marketplace_role !== "startup") return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            Complete your startup profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Confirm your startup details to continue</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Startup name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startupDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Short description of your venture" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Complete and go to dashboard"}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
