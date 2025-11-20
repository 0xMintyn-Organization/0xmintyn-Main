"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Spinner from "@/components/Spinner";
import useAuth from "./userAuth";

interface ProtectedProps {
    children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
    const { isLoading, isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If not loading and not authenticated (or no user), redirect to login
        if (!isLoading && (!isAuthenticated || !user)) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
        return <Spinner />;
    }

    // Double check - if still not authenticated after loading, redirect
    if (!isAuthenticated || !user) {
        return <Spinner />; // Show spinner while redirecting
    }

    return <>{children}</>;
}