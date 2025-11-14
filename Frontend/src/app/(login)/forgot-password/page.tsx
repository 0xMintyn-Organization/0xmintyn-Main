"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import Spinner from "@/components/Spinner";
import useAuth from "@/hooks/userAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const { isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const email = form.watch("email");
  const isFormValid = form.formState.isValid;

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsSubmitting(true);
    try {
      // TODO: Implement forgot password API call
      // const response = await forgotPassword(values.email).unwrap();
      
      // For now, show success message
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
        variant: "default",
      });
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md mt-16">
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
            Enter your email address and we'll send you instructions to reset your password.
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your email" 
                    {...field} 
                    type="email"
                    className={form.formState.errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-sm mt-1" />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid || !email} 
            className="w-full bg-green-700 hover:bg-green-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Spinner size="sm" inline />
                <span className="ml-2">Sending...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Mail className="mr-2 h-4 w-4" />
                Send Reset Link
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
  );
}

