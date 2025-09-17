"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Spinner from "@/components/Spinner";
import useAuth from "./userAuth";

interface ProtectedProps {
    children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
    const { isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <Spinner />;
    }

    if (!isAuthenticated) {
        return <Spinner />; // Show spinner while redirecting
    }

    return <>{children}</>;
}