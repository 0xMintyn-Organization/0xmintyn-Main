"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";

export default function Home() {
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  // Load user data on component mount
  const { isLoading: userLoading } = useLoadUserQuery(undefined, {
    skip: false, // Always try to load user data
  });

  // Wait for user loading to complete before making redirect decisions
  useEffect(() => {
    // Don't make any redirect decisions while still loading
    if (userLoading) {
      return;
    }

    // Mark that we've checked auth state
    setHasCheckedAuth(true);

    // After loading completes, check authentication status
    if (isAuthenticated && user) {
      // User is authenticated - redirect to dashboard
      router.push("/dashboard");
    } else {
      // User is not authenticated - redirect to login page
      router.push("/login");
    }
  }, [isAuthenticated, user, router, userLoading]);

  // Show loading while user data is being loaded or while redirecting
  if (userLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // This should not be reached, but show loading as fallback
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Spinner />
    </div>
  );
}
