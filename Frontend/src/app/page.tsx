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
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Check for cached auth data immediately
  const [hasCachedAuth, setHasCachedAuth] = useState(false);
  
  useEffect(() => {
    // Check localStorage for cached auth data
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('user');
      const cachedToken = localStorage.getItem('accessToken');
      setHasCachedAuth(!!(cachedUser && cachedToken));
    }
    // Give store initialization time to complete
    setTimeout(() => setIsInitializing(false), 100);
  }, []);
  
  // Load user data on component mount
  const { isLoading: userLoading, isError, data, isSuccess } = useLoadUserQuery(undefined, {
    skip: false, // Always try to load user data
  });

  // Wait for initialization and user loading to complete before making redirect decisions
  useEffect(() => {
    // Don't make any redirect decisions while still initializing or loading
    if (isInitializing || userLoading) {
      return;
    }

    // Give a small delay to ensure Redux state has updated after API call
    const timer = setTimeout(() => {
      // Mark that we've checked auth state
      setHasCheckedAuth(true);

      // Check multiple sources for authentication (in priority order):
      // 1. Redux state (from store initialization or API response) - most reliable
      // 2. API response data (if query succeeded)
      // 3. Cached localStorage data (as fallback, only if API didn't explicitly fail)
      const isAuth = (isAuthenticated && user) || 
                     (isSuccess && data?.user) || 
                     (hasCachedAuth && !isError && !isSuccess); // Use cache only if API hasn't responded yet

      if (isAuth) {
        // User is authenticated - redirect to dashboard
        router.push("/dashboard");
      } else {
        // User is not authenticated - redirect to login page
        router.push("/login");
      }
    }, 100); // Small delay to ensure state updates

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router, userLoading, isInitializing, hasCachedAuth, isError, isSuccess, data]);

  // Show loading while initializing, user data is being loaded, or while redirecting
  if (isInitializing || userLoading || !hasCheckedAuth) {
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
