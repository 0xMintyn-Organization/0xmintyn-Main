"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { getPostLoginPath } from "@/lib/onboarding";
import { updateUser } from "@/redux/features/auth/authSlice";
import Spinner from "@/components/Spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Rocket, Handshake, BookOpen, GraduationCap } from "lucide-react";

const schema = z
  .object({
    signup_type: z.enum(["startup", "contributor", "student", "instructor"], { required_error: "Please choose how you'll use the platform" }),
    startupName: z.string().optional(),
    startupDescription: z.string().optional(),
    instructorHeadline: z.string().optional(),
    instructorBio: z.string().optional(),
  })
  .refine((data) => data.signup_type !== "startup" || (data.startupName && data.startupName.trim().length > 0), {
    message: "Startup name is required when choosing Startup",
    path: ["startupName"],
  });

type FormValues = z.infer<typeof schema>;

const roleCards = [
  { value: "startup" as const, label: "Startup", desc: "I'm building a venture", Icon: Rocket },
  { value: "contributor" as const, label: "Contributor", desc: "I want to contribute", Icon: Handshake },
  { value: "student" as const, label: "Student", desc: "I want to learn", Icon: BookOpen },
  { value: "instructor" as const, label: "Instructor", desc: "I want to teach", Icon: GraduationCap },
];

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      signup_type: undefined,
      startupName: "",
      startupDescription: "",
      instructorHeadline: "",
      instructorBio: "",
    },
  });

  const signupType = form.watch("signup_type");

  useEffect(() => {
    if (user && (user as { roleProfileCompleted?: boolean }).roleProfileCompleted !== false) {
      router.replace(getPostLoginPath(user));
    }
  }, [user, router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await marketplaceApi.completeProfile({
        signup_type: values.signup_type,
        startupName: values.signup_type === "startup" ? values.startupName?.trim() : undefined,
        startupDescription: values.signup_type === "startup" ? values.startupDescription?.trim() : undefined,
        instructorHeadline: values.signup_type === "instructor" ? values.instructorHeadline?.trim() : undefined,
        instructorBio: values.signup_type === "instructor" ? values.instructorBio?.trim() : undefined,
      });
      dispatch(updateUser(res.user));
      if (typeof window !== "undefined") window.localStorage.setItem("user", JSON.stringify(res.user));
      toast({ title: "Profile completed", description: "You can now use the platform.", variant: "default" });
      router.replace(getPostLoginPath(res.user as { marketplace_role?: string; startupName?: string }));
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <Spinner />;
  if ((user as { roleProfileCompleted?: boolean }).roleProfileCompleted !== false) return <Spinner />;

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Complete your profile</h1>
        <p className="text-muted-foreground mt-1">You signed in with a social account. Choose how you&apos;ll use the platform (same as registration).</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="signup_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">I want to use the platform as</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-3">
                    {roleCards.map(({ value, label, desc, Icon }) => {
                      const isSelected = field.value === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={`
                            flex flex-col items-center justify-center min-h-[88px] p-4 rounded-xl border-2 transition-all
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
                            ${isSelected
                              ? "border-green-600 bg-green-50 dark:bg-green-900/25 text-green-800 dark:text-green-200"
                              : "border-border bg-card hover:border-zinc-300 dark:hover:border-zinc-500 text-foreground"
                            }
                          `}
                        >
                          <Icon className={`w-6 h-6 mb-1.5 ${isSelected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                          <span className="font-semibold text-sm">{label}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />

          {signupType === "startup" && (
            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/30">
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
                    <FormLabel>Startup description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of your venture" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
            </div>
          )}

          {signupType === "instructor" && (
            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/30">
              <FormField
                control={form.control}
                name="instructorHeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Full-stack developer & mentor" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instructorBio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Short bio about your teaching experience" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
            </div>
          )}

          <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            {submitting ? "Saving…" : "Continue"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
