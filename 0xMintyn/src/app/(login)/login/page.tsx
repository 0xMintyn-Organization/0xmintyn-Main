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

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
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
      redirect("/dashboard");
    }
  }, [isAuthenticated, isLoading]);

  // ✅ Handle login result
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: data?.message || "Logged in successfully",
      });
      redirect("/dashboard");
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
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

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

      <div className="text-center mt-4 text-sm text-gray-500">
        Don't have an account?{" "}
        <span className="text-[#2190ff] cursor-pointer" onClick={() => redirect("/")}>
          Register
        </span>
      </div>
    </div>
  );
}