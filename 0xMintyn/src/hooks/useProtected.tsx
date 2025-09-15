"use client";

import { redirect } from "next/navigation";
import React from "react";
import Spinner from "@/components/Spinner";
import useAuth from "./userAuth";

interface ProtectedProps {
    children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return <Spinner />;
    }

    if (!isAuthenticated) {
        redirect("/login"); // 👈 Redirect unauthenticated users
    }

    return <>{children}</>;
}