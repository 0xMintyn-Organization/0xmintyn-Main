"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getToken, getTokenExpiration, getTokenTimeRemaining, isTokenExpired } from '@/utils/jwtHelper';

interface AutoLogoutOptions {
  enabled?: boolean;
  warningTime?: number; // Minutes before expiration to show warning (DEFAULT: from localStorage)
  sessionTimeout?: number; // Total session timeout in minutes (if set, overrides token expiration)
  checkInterval?: number; // Check interval in seconds
}

interface AutoLogoutState {
  isWarningShown: boolean;
  timeRemaining: number;
  isExpired: boolean;
}

const DEFAULT_WARNING_TIME = 2; // 2 minutes before expiration
const DEFAULT_CHECK_INTERVAL = 10; // Check every 10 seconds
const DEFAULT_SESSION_TIMEOUT = 60; // 60 minutes default session timeout
const STORAGE_KEY_PREFIX = 'autoLogout_';

/**
 * Custom hook for automatic logout based on JWT token expiration
 * Implements Approach 3: Token Expiration Based auto-logout
 */
export function useAutoLogout(options: AutoLogoutOptions = {}) {
  const {
    enabled = true,
    warningTime: optionWarningTime,
    sessionTimeout: optionSessionTimeout,
    checkInterval = DEFAULT_CHECK_INTERVAL,
  } = options;

  // Warning time is always fixed at 2 minutes (before logout)
  const warningTime = optionWarningTime ?? DEFAULT_WARNING_TIME;
  
  // Get session timeout from localStorage if not provided
  const getSessionTimeoutFromStorage = (): number | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('autoLogout_sessionTimeout');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 480) {
        return parsed;
      }
    }
    return null;
  };

  const sessionTimeout = optionSessionTimeout ?? getSessionTimeoutFromStorage();

  const router = useRouter();
  const { user, logout: authLogout, isAuthenticated } = useAuth();
  const [state, setState] = useState<AutoLogoutState>({
    isWarningShown: false,
    timeRemaining: 0,
    isExpired: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expirationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  /**
   * Clear all timeouts and intervals
   */
  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (expirationTimeoutRef.current) {
      clearTimeout(expirationTimeoutRef.current);
      expirationTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    clearAllTimers();
    setState({
      isWarningShown: false,
      timeRemaining: 0,
      isExpired: true,
    });

    // Call auth logout which clears storage and redirects
    authLogout();

    // Show toast notification
    if (typeof window !== 'undefined') {
    }
  }, [authLogout, clearAllTimers]);

  /**
   * Check token and update state
   */
  const checkToken = useCallback(() => {
    if (!enabled || !isAuthenticated) {
      clearAllTimers();
      setState({
        isWarningShown: false,
        timeRemaining: 0,
        isExpired: false,
      });
      return;
    }

    const token = getToken();
    
    // Token changed, reset everything
    if (token !== lastTokenRef.current) {
      lastTokenRef.current = token;
      clearAllTimers();
    }

    

    // If no token in localStorage, try to estimate based on login time
    // For HTTP-only cookies, we'll rely on API responses to detect expiration
    let loginTimeValue = localStorage.getItem('loginTimestamp');
    
    // If loginTimestamp is missing but session timeout is set, initialize it now
    if (!loginTimeValue && sessionTimeout) {
      const currentTime = Date.now().toString();
      localStorage.setItem('loginTimestamp', currentTime);
      loginTimeValue = currentTime;
      
    }
    
    if (!token) {
      // No token in localStorage (might be in HTTP-only cookies)
      if (loginTimeValue && sessionTimeout) {
        const loginMs = parseInt(loginTimeValue, 10);
        const now = Date.now();
        const elapsed = now - loginMs;
        
        // Use session timeout
        const totalLifetime = sessionTimeout * 60 * 1000; // Convert minutes to ms
        const remaining = totalLifetime - elapsed;
        
        
        
        if (remaining <= 0) {
          // Session expired, logout

          clearAllTimers();
          setState({
            isWarningShown: false,
            timeRemaining: 0,
            isExpired: true,
          });
          handleLogout();
          return;
        }
        
        // Calculate minutes remaining
        const minutesRemaining = remaining / (1000 * 60);

        // Show warning if close to expiration
        if (minutesRemaining <= warningTime) {
          setState({
            isWarningShown: true,
            timeRemaining: remaining,
            isExpired: false,
          });

          // Set timeout to logout when session expires
          expirationTimeoutRef.current = setTimeout(() => {
            handleLogout();
          }, remaining);
        } else {
          setState({
            isWarningShown: false,
            timeRemaining: remaining,
            isExpired: false,
          });
        }
      } else if (!sessionTimeout) {
        // No session timeout set, can't track without token
        
      }
      return;
    }

    const expired = isTokenExpired(token);
    if (expired === true) {
      // Token is expired
      clearAllTimers();
      setState({
        isWarningShown: false,
        timeRemaining: 0,
        isExpired: true,
      });
      handleLogout();
      return;
    }

    // Check token expiration OR session timeout
    const tokenRemaining = getTokenTimeRemaining(token);
    
    // Also check login timestamp for session timeout
    // If loginTimestamp is missing but session timeout is set, initialize it now
    let loginTimeForToken = localStorage.getItem('loginTimestamp');
    if (!loginTimeForToken && sessionTimeout) {
      const currentTime = Date.now().toString();
      localStorage.setItem('loginTimestamp', currentTime);
      loginTimeForToken = currentTime;
    }
    
    let sessionRemaining: number | null = null;
    
    if (loginTimeForToken && sessionTimeout) {
      const loginMs = parseInt(loginTimeForToken, 10);
      const now = Date.now();
      const elapsed = now - loginMs;
      const totalLifetime = sessionTimeout * 60 * 1000; // Convert minutes to ms
      sessionRemaining = totalLifetime - elapsed;
      
      
    }
    
    // Use whichever expires first: token expiration or session timeout
    let remaining: number;
    if (tokenRemaining === null || tokenRemaining <= 0) {
      // Token expired or invalid, use session timeout if available
      if (sessionRemaining !== null && sessionRemaining > 0) {
        remaining = sessionRemaining;
      } else {
        // Both expired or no session timeout
        setState({
          isWarningShown: false,
          timeRemaining: 0,
          isExpired: true,
        });
        handleLogout();
        return;
      }
    } else if (sessionTimeout && sessionRemaining !== null && sessionRemaining < tokenRemaining) {
      // Session timeout expires before token - use session timeout
      remaining = sessionRemaining;
    } else {
      // Token expires before session timeout (or no session timeout set)
      remaining = tokenRemaining ?? Infinity;
    }

    if (remaining <= 0) {
      setState({
        isWarningShown: false,
        timeRemaining: 0,
        isExpired: true,
      });
      handleLogout();
      return;
    }

    // Calculate minutes remaining
    const minutesRemaining = remaining / (1000 * 60);

    // Show warning if close to expiration
    if (minutesRemaining <= warningTime && !state.isWarningShown) {
      setState({
        isWarningShown: true,
        timeRemaining: remaining,
        isExpired: false,
      });

      // Set timeout to logout when expires
      expirationTimeoutRef.current = setTimeout(() => {
        handleLogout();
      }, remaining);
    } else if (state.isWarningShown && remaining > 0) {
      // Update remaining time while warning is shown
      setState((prev) => ({
        ...prev,
        timeRemaining: remaining,
      }));
    } else {
      setState({
        isWarningShown: false,
        timeRemaining: remaining,
        isExpired: false,
      });
    }
  }, [enabled, isAuthenticated, warningTime, sessionTimeout, state.isWarningShown, handleLogout, clearAllTimers]);

  /**
   * Extend session by refreshing token
   */
  const extendSession = useCallback(async () => {
    try {
      // Try to refresh token
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/refreshtoken`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          // Token refreshed successfully
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', data.accessToken);
            // Update login timestamp for accurate calculation
            localStorage.setItem('loginTimestamp', Date.now().toString());
          }
          
          // Reset state and restart monitoring
          clearAllTimers();
          setState({
            isWarningShown: false,
            timeRemaining: 0,
            isExpired: false,
          });
          
          // Restart checking
          lastTokenRef.current = null;
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  }, [clearAllTimers]);

  /**
   * Get user's auto-logout preference from localStorage
   */
  const getUserPreference = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}enabled`);
    if (stored === null) return true; // Default enabled
    return stored === 'true';
  }, []);

  /**
   * Save user's auto-logout preference
   */
  const saveUserPreference = useCallback((value: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}enabled`, String(value));
  }, []);

  // Initialize monitoring
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      clearAllTimers();
      return;
    }

    // Check user preference
    const userPrefEnabled = getUserPreference();
    if (!userPrefEnabled) {
      clearAllTimers();
      return;
    }

    // Initial check
    checkToken();

    // Set up periodic checking
    intervalRef.current = setInterval(() => {
      checkToken();
    }, checkInterval * 1000);

    // Cleanup on unmount
    return () => {
      clearAllTimers();
    };
  }, [enabled, isAuthenticated, checkInterval, checkToken, clearAllTimers, getUserPreference]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    isWarningShown: state.isWarningShown,
    timeRemaining: state.timeRemaining,
    isExpired: state.isExpired,
    extendSession,
    handleLogout,
    getUserPreference,
    saveUserPreference,
  };
}

