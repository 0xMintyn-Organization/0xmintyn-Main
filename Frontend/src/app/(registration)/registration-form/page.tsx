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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SocialLoginButton } from "@/components/MyProfile/SocialLoginButton";
import { FcGoogle } from "react-icons/fc";
import { Github, Twitter, Linkedin, Eye, EyeOff } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import useAuth from "@/hooks/userAuth";
import Spinner from "@/components/Spinner";
import CustomCaptcha from "@/components/CustomCaptcha";



function UserRegistartionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [register, { data, error, isSuccess }] = useRegisterMutation();
  const { data: userData } = useLoadUserQuery(undefined, {});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  // 🧠 Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // ✅ Handle registration result
  useEffect(() => {
    if (isSuccess) {
      setIsSubmitting(false);
      setEmailError(null);
      setUsernameError(null);
      const message = data?.message || 'User Registered Successfully';
      toast({
        title: "Success",
        description: message,
        variant: "default",
      });
      router.push('/verification'); 
    }

    if (error) {
      setIsSubmitting(false);
      if ('data' in error) {
        const errorData = error as any;
        const errorMessage = errorData?.data?.error || errorData?.data?.message || "An error occurred";
        
        // Check if it's an email already exists error
        if (errorMessage.toLowerCase().includes('email') && 
            (errorMessage.toLowerCase().includes('already') || 
             errorMessage.toLowerCase().includes('exists') ||
             errorMessage.toLowerCase().includes('registered'))) {
          setEmailError(errorMessage);
          setUsernameError(null);
          // Don't show toast for email errors - it's inline now
        } 
        // Check if it's a username already exists error
        else if (errorMessage.toLowerCase().includes('username') && 
                 (errorMessage.toLowerCase().includes('already') || 
                  errorMessage.toLowerCase().includes('exists') ||
                  errorMessage.toLowerCase().includes('taken'))) {
          setUsernameError(errorMessage);
          setEmailError(null);
          // Don't show toast for username errors - it's inline now
        } 
        // Check for email authentication errors (REG-12)
        else if (errorMessage.toLowerCase().includes('authentication') || 
                 errorMessage.toLowerCase().includes('535') ||
                 errorMessage.toLowerCase().includes('incorrect authentication')) {
          // This is likely an email service configuration issue
          // Still show success but warn about email delivery
          toast({
            title: "Registration Successful",
            description: "Account created, but email verification may be delayed. Please contact support if you don't receive the verification email.",
            variant: "default",
          });
          setEmailError(null);
          setUsernameError(null);
        } else {
          setEmailError(null);
          setUsernameError(null);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    }
  }, [isSuccess, error, data?.message, toast, router]);

  const commonPasswords = ["password", "password123", "abcd1234", "hello123"];

  // Human name validation - only letters, spaces, hyphens, apostrophes, and common name characters
  const humanNameRegex = /^[a-zA-Z\s'-]+$/;
  const containsOnlyNumbers = /^\d+$/;
  const containsSpecialChars = /[!@#$%^&*()_+=\[\]{};:"\\|,.<>\/?]/;

  // Phone number patterns by nationality
  const phonePatterns: Record<string, RegExp> = {
    pk: /^\+92[0-9]{10}$/, // Pakistan: +92 followed by 10 digits
    us: /^\+1[0-9]{10}$/, // United States: +1 followed by 10 digits
    uk: /^\+44[0-9]{10,11}$/, // United Kingdom: +44 followed by 10-11 digits
    ca: /^\+1[0-9]{10}$/, // Canada: +1 followed by 10 digits
    au: /^\+61[0-9]{9}$/, // Australia: +61 followed by 9 digits
    in: /^\+91[0-9]{10}$/, // India: +91 followed by 10 digits
    other: /^\+?[0-9]{10,15}$/, // Other: flexible format
  };

  const userSchema = z
    .object({
      firstName: z
        .string()
        .min(1, "First name is required")
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name must not exceed 50 characters")
        .refine((val) => humanNameRegex.test(val), {
          message: "First name can only contain letters, spaces, hyphens, and apostrophes",
        })
        .refine((val) => !containsOnlyNumbers.test(val), {
          message: "First name cannot contain only numbers",
        })
        .refine((val) => !containsSpecialChars.test(val), {
          message: "First name cannot contain special characters",
        }),
      lastName: z
        .string()
        .min(1, "Last name is required")
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must not exceed 50 characters")
        .refine((val) => humanNameRegex.test(val), {
          message: "Last name can only contain letters, spaces, hyphens, and apostrophes",
        })
        .refine((val) => !containsOnlyNumbers.test(val), {
          message: "Last name cannot contain only numbers",
        })
        .refine((val) => !containsSpecialChars.test(val), {
          message: "Last name cannot contain special characters",
        }),
      dateOfBirth: z
        .string()
        .min(1, "Date of birth is required")
        .refine((val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }, {
          message: "Invalid date format",
        })
        .refine((val) => {
          const date = new Date(val);
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          const monthDiff = today.getMonth() - date.getMonth();
          const dayDiff = today.getDate() - date.getDate();
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
          return actualAge >= 18;
        }, {
          message: "You must be at least 18 years old to register",
        }),
      nationality: z.string().min(1, "Nationality is required"),
      email: z.string().email({ message: "Invalid email address" }),
      username: z
        .string()
        .min(5, "Enter at least 5 characters")
        .max(30, "Username must not exceed 30 characters")
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          "Username can only contain letters, numbers, underscores, and hyphens. No spaces or special characters allowed."
        )
        .refine((val) => !val.includes(" "), {
          message: "Username cannot contain spaces",
        }),
      contactNumber: z
        .string()
        .min(1, "Contact number is required"),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string(),
      acceptTerms: z
        .boolean()
        .refine((val) => val === true, {
          message: "You must accept the Terms & Conditions to register",
        }),
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
    )
    .refine((data) => {
      // Validate phone number based on nationality
      const pattern = phonePatterns[data.nationality] || phonePatterns.other;
      return pattern.test(data.contactNumber);
    }, {
      message: "Phone number format does not match the selected nationality",
      path: ["contactNumber"],
    });

  // 1. Define form.
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      email: "",
      username: "",
      contactNumber: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // Watch nationality to update phone validation
  const nationality = form.watch("nationality");
  const dateOfBirth = form.watch("dateOfBirth");

  // Calculate age from DOB
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const date = new Date(dob);
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    return monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  };

  const calculatedAge = calculateAge(dateOfBirth);

  // 2. Submit handler
  async function onSubmit(values: z.infer<typeof userSchema>) {
    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.warn("Bot detected via honeypot field");
      toast({
        title: "Error",
        description: "Invalid submission detected",
        variant: "destructive",
      });
      return;
    }

    // CAPTCHA check
    if (!captchaVerified || !captchaToken) {
      toast({
        title: "Error",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setEmailError(null);
    setUsernameError(null);
    try {
      // Calculate age from DOB for backend compatibility
      const age = calculatedAge || 0;
      const registrationData = {
        ...values,
        age, // Include calculated age for backend
        captchaToken, // Include CAPTCHA token
      };
      await register(registrationData).unwrap();
    } catch (err) {
      // Error handling is done in useEffect
    }
  }

  // Clear errors when user starts typing
  const email = form.watch("email");
  const username = form.watch("username");
  useEffect(() => {
    if (emailError && email) {
      setEmailError(null);
    }
  }, [email, emailError]);
  useEffect(() => {
    if (usernameError && username) {
      setUsernameError(null);
    }
  }, [username, usernameError]);

  // Show loading while checking authentication or if already authenticated (redirecting)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
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
        <p className="text-lg font-semibold mt-2 text-center">Register Account</p>
      </div>
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
                  <div>
                    <Input 
                      type="date" 
                      {...field}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                    {calculatedAge !== null && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Age: {calculatedAge} years {calculatedAge < 18 && <span className="text-red-500">(Must be 18+)</span>}
                      </p>
                    )}
                  </div>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    {...field}
                    className={emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                </FormControl>
                {emailError && (
                  <p className="text-sm text-red-500 mt-1" role="alert">
                    {emailError}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="username-input">Username</FormLabel>
                <FormControl>
                  <Input 
                    id="username-input"
                    placeholder="Username (e.g., john_doe, user123)" 
                    {...field}
                    autoComplete="username"
                    aria-required="true"
                    aria-invalid={!!form.formState.errors.username || !!usernameError}
                    aria-describedby={form.formState.errors.username || usernameError ? "username-error" : undefined}
                    className={usernameError || form.formState.errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    tabIndex={0}
                  />
                </FormControl>
                {usernameError && (
                  <p id="username-error" className="text-sm text-red-500 mt-1" role="alert">
                    {usernameError}
                  </p>
                )}
                <FormMessage id="username-error" className="text-red-500 text-sm mt-1" role="alert" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only letters, numbers, underscores (_), and hyphens (-) are allowed
                </p>
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
                  <div>
                    <Input 
                      placeholder={
                        nationality === "pk" ? "+923001234567" :
                        nationality === "us" ? "+12025551234" :
                        nationality === "uk" ? "+441234567890" :
                        nationality === "ca" ? "+12025551234" :
                        nationality === "au" ? "+6123456789" :
                        nationality === "in" ? "+911234567890" :
                        "+1234567890"
                      } 
                      {...field} 
                    />
                    {nationality && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {nationality === "pk" && "Format: +92XXXXXXXXXX (10 digits after +92)"}
                        {nationality === "us" && "Format: +1XXXXXXXXXX (10 digits after +1)"}
                        {nationality === "uk" && "Format: +44XXXXXXXXXX (10-11 digits after +44)"}
                        {nationality === "ca" && "Format: +1XXXXXXXXXX (10 digits after +1)"}
                        {nationality === "au" && "Format: +61XXXXXXXXX (9 digits after +61)"}
                        {nationality === "in" && "Format: +91XXXXXXXXXX (10 digits after +91)"}
                        {nationality === "other" && "Format: +XXXXXXXXXXXX (10-15 digits)"}
                      </p>
                    )}
                  </div>
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
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="********" 
                      {...field}
                      className="pr-10"
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
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="*********" 
                      {...field}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded p-1"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Honeypot Field - Hidden from users but visible to bots */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
            <label htmlFor="website-url">Website URL (leave blank)</label>
            <input
              type="text"
              id="website-url"
              name="website-url"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Custom CAPTCHA */}
          <div className="my-4">
            <CustomCaptcha
              onVerify={(isValid) => setCaptchaVerified(isValid)}
              onTokenChange={(token) => setCaptchaToken(token)}
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                <FormControl>
                  <Checkbox
                    id="accept-terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-required="true"
                    aria-invalid={!!form.formState.errors.acceptTerms}
                    aria-describedby={form.formState.errors.acceptTerms ? "terms-error" : undefined}
                    tabIndex={0}
                    className="focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    htmlFor="accept-terms"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I accept the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2190ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2190ff] focus:ring-offset-2 rounded px-1"
                      tabIndex={0}
                    >
                      Terms & Conditions
                    </a>
                    {" "}and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2190ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2190ff] focus:ring-offset-2 rounded px-1"
                      tabIndex={0}
                    >
                      Privacy Policy
                    </a>
                  </FormLabel>
                  <FormMessage id="terms-error" className="text-red-500 text-sm" role="alert" />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            disabled={isSubmitting || !captchaVerified || !captchaToken}
            aria-label="Submit registration form"
            tabIndex={0}
          >
            {isSubmitting ? "Submitting..." : "Register"}
          </Button>
        </form>

        {/* Social Login Section */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-800 px-2 text-gray-500 dark:text-gray-400">
                Or register with
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
                console.log("Google registration successful");
              }}
            />
            <SocialLoginButton
              provider="GitHub"
              icon={Github}
              label="GitHub"
              isConnected={false}
              redirectTo="/dashboard"
              onConnect={() => {
                console.log("GitHub registration successful");
              }}
            />
            <SocialLoginButton
              provider="Twitter"
              icon={Twitter}
              label="Twitter"
              isConnected={false}
              redirectTo="/dashboard"
              onConnect={() => {
                console.log("Twitter registration successful");
              }}
            />
            <SocialLoginButton
              provider="Discord"
              icon={FaDiscord}
              label="Discord"
              isConnected={false}
              redirectTo="/dashboard"
              onConnect={() => {
                console.log("Discord registration successful");
              }}
            />
          </div>
        </div>

        <div className="text-center pt-4">
          <span className="text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[#2190ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2190ff] focus:ring-offset-2 rounded px-1"
              aria-label="Navigate to login page"
              tabIndex={0}
            >
              Login
            </a>
          </span>
        </div>
      </Form>
    </div>
  );
}

export default UserRegistartionForm;