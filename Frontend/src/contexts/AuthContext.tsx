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
  const reduxUser = useSelector((state: any) => state.auth?.user);
  const reduxIsAuthenticated = useSelector((state: any) => state.auth?.isAuthenticated);

  // Only fetch user data when needed
  const { data, isLoading: queryLoading, refetch } = useLoadUserQuery(undefined, {
    skip: !shouldFetch,
  });

  useEffect(() => {
    // Only clear if Redux explicitly says user is logged out AND there's no cached data
    // On page refresh, Redux state is empty initially, so we check localStorage first
    const hasCachedData = localStorage.getItem('user') && localStorage.getItem('accessToken');
    
    // If Redux explicitly says logged out (not just empty on initial load) and no cache, clear everything
    if (!reduxIsAuthenticated && !reduxUser && !hasCachedData) {
      setUser(null);
      setIsLoading(false);
      setShouldFetch(false);
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
    // Check Redux state first - if explicitly logged out, don't set user even if API returns data
    if (!reduxIsAuthenticated && reduxUser === null) {
      setUser(null);
      setIsLoading(false);
      setShouldFetch(false);
      return;
    }

    if (data?.user && reduxIsAuthenticated !== false) {
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
      // No user data and not loading, user is not authenticated
      setUser(null);
      setIsLoading(false);
      setShouldFetch(false);
      // Clear any stale cache
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('loginTimestamp');
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
