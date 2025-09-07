/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import Spinner from "@/components/Spinner";

function LoginPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [login, { data, error, isSuccess }] = useLoginMutation();

    // Added loading status from your API hook
    const { data: userData, isLoading: userLoading } = useLoadUserQuery(undefined, {});

    // If user is already logged in, redirect immediately
    if (userData?.user) {
        redirect("/dashboard");
    }

    useEffect(() => {
        if (isSuccess) {
            setIsSubmitting(false);
            const message = data?.message || "Logged in Successfully";
            toast({
                title: "Success",
                description: message,
                variant: "default",
            });
            redirect("/dashboard");
        }

        if (error) {
            setIsSubmitting(false);
            if ("data" in error) {
                const errorData = error as any;
                toast({
                    title: "Error",
                    description: errorData?.data?.error || "An error occurred",
                    variant: "destructive",
                });
            }
        }
    }, [isSuccess, error, data, toast]);

    const loginSchema = z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(80, "Password must not exceed 80 characters"),
    });

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsSubmitting(true);
        await login(values).unwrap();
    }


    // If user data is loading, do not render login form yet
    if (userLoading) {
        // Optionally, return a spinner or null
        return <div>
            <Spinner />
        </div>;
    }

    
    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
                <Button
                    type="button"
                    variant="outline"
                     onClick={() =>
                        toast({
                            title: "Coming Soon",
                            description: "Google login is coming soon!",
                            variant: "neutral",
                        })
                    }
                    className="w-full flex items-center justify-center gap-2 border-gray-300"
                >
                    <FcGoogle className="text-xl" />
                    Continue with Google
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        toast({
                            title: "Coming Soon",
                            description: "Apple login is coming soon!",
                            variant: "neutral",
                        })
                    }
                    className="w-full flex items-center justify-center gap-2 border-gray-300"
                >
                    <FaApple className="text-xl" />
                    Continue with Apple
                </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-zinc-800 px-2 text-gray-500">
                        or continue with email
                    </span>
                </div>
            </div>

            {/* Email/Password Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="Email" {...field} />
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
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-green-700 hover:bg-green-800 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Login"}
                    </Button>
                </form>
            </Form>

            <div className="text-center pt-4">
                <span className="text-sm text-gray-500">
                    Don&apos;t have an account?{" "}
                    <span
                        className="text-[#2190ff] cursor-pointer"
                        onClick={() => redirect("/")}
                    >
                        Register
                    </span>
                </span>
            </div>
        </div>
    );
}

export default LoginPage;
