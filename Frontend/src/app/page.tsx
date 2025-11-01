"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import UserRegistartionForm from "./(registration)/registration-form/page";
import EnhancedDashboard from "@/components/EnhancedDashboard";
import Spinner from "@/components/Spinner";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";

export default function Home() {
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);
  const router = useRouter();
  
  // Load user data on component mount
  const { isLoading: userLoading } = useLoadUserQuery(undefined, {
    skip: false, // Always try to load user data
  });

  useEffect(() => {
    // If user is not logged in, redirect to registration page
    if (!isAuthenticated || !user) {
      router.push("/registration-form");
    }
  }, [isAuthenticated, user, router]);

  // Show loading while user data is being loaded
  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // If user is logged in, show the enhanced dashboard
  if (isAuthenticated && user) {
    return <EnhancedDashboard />;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Spinner />
    </div>
  );
}
