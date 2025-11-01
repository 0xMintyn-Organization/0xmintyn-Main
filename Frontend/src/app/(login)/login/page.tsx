"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import useAuth from "@/hooks/userAuth";
import { useRouter } from "next/navigation";
import { SocialLoginButton } from "@/components/MyProfile/SocialLoginButton";
import { FcGoogle } from "react-icons/fc";
import { Github, Twitter, Linkedin } from "lucide-react";
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

  const [login, { data, error, isSuccess }] = useLoginMutation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 🧠 Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // ✅ Handle login result
  useEffect(() => {
    if (isSuccess) {
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
      toast({
        title: "Login Error",
        description: errData?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [isSuccess, error, data, toast]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      await login(values).unwrap();
    } catch (err) {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Spinner />;

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
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} type="email" />
                </FormControl>
                <FormMessage />
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
                  <Input placeholder="Password" {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full bg-green-700 hover:bg-green-800 text-white">
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>

      {/* Social Login Section */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-800 px-2 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
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
        <span className="text-[#2190ff] cursor-pointer" onClick={() => redirect("/")}>
          Register
        </span>
      </div>
    </div>
  );
}