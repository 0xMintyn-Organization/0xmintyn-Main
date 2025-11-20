"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLoadUserQuery } from '@/redux/features/api/apiSlice';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { userLoggedOut } from '@/redux/features/auth/authSlice';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  isSeller: boolean;
  instructorHeadline?: string;
  instructorBio?: string;
  instructorStatus?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetchUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldFetch, setShouldFetch] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();

  // Get user from Redux store first
  const reduxUser = useSelector((state: { auth?: { user: User | null; isAuthenticated: boolean } }) => state.auth?.user);
  const reduxIsAuthenticated = useSelector((state: { auth?: { user: User | null; isAuthenticated: boolean } }) => state.auth?.isAuthenticated);

  // Only fetch user data when needed
  const { data, isLoading: queryLoading, refetch } = useLoadUserQuery(undefined, {
    skip: !shouldFetch,
  });

  // On initial mount, always try to fetch user session (for Auth0/social login cookies)
  useEffect(() => {
    // On mount, if no user data anywhere, try fetching from server (cookies might exist)
    const hasCachedUser = localStorage.getItem('user');
    const hasReduxUser = reduxUser && reduxIsAuthenticated;
    
    if (!hasCachedUser && !hasReduxUser && !shouldFetch) {
      console.log("No cached user found, checking server-side session (cookies)");
      setShouldFetch(true);
      setIsLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally not including deps

  useEffect(() => {
    // Only clear if Redux explicitly says user is logged out AND there's no cached data
    // On page refresh, Redux state is empty initially, so we check localStorage first
    const hasCachedData = localStorage.getItem('user') && localStorage.getItem('accessToken');
    
    // If Redux explicitly says logged out (not just empty on initial load) and no cache, clear everything
    if (!reduxIsAuthenticated && !reduxUser && !hasCachedData) {
      setUser(null);
      // We still want to check server-side session (e.g., Auth0/social login cookies),
      // so keep loading state true and allow fetch to run.
      setIsLoading(true);
      setShouldFetch(true);
      return;
    }
    
    // If explicitly logged out with cached data, clear cache (user manually logged out)
    if (reduxIsAuthenticated === false && reduxUser === null && hasCachedData) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('loginTimestamp');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsLoading(false);
      setShouldFetch(false);
      return;
    }

    // Prioritize Redux store data if available AND authenticated
    if (reduxUser && reduxIsAuthenticated) {
      setUser(reduxUser);
      setIsLoading(false);
      setShouldFetch(false);
      return;
    }

    // Check if user data exists in localStorage (only if Redux doesn't explicitly say logged out)
    const cachedUser = localStorage.getItem('user');
    const cachedToken = localStorage.getItem('accessToken');
    
    if (cachedUser && cachedToken && reduxIsAuthenticated !== false) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);
        setIsLoading(false);
        // Still fetch fresh data in background
        setShouldFetch(true);
      } catch (error) {
        console.error('Error parsing cached user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setShouldFetch(true);
      }
    } else {
      // No cached data or explicitly logged out
      setUser(null);
      setShouldFetch(true);
    }
  }, [reduxUser, reduxIsAuthenticated]);

  // Sync with Redux store changes - this is critical for logout
  useEffect(() => {
    if (reduxUser && reduxIsAuthenticated) {
      setUser(reduxUser);
      setIsLoading(false);
    } else if (reduxIsAuthenticated === false && reduxUser === null) {
      // Only clear if EXPLICITLY logged out (not just empty on initial load)
      // Check if there's cached data - if yes, don't clear (might be initializing)
      const hasCached = localStorage.getItem('user') && localStorage.getItem('accessToken');
      
      // Only clear if explicitly logged out AND no cached data OR if we're sure it's a logout
      if (!hasCached) {
        setUser(null);
        setIsLoading(false);
        setShouldFetch(false);
        // Clear localStorage to prevent stale data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('refreshToken');
      }
    }
    // If Redux state is empty but we have cached data, keep loading state
    // Don't clear user data on initial load
  }, [reduxUser, reduxIsAuthenticated]);

  useEffect(() => {
    // Check Redux state first - only skip if EXPLICITLY logged out (not just empty on initial load)
    // After page refresh, Redux state is empty but we still need to check server-side session
    const hasCachedData = typeof window !== 'undefined' && 
                          (localStorage.getItem('user') || localStorage.getItem('accessToken'));
    const explicitlyLoggedOut = reduxIsAuthenticated === false && reduxUser === null && !hasCachedData;
    
    if (explicitlyLoggedOut) {
      console.log("User explicitly logged out, skipping fetch");
      setUser(null);
      setIsLoading(false);
      setShouldFetch(false);
      return;
    }

    if (data?.user && reduxIsAuthenticated !== false) {
      console.log("User data received from API:", data.user.email);
      setUser(data.user);
      setIsLoading(false);
      setShouldFetch(false);
      
      // Cache user data
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        // Store login timestamp for auto-logout calculation
        localStorage.setItem('loginTimestamp', Date.now().toString());
      }
    } else if (!queryLoading && shouldFetch) {
      // Query completed but no user data returned
      console.log("loadUser query completed but no user data found");
      
      // Only clear cache if we're sure there's no session (not just a network error)
      // Don't clear on initial load - might be checking for Auth0 cookies
      const hasCached = typeof window !== 'undefined' && localStorage.getItem('user');
      if (!hasCached) {
        setUser(null);
        setIsLoading(false);
        setShouldFetch(false);
      } else {
        // Keep cached data if query failed but we have cache
        console.log("Query failed but cache exists, keeping cached user");
        setIsLoading(false);
        setShouldFetch(false);
      }
    }
  }, [data, queryLoading, shouldFetch, reduxIsAuthenticated, reduxUser]);

  const refetchUser = () => {
    setShouldFetch(true);
    refetch();
  };

  const logout = async () => {
    // Clear Redux state FIRST - this is critical
    dispatch(userLoggedOut());
    
    // Clear all local storage items
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('refreshToken');
    
    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      
      // Clear all cookies that might be accessible from client side
      // Note: httpOnly cookies can only be cleared by backend
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.trim().split("=")[0];
        // Clear any auth-related cookies
        if (cookieName.includes('token') || cookieName.includes('auth') || cookieName.includes('session')) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
      });
    }
    
    // Clear local state
    setUser(null);
    setIsLoading(false);
    setShouldFetch(false);
    
    // Use replace instead of push to prevent back navigation
    router.replace('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || queryLoading,
    refetchUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
