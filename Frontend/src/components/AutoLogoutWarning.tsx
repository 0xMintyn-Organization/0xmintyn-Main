"use client";

// No-op auto logout warning component. Kept for compatibility but intentionally
// renders nothing so automatic logout UI is disabled.

type AutoLogoutWarningProps = {
  isOpen: boolean;
  timeRemaining: number;
  onStayLoggedIn: () => Promise<boolean> | (() => void);
  onLogout: () => void;
  isExtending?: boolean;
};

export function AutoLogoutWarning(_props: AutoLogoutWarningProps) {
  return null;
}

