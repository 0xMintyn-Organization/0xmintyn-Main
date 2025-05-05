/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useActivationMutation } from "@/redux/features/auth/authApi";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { redirect } from "next/navigation";

type VerifyNumber = {
    "0": string;
    "1": string;
    "2": string;
    "3": string;
};

const OTPVerification = ({ setRoute }: { setRoute: (route: string) => void }) => {
    const [invalidError, setInvalidError] = useState<boolean>(false);
    const { token } = useSelector((state: { auth: { token: string } }) => state.auth);
    const [activation, { isSuccess, error }] = useActivationMutation();
    const { toast } = useToast();

    useEffect(() => {
        if (isSuccess) {
            toast({
                title: "Account Activated Successfully",
                description: "You can now log in.",
                variant: "default",
            });
            redirect("/login");
        }

        if (error) {
            if ("data" in error) {
                const errorData = error as any;
                toast({
                    title: "Error",
                    description: errorData.data.error || "An error occurred",
                    variant: "destructive",
                });
                setInvalidError(true);
            } else if ("error" in error) {
                toast({
                    title: "Error",
                    description: error.error || "An error occurred",
                    variant: "destructive",
                });
            }
        }
    }, [isSuccess, error, toast, setRoute]);

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
            return;
        }
        await activation({ activation_token: token, activation_code: verificationNumber });
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

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Verify Your Account</h2>
            <div className="w-full flex items-center justify-center mt-2">
                <div className="w-[80px] h-[80px] rounded-full bg-green-700 flex items-center justify-center">
                    <VscWorkspaceTrusted size={40} />
                </div>
            </div>
            <div className="m-auto flex items-center justify-around mt-4">
                {/* OTP Inputs */}
                {Object.keys(verifyNumber).map((key, index) => (
                    <Input
                        key={key}
                        ref={inputRef[index]}
                        className={`w-[65px] h-[65px] bg-transparent  text-center border-[3px] rounded-[10px] text-black dark:text-white text-[18px] font-Poppins outline-none
              ${invalidError ? "shake border-red-500" : "dark:border-white border-[#0000004a]"}
            `}
                        type="number"
                        maxLength={1}
                        value={verifyNumber[key as keyof VerifyNumber]}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                    />
                ))}
            </div>
            <div className="w-full flex justify-center mt-6 ">
                <Button onClick={verificationHandler} className="w-full bg-green-700 hover:bg-green-800 text-white">
                    Verify
                </Button>
            </div>
            <h5 className="text-center pt-4 font-Poppins text-[14px]">
                Go back to Sign in?
                <span
                    className="text-[#2190ff] pl-2 cursor-pointer"
                    onClick={() => redirect("/login")} 
                >
                    Sign In
                </span>
            </h5>
        </div>
    );
};

export default OTPVerification;
