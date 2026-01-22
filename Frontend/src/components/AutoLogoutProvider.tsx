"use client";

import React from 'react';
import { AutoLogoutWarning } from './AutoLogoutWarning';

// Simple pass-through provider. Auto-logout behavior has been disabled.
export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AutoLogoutWarning isOpen={false} timeRemaining={0} onStayLoggedIn={() => {}} onLogout={() => {}} />
    </>
  );
}
