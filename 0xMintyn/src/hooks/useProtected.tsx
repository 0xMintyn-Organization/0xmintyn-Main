'use client';
import { redirect } from "next/navigation";
import React from "react";
import useUserAuth from "./userAuth";
import Spinner from "@/components/Spinner";

interface ProtectedProps {
    children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
    const { isLoading, isAuthenticated } = useUserAuth();

    if (isLoading) {
        return (
            <>
            <Spinner />;
            
            </>
    );
    }

   

    return <>{
        isAuthenticated ? children : redirect("/login")
    }</>;
}
