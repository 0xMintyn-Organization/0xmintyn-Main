"use client";

import { useState } from 'react';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { AutoLogoutWarning } from './AutoLogoutWarning';
import { useAuth } from '@/contexts/AuthContext';

/**
 * AutoLogoutProvider - Wraps the app to monitor token expiration
 * Implements Approach 3: Token Expiration Based auto-logout
 */
export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isExtending, setIsExtending] = useState(false);

  // Get user's warning time preference (fixed at 2 minutes before logout)
  const getWarningTime = (): number => {
    return 2; // Always 2 minutes before logout
  };

  // Get session timeout from localStorage
  const getSessionTimeout = (): number | null => {
    if (typeof window === 'undefined') return null;
    const savedTime = localStorage.getItem('autoLogout_time');
    if (savedTime) {
      const parsed = parseInt(savedTime, 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 120) {
        return parsed;
      }
    }
    return null; // Use token expiration as default
  };

  // Get user preference before using hook
  const getUserPreferenceValue = (): boolean => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('autoLogout_enabled');
    if (stored === null) return true; // Default enabled
    return stored === 'true';
  };

  const warningTimeMinutes = getWarningTime();
  const sessionTimeout = getSessionTimeout();
  
  const {
    isWarningShown,
    timeRemaining,
    isExpired,
    extendSession,
    handleLogout,
    getUserPreference,
  } = useAutoLogout({
    enabled: isAuthenticated && getUserPreferenceValue(),
    warningTime: warningTimeMinutes,
    sessionTimeout: sessionTimeout ?? undefined,
    checkInterval: 10, // Check every 10 seconds
  });

  const handleStayLoggedIn = async () => {
    setIsExtending(true);
    try {
      const success = await extendSession();
      if (!success) {
        // If refresh failed, logout
        handleLogout();
      }
    } catch (error) {
      console.error('Error extending session:', error);
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogoutNow = () => {
    handleLogout();
  };

  return (
    <>
      {children}
      {isAuthenticated && (
        <AutoLogoutWarning
          isOpen={isWarningShown && !isExpired}
          timeRemaining={timeRemaining}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={handleLogoutNow}
          isExtending={isExtending}
        />
      )}
    </>
  );
}

