/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useActivationMutation } from "@/redux/features/auth/authApi";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type VerifyNumber = {
    "0": string;
    "1": string;
    "2": string;
    "3": string;
};

export default function OTPVerification() {
    const [invalidError, setInvalidError] = useState<boolean>(false);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const reduxToken = useSelector((state: { auth: { token: string } }) => state.auth.token);
    const [activation, { isSuccess, error, isLoading }] = useActivationMutation();
    const { toast } = useToast();
    const router = useRouter();
    
    // Get token from localStorage (persisted) or Redux (current session)
    const getActivationToken = () => {
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('activationToken');
            return storedToken || reduxToken || '';
        }
        return reduxToken || '';
    };
    
    const token = getActivationToken();

    useEffect(() => {
        if (isSuccess) {
            // Clear activation token from localStorage after successful activation
            if (typeof window !== 'undefined') {
                localStorage.removeItem('activationToken');
            }
            toast({
                title: "Account Activated Successfully",
                description: "You can now log in.",
                variant: "default",
            });
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        }

        if (error) {
            if ("data" in error) {
                const errorData = error as any;
                const errorMessage = errorData.data?.error || errorData.data?.message || "An error occurred";
                
                // Check if it's a duplicate key error and provide better message
                let friendlyMessage = errorMessage;
                if (errorMessage.includes('E11000') || errorMessage.includes('duplicate key')) {
                    if (errorMessage.includes('email')) {
                        friendlyMessage = "This email is already registered. Please log in instead.";
                    } else if (errorMessage.includes('username')) {
                        friendlyMessage = "This username is already taken. Please register with a different username.";
                    } else {
                        friendlyMessage = "This account already exists. Please log in instead.";
                    }
                }
                
                toast({
                    title: "Activation Failed",
                    description: friendlyMessage,
                    variant: "destructive",
                });
                setInvalidError(true);
            } else if ("error" in error) {
                const errorMessage = (error as any).error || "An error occurred";
                let friendlyMessage = errorMessage;
                
                if (errorMessage.includes('E11000') || errorMessage.includes('duplicate key')) {
                    if (errorMessage.includes('email')) {
                        friendlyMessage = "This email is already registered. Please log in instead.";
                    } else if (errorMessage.includes('username')) {
                        friendlyMessage = "This username is already taken. Please register with a different username.";
                    } else {
                        friendlyMessage = "This account already exists. Please log in instead.";
                    }
                }
                
                toast({
                    title: "Activation Failed",
                    description: friendlyMessage,
                    variant: "destructive",
                });
            }
        }
    }, [isSuccess, error, toast, router]);

    const inputRef = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    const [verifyNumber, setVerifyNumber] = useState<VerifyNumber>({
        "0": "",
        "1": "",
        "2": "",
        "3": "",
    });

    const verificationHandler = async () => {
        const verificationNumber = Object.values(verifyNumber).join("");
        if (verificationNumber.length !== 4) {
            setInvalidError(true);
            toast({
                title: "Invalid OTP",
                description: "Please enter the complete 4-digit code.",
                variant: "destructive",
            });
            return;
        }
        
        if (!token) {
            toast({
                title: "Activation Token Missing",
                description: "Please register again or check your email for the activation link.",
                variant: "destructive",
            });
            router.push("/registration-form");
            return;
        }
        
        setIsVerifying(true);
        try {
            await activation({ activation_token: token, activation_code: verificationNumber });
        } catch (err) {
            // Error handled in useEffect
        } finally {
            setIsVerifying(false);
        }
    };

    const handleInputChange = (index: number, value: string) => {
        setInvalidError(false);
        const newVerifyNumber = { ...verifyNumber, [index]: value };
        setVerifyNumber(newVerifyNumber);

        if (value === "" && index > 0) {
            inputRef[index - 1].current?.focus();
        } else if (value.length === 1 && index < 3) {
            inputRef[index + 1].current?.focus();
        }
    };

    const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedData = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
        if (!pastedData) {
            return;
        }

        event.preventDefault();
        setInvalidError(false);

        const newVerifyNumber = { ...verifyNumber };
        let currentIndex = index;

        for (const char of pastedData) {
            if (currentIndex > 3) break;
            const key = currentIndex.toString() as keyof VerifyNumber;
            newVerifyNumber[key] = char;
            currentIndex += 1;
        }

        setVerifyNumber(newVerifyNumber);

        const focusIndex = Math.min(currentIndex, 3);
        inputRef[focusIndex]?.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !verifyNumber[index as keyof VerifyNumber] && index > 0) {
            inputRef[index - 1].current?.focus();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
                Verify Your Account
            </h2>
            <div className="w-full flex items-center justify-center mt-2">
                <div className="w-[80px] h-[80px] rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center">
                    <VscWorkspaceTrusted size={40} className="text-white" />
                </div>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4 mb-6">
                Enter the 4-digit code sent to your email
            </p>
            <div className="m-auto flex items-center justify-around mt-4 gap-2">
                {/* OTP Inputs */}
                {Object.keys(verifyNumber).map((key, index) => (
                    <Input
                        key={key}
                        ref={inputRef[index]}
                        id={`otp-${index}`}
                        aria-label={`OTP digit ${index + 1}`}
                        className={`w-[65px] h-[65px] bg-transparent text-center border-2 rounded-lg text-black dark:text-white text-xl font-semibold outline-none transition-all
                            ${invalidError 
                                ? "border-red-500 dark:border-red-500 shake" 
                                : "border-gray-300 dark:border-gray-600 focus:border-green-600 dark:focus:border-green-500"
                            }
                        `}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={verifyNumber[key as keyof VerifyNumber]}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            handleInputChange(index, value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={(e) => handlePaste(index, e)}
                        disabled={isVerifying || isLoading}
                        autoComplete="off"
                    />
                ))}
            </div>
            {invalidError && (
                <p className="text-red-500 text-sm text-center mt-2" role="alert">
                    Please enter a valid 4-digit code
                </p>
            )}
            <div className="w-full flex justify-center mt-6">
                <Button 
                    onClick={verificationHandler} 
                    disabled={isVerifying || isLoading || Object.values(verifyNumber).join("").length !== 4}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isVerifying || isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify OTP"
                    )}
                </Button>
            </div>
            <div className="text-center pt-4 text-sm text-gray-600 dark:text-gray-400">
                Go back to Sign in?{" "}
                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                    Sign In
                </button>
            </div>
        </div>
    );
}
