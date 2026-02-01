/**
 * Onboarding redirect: not used to gate startup users on login.
 * Startup users go straight to /startup/dashboard; onboarding/startup is optional (e.g. from profile).
 */
export type UserWithOnboarding = {
  marketplace_role?: 'startup' | 'contributor' | null;
  startupOnboardingComplete?: boolean;
  contributorOnboardingComplete?: boolean;
};

export function getOnboardingRedirectPath(user: UserWithOnboarding | null): string | null {
  return null;
}

/** Where to send user after login/onboarding: startup → /startup/dashboard, others → /dashboard */
export function getPostLoginPath(user: UserWithOnboarding | null): string {
  if (!user) return '/dashboard';
  if (user.marketplace_role === 'startup') return '/startup/dashboard';
  if ((user as { startupName?: string }).startupName) return '/startup/dashboard';
  return '/dashboard';
}

/** True if user should see only startup UI (marketplace_role or legacy startupName). */
export function isStartupUser(user: UserWithOnboarding | null): boolean {
  if (!user) return false;
  if (user.marketplace_role === 'startup') return true;
  if ((user as { startupName?: string }).startupName) return true;
  return false;
}
