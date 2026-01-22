/* eslint-disable @typescript-eslint/no-explicit-any */
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

const userSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(5),
  password: z.string().min(6),
  dateOfBirth: z.string().optional(),
});

export default function RegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerUser, { data, error, isSuccess }] = useRegisterMutation();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      dateOfBirth: "",
    },
  });

  useEffect(() => {
    if (isSuccess) {
      setIsSubmitting(false);
      toast({ title: "Success", description: data?.message || "Registered", variant: "default" });
      router.push("/verification");
    }
    if (error) {
      setIsSubmitting(false);
      const msg = (error as any)?.data?.message || "Registration failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [isSuccess, error, data, router, toast]);

  const onSubmit = useCallback(
    async (values: z.infer<typeof userSchema>) => {
      setIsSubmitting(true);
      try {
        const age = values.dateOfBirth ? Math.max(0, new Date().getFullYear() - new Date(values.dateOfBirth).getFullYear()) : 0;
        await registerUser({ ...values, age }).unwrap();
      } catch (e) {
        setIsSubmitting(false);
      }
    },
    [registerUser]
  );

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm">First name</label>
          <Input {...form.register("firstName")} />
        </div>
        <div>
          <label className="block text-sm">Last name</label>
          <Input {...form.register("lastName")} />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <Input type="email" {...form.register("email")} />
        </div>
        <div>
          <label className="block text-sm">Username</label>
          <Input {...form.register("username")} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <Input type="password" {...form.register("password")} />
        </div>
        <div className="pt-4">
          <Button type="submit">Register</Button>
        </div>
      </form>
    </div>
  );
}