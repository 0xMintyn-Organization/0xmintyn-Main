"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import Spinner from "@/components/Spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";

const userSchema = z
  .object({
    marketplace_role: z.enum(["startup", "contributor"], { required_error: "Please choose how you want to sign up" }),
    startupName: z.string().optional(),
    startupDescription: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    username: z.string().min(5, "Username must be at least 5 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contactNumber: z.string().min(1, "Please enter your contact number"),
    nationality: z.string().min(1, "Please enter your nationality"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
  })
  .refine((data) => data.marketplace_role !== "startup" || (data.startupName && data.startupName.trim().length > 0), {
    message: "Startup name is required when signing up as a startup",
    path: ["startupName"],
  });

export default function RegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registerUser, { data, error, isSuccess }] = useRegisterMutation();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    mode: "onChange",
    defaultValues: {
      marketplace_role: undefined as "startup" | "contributor" | undefined,
      startupName: "",
      startupDescription: "",
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      contactNumber: "",
      nationality: "",
      dateOfBirth: "",
    },
  });

  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (isSuccess) {
      setIsSubmitting(false);
      setRegisterError(null);
      toast({ title: "Success", description: data?.message || "Registered successfully", variant: "default" });
      router.push("/verification");
    }
    if (error) {
      setIsSubmitting(false);
      const msg = (error as { data?: { message?: string } })?.data?.message || "Registration failed";
      setRegisterError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [isSuccess, error, data, router, toast]);

  const onSubmit = useCallback(
    async (values: z.infer<typeof userSchema>) => {
      setIsSubmitting(true);
      setRegisterError(null);
      try {
        const age = values.dateOfBirth
          ? Math.max(0, new Date().getFullYear() - new Date(values.dateOfBirth).getFullYear())
          : 0;
        const payload: Record<string, unknown> = {
          marketplace_role: values.marketplace_role,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          username: values.username,
          password: values.password,
          contactNumber: values.contactNumber,
          nationality: values.nationality,
          dateOfBirth: values.dateOfBirth,
          age,
        };
        if (values.marketplace_role === "startup") {
          if (values.startupName?.trim()) payload.startupName = values.startupName.trim();
          if (values.startupDescription?.trim()) payload.startupDescription = values.startupDescription.trim();
        }
        await registerUser(payload).unwrap();
      } catch {
        setIsSubmitting(false);
      }
    },
    [registerUser]
  );

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 flex items-center justify-center mb-3">
            <img src="/logo.png" alt="Equalmint Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            Equalmint
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Community Hub</p>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create your account</h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label="Registration form" noValidate>
            <FormField
              control={form.control}
              name="marketplace_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">I want to sign up as</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("startup")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          field.value === "startup"
                            ? "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-500"
                        }`}
                      >
                        <span className="font-semibold">Startup</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">I'm building a venture</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("contributor")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          field.value === "contributor"
                            ? "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-500"
                        }`}
                      >
                        <span className="font-semibold">Contributor</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">I want to contribute</span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {form.watch("marketplace_role") === "startup" && (
              <>
                <FormField
                  control={form.control}
                  name="startupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startup name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Acme Inc."
                          {...field}
                          autoComplete="organization"
                          className={form.formState.errors.startupName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
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
                        <Input
                          placeholder="Brief description of your venture"
                          {...field}
                          className={form.formState.errors.startupDescription ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
              </>
            )}

            {registerError && (
              <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{registerError}</span>
                  <button
                    type="button"
                    onClick={() => setRegisterError(null)}
                    className="ml-2 hover:bg-red-100 dark:hover:bg-red-900 rounded p-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} autoComplete="given-name" className={form.formState.errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} autoComplete="family-name" className={form.formState.errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} autoComplete="email" className={form.formState.errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Choose a username (min 5 characters)" {...field} autoComplete="username" className={form.formState.errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +1 234 567 8900" {...field} autoComplete="tel" className={form.formState.errors.contactNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. United States" {...field} autoComplete="country-name" className={form.formState.errors.nationality ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} max={new Date().toISOString().split("T")[0]} className={`text-gray-700 dark:text-gray-300 ${form.formState.errors.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (min 6 characters)"
                        {...field}
                        autoComplete="new-password"
                        className={form.formState.errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full bg-green-700 hover:bg-green-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#2190ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2190ff] focus:ring-offset-2 rounded px-1"
            aria-label="Go to login page"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  );
}
