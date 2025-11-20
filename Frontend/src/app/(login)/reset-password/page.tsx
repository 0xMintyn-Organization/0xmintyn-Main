"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import Spinner from "@/components/Spinner";
import useAuth from "@/hooks/userAuth";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const { isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [resetPassword, { isLoading: isSubmitting }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "The reset link is missing or invalid. Please request a new password reset.",
        variant: "destructive",
      });
      setTimeout(() => {
        router.push("/forgot-password");
      }, 2000);
    }
  }, [token, toast, router]);

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast({
        title: "Error",
        description: "Reset token is missing. Please request a new password reset.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await resetPassword({ 
        token, 
        newPassword: values.password 
      }).unwrap();
      
      toast({
        title: "Password Reset Successful",
        description: response.message || "Your password has been reset successfully. You can now login with your new password.",
        variant: "default",
      });
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || error?.data?.message || "Failed to reset password. The link may have expired. Please request a new one.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md text-center">
          <Spinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to forgot password page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md mt-16">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden mb-3">
            <img 
              src="/logo.png" 
              alt="0xMintyn Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            0xMintyn
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Community Hub</p>
          <p className="text-lg font-semibold mt-2 text-center">Reset Password</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your new password below.
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter new password" 
                        {...field} 
                        type={showPassword ? "text" : "password"}
                        className={form.formState.errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Confirm new password" 
                        {...field} 
                        type={showConfirmPassword ? "text" : "password"}
                        className={form.formState.errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid || !password || !confirmPassword} 
              className="w-full bg-green-700 hover:bg-green-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Spinner size="sm" inline />
                  <span className="ml-2">Resetting...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </span>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-[#2190ff] hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

