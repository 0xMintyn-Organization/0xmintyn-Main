"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLoadUserQuery } from '@/redux/features/api/apiSlice';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
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

  // Get user from Redux store first
  const reduxUser = useSelector((state: any) => state.auth?.user);
  const reduxIsAuthenticated = useSelector((state: any) => state.auth?.isAuthenticated);

  // Only fetch user data when needed
  const { data, isLoading: queryLoading, refetch } = useLoadUserQuery(undefined, {
    skip: !shouldFetch,
  });

  useEffect(() => {
    // Prioritize Redux store data if available
    if (reduxUser && reduxIsAuthenticated) {
      setUser(reduxUser);
      setIsLoading(false);
      setShouldFetch(false);
      return;
    }

    // Check if user data exists in localStorage
    const cachedUser = localStorage.getItem('user');
    const cachedToken = localStorage.getItem('accessToken');
    
    if (cachedUser && cachedToken) {
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
      setShouldFetch(true);
    }
  }, [reduxUser, reduxIsAuthenticated]);

  // Sync with Redux store changes
  useEffect(() => {
    if (reduxUser && reduxIsAuthenticated) {
      setUser(reduxUser);
      setIsLoading(false);
    } else if (!reduxIsAuthenticated && reduxUser === null) {
      setUser(null);
      setIsLoading(false);
    }
  }, [reduxUser, reduxIsAuthenticated]);

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
      setIsLoading(false);
      setShouldFetch(false);
      
      // Cache user data
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
    } else if (!queryLoading && shouldFetch) {
      // No user data and not loading, user is not authenticated
      setUser(null);
      setIsLoading(false);
      setShouldFetch(false);
    }
  }, [data, queryLoading, shouldFetch]);

  const refetchUser = () => {
    setShouldFetch(true);
    refetch();
  };

  const logout = () => {
    setUser(null);
    setIsLoading(false);
    setShouldFetch(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    router.push('/login');
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
