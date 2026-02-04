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
import { AlertCircle, Eye, EyeOff, X, Rocket, Handshake, BookOpen, GraduationCap } from "lucide-react";

export type SignupType = "startup" | "contributor" | "student" | "instructor";

const userSchema = z
  .object({
    signup_type: z.enum(["startup", "contributor", "student", "instructor"], { required_error: "Please choose how you want to sign up" }),
    startupName: z.string().optional(),
    startupDescription: z.string().optional(),
    instructorHeadline: z.string().optional(),
    instructorBio: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    username: z.string().min(5, "Username must be at least 5 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contactNumber: z.string().min(1, "Please enter your contact number"),
    nationality: z.string().min(1, "Please enter your nationality"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
  })
  .refine((data) => data.signup_type !== "startup" || (data.startupName && data.startupName.trim().length > 0), {
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
      signup_type: undefined as SignupType | undefined,
      startupName: "",
      startupDescription: "",
      instructorHeadline: "",
      instructorBio: "",
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

  const signupType = form.watch("signup_type");
  const nameLabel = signupType === "student" ? "Student" : signupType === "instructor" ? "Instructor" : "";
  const firstNameLabel = nameLabel ? `${nameLabel} first name` : "First name";
  const lastNameLabel = nameLabel ? `${nameLabel} last name` : "Last name";
  const usernameLabel = signupType === "student" ? "Student username" : signupType === "instructor" ? "Instructor username" : "Username";
  const contactLabel = signupType === "student" ? "Student contact number" : signupType === "instructor" ? "Instructor contact number" : "Contact number";
  const nationalityLabel = signupType === "student" ? "Student nationality" : signupType === "instructor" ? "Instructor nationality" : "Nationality";
  const dobLabel = signupType === "student" ? "Student date of birth" : signupType === "instructor" ? "Instructor date of birth" : "Date of birth";

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
        const role: "user" | "instructor" = values.signup_type === "instructor" ? "instructor" : "user";
        const marketplace_role: "startup" | "contributor" | "user" =
          values.signup_type === "startup" ? "startup" : values.signup_type === "contributor" ? "contributor" : "user";
        const payload: Record<string, unknown> = {
          role,
          marketplace_role,
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
        if (values.signup_type === "startup") {
          if (values.startupName?.trim()) payload.startupName = values.startupName.trim();
          if (values.startupDescription?.trim()) payload.startupDescription = values.startupDescription.trim();
        }
        if (values.signup_type === "instructor") {
          if (values.instructorHeadline?.trim()) payload.instructorHeadline = values.instructorHeadline.trim();
          if (values.instructorBio?.trim()) payload.instructorBio = values.instructorBio.trim();
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

  const roleCards = [
    { value: "startup" as const, label: "Startup", desc: "I'm building a venture", Icon: Rocket },
    { value: "contributor" as const, label: "Contributor", desc: "I want to contribute", Icon: Handshake },
    { value: "student" as const, label: "Student", desc: "I want to learn", Icon: BookOpen },
    { value: "instructor" as const, label: "Instructor", desc: "I want to teach", Icon: GraduationCap },
  ];

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 lg:p-10 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-700/50">
        {/* Header: logo + title in one row, uses full width */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex-shrink-0">
              <img src="/logo.png" alt="Equalmint Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Equalmint
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Community Hub</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create your account</h3>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5" aria-label="Registration form" noValidate>
            {/* Role selection: full width, always visible 2x2 grid */}
            <div className="sm:col-span-2">
              <FormField
              control={form.control}
              name="signup_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900 dark:text-white">I want to sign up as</FormLabel>
                  <FormControl>
                    <div
                      className="grid grid-cols-2 gap-3 p-1"
                      role="group"
                      aria-label="Choose your role"
                    >
                      {roleCards.map(({ value, label, desc, Icon }) => {
                        const isSelected = field.value === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            className={`
                              flex flex-col items-center justify-center min-h-[88px] p-4 rounded-xl border-2 transition-all duration-200
                              text-left sm:text-center
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
                              ${isSelected
                                ? "border-green-600 bg-green-50 dark:bg-green-900/25 text-green-800 dark:text-green-200 shadow-sm ring-2 ring-green-500/30"
                                : "border-zinc-200 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-gray-100 hover:border-zinc-300 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                              }
                            `}
                          >
                            <Icon className={`w-6 h-6 mb-1.5 flex-shrink-0 ${isSelected ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`} aria-hidden />
                            <span className="font-semibold text-sm">{label}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            </div>

            {signupType === "startup" && (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-zinc-200 dark:border-zinc-600 p-4 bg-zinc-50/50 dark:bg-zinc-800/50">
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
              </div>
            )}

            {signupType === "instructor" && (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-zinc-200 dark:border-zinc-600 p-4 bg-zinc-50/50 dark:bg-zinc-800/50">
                <FormField
                  control={form.control}
                  name="instructorHeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Full-stack developer & mentor"
                          {...field}
                          className={form.formState.errors.instructorHeadline ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
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
                        <Input
                          placeholder="Short bio about your teaching experience"
                          {...field}
                          className={form.formState.errors.instructorBio ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {registerError && (
              <Alert variant="destructive" className="sm:col-span-2 w-full" role="alert" aria-live="assertive">
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

            {/* All main fields in 2-column rows */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{firstNameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={firstNameLabel} {...field} autoComplete="given-name" className={form.formState.errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
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
                    <FormLabel>{lastNameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={lastNameLabel} {...field} autoComplete="family-name" className={form.formState.errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

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
                    <FormLabel>{usernameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={signupType === "student" ? "Student username (min 5 characters)" : signupType === "instructor" ? "Instructor username (min 5 characters)" : "Choose a username (min 5 characters)"} {...field} autoComplete="username" className={form.formState.errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} />
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
                    <FormLabel>{contactLabel}</FormLabel>
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
                    <FormLabel>{nationalityLabel}</FormLabel>
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
                    <FormLabel>{dobLabel}</FormLabel>
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
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="sm:col-span-2 w-full bg-green-700 hover:bg-green-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 py-2.5"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700 text-sm text-gray-500 dark:text-gray-400">
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
