"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import useAuth from "@/hooks/userAuth";
import { useRouter } from "next/navigation";
import { SocialLoginButton } from "@/components/MyProfile/SocialLoginButton";
import { FcGoogle } from "react-icons/fc";
import { Github, Twitter, Linkedin, AlertCircle, X, Eye, EyeOff } from "lucide-react";
import { FaDiscord } from "react-icons/fa";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [login, { data, error, isSuccess }] = useLoginMutation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Watch form values to enable/disable button
  const email = form.watch("email");
  const password = form.watch("password");
  const isFormValid = form.formState.isValid;

  // 🧠 Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // ✅ Handle login result
  useEffect(() => {
    if (isSuccess) {
      setLoginError(null); // Clear any previous errors
      toast({
        title: "Success",
        description: data?.message || "Logged in successfully",
      });
      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }

    if (error && "data" in error) {
      const errData = error as any;
      const errorMessage = errData?.data?.error || errData?.data?.message || "Invalid email or password. Please check your credentials and try again.";
      setLoginError(errorMessage);
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      setLoginError(null);
    }
  }, [isSuccess, error, data, toast, router]);

  // Clear error when user starts typing
  useEffect(() => {
    if (loginError && (email || password)) {
      // Clear error after a short delay when user starts typing
      const timer = setTimeout(() => {
        setLoginError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [email, password, loginError]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    setLoginError(null); // Clear any previous errors when submitting again
    try {
      await login(values).unwrap();
    } catch (err) {
      setIsSubmitting(false);
      // Error will be handled by the useEffect hook
    }
  }

  // Show loading while checking authentication or if already authenticated (redirecting)
  if (isLoading || isAuthenticated) {
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
      </div>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-4"
          aria-label="Login form"
          noValidate
        >
          {/* Inline Error Alert */}
          {loginError && (
            <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span id="login-error-message">{loginError}</span>
                <button
                  type="button"
                  onClick={() => setLoginError(null)}
                  className="ml-2 hover:bg-red-100 dark:hover:bg-red-900 rounded p-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Dismiss error message"
                  tabIndex={0}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email-input">Email</FormLabel>
                <FormControl>
                  <Input 
                    id="email-input"
                    placeholder="Enter your email" 
                    {...field} 
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!form.formState.errors.email}
                    aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                    className={form.formState.errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    tabIndex={0}
                  />
                </FormControl>
                <FormMessage id="email-error" className="text-red-500 text-sm mt-1" role="alert" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="password-input">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      id="password-input"
                      placeholder="Password" 
                      {...field} 
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.password}
                      aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                      className={form.formState.errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                      tabIndex={0}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage id="password-error" className="text-red-500 text-sm mt-1" role="alert" />
              </FormItem>
            )}
          />
          
          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-[#2190ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2190ff] focus:ring-offset-2 rounded px-1"
              aria-label="Navigate to forgot password page"
              tabIndex={0}
            >
              Forgot Password?
            </button>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid || !email || !password} 
            className="w-full bg-green-700 hover:bg-green-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            aria-label={isSubmitting ? "Logging in, please wait" : "Submit login form"}
            aria-disabled={isSubmitting || !isFormValid || !email || !password}
            tabIndex={0}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>

      {/* Social Login Section */}
      <div className="mt-6" role="region" aria-label="Social login options">
        <div className="relative" aria-hidden="true">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-800 px-2 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Social login buttons">
          <SocialLoginButton
            provider="Google"
            icon={FcGoogle}
            label="Google"
            isConnected={false}
            redirectTo="/dashboard"
            onConnect={() => {
              console.log("Google login successful");
            }}
          />
          <SocialLoginButton
            provider="GitHub"
            icon={Github}
            label="GitHub"
            isConnected={false}
            redirectTo="/dashboard"
            onConnect={() => {
              console.log("GitHub login successful");
            }}
          />
          <SocialLoginButton
            provider="Twitter"
            icon={Twitter}
            label="Twitter"
            isConnected={false}
            redirectTo="/dashboard"
            onConnect={() => {
              console.log("Twitter login successful");
            }}
          />
          <SocialLoginButton
            provider="Discord"
            icon={FaDiscord}
            label="Discord"
            isConnected={false}
            redirectTo="/dashboard"
            onConnect={() => {
              console.log("Discord login successful");
            }}
          />
        </div>
      </div>

      <div className="text-center mt-4 text-sm text-gray-500">
        Don't have an account?{" "}
        <a
          href="/registration-form"
          className="text-[#2190ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2190ff] focus:ring-offset-2 rounded px-1"
          aria-label="Navigate to registration page"
          tabIndex={0}
        >
          Register
        </a>
      </div>
      </div>
    </main>
  );
}