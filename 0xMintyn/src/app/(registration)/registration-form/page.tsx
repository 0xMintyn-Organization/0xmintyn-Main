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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";



function UserRegistartionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [register, { data, error, isSuccess }] = useRegisterMutation();
    const { data: userData} = useLoadUserQuery(undefined, {})
  
    useEffect(() => {
        if (userData){
            const user = userData?.user;
            if (user) {
                redirect("/dashboard"); 
            }
        }

    
    if (isSuccess) {
      setIsSubmitting(false);
      const message = data?.message || 'User Registered Successfully';
      toast({
        title: "Success",
        description: message,
        variant: "default",
      });
      redirect('/verification'); 
    }

    if (error) {
      setIsSubmitting(false);
      if ('data' in error) {
        const errorData = error as any;
        toast({
          title: "Error",
          description: errorData?.data?.error || "An error occurred",
          variant: "destructive",
        });
      }
    }
  }, [isSuccess, error, userData, data?.message, toast]);

  const commonPasswords = ["password", "password123", "abcd1234", "hello123"];

  const userSchema = z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }),
      nationality: z.string(),
      age: z
        .number({
          required_error: "Age is required",
          invalid_type_error: "Age must be a number",
        })
        .positive({ message: "Age must be a positive number" }),
      email: z.string().email({ message: "Invalid email address" }),
      username: z
        .string()
        .min(5, "Enter at least 5 characters")
        .max(30, "Username must not exceed 30 characters."),
      contactNumber: z
        .string()
        .regex(
          /^\+?[0-9]{10,15}$/,
          "Phone number must be between 10-15 digits and may start with '+' symbol"
        ),
      password: z
        .string()
        ,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .refine((data) => !/(.)\1{3,}/.test(data.password), {
      message: "No character should repeat more than 3 times in a row",
      path: ["password"],
    })
    .refine(
      (data) => !commonPasswords.includes(data.password.toLocaleLowerCase()),
      {
        message:
          "This password is too common. Please choose a stronger password.",
        path: ["password"],
      }
    );

  // 1. Define form.
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      age: 0,
      email: "",
      username: "",
      contactNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 2. Submit handler
  async function onSubmit(values: z.infer<typeof userSchema>) {
    setIsSubmitting(true);
    await register(values).unwrap();
  }


  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
      <h2 className="text-2xl font-bold mb-6 text-center">Register Account</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">


          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="pk">Pakistan</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="in">India</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Age"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
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
                  <Input type="email" placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
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
                  <Input placeholder="Username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="*********" {...field} />
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
            {isSubmitting ? "Submitting..." : "Register"}
          </Button>
        </form>
        <div className="text-center pt-4">
          <span className="text-sm text-gray-500">
            Already have an account?{" "}
            <span
              className="text-[#2190ff] cursor-pointer"
              onClick={() => redirect("/login")}
            >
              Login
            </span>
          </span>
        </div>
      </Form>
    </div>
  );
}

export default UserRegistartionForm;