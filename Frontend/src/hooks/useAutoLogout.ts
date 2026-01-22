"use client";

import { useCallback } from 'react';

export type AutoLogoutOptions = {
  enabled?: boolean;
  warningTime?: number;
  sessionTimeout?: number | null;
  checkInterval?: number;
};

export type AutoLogoutState = {
  isWarningShown: boolean;
  timeRemaining: number;
  isExpired: boolean;
};

// No-op implementation: preserves API but disables timers and automatic logout.
export function useAutoLogout(_options: AutoLogoutOptions = {}) {
  const extendSession = useCallback(async () => {
    return false;
  }, []);

  const handleLogout = useCallback(() => {
    // intentionally no-op
  }, []);

  const saveUserPreference = useCallback((prefs: { enabled: boolean; time?: number }) => {
    try {
      localStorage.setItem('autoLogout_enabled', String(prefs.enabled));
      if (typeof prefs.time === 'number') {
        localStorage.setItem('autoLogout_time', String(prefs.time));
        localStorage.setItem('autoLogout_sessionTimeout', String(prefs.time));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const getUserPreference = useCallback(() => {
    try {
      const enabled = localStorage.getItem('autoLogout_enabled');
      const time = localStorage.getItem('autoLogout_time');
      return {
        enabled: enabled === null ? true : enabled === 'true',
        time: time ? parseInt(time, 10) : null,
      };
    } catch (e) {
      return { enabled: true, time: null };
    }
  }, []);

  return {
    isWarningShown: false,
    timeRemaining: 0,
    isExpired: false,
    extendSession,
    handleLogout,
    saveUserPreference,
    getUserPreference,
  } as const;
}

