"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "@/components/Spinner";
import useAuth from "@/hooks/userAuth";

interface RoleProtectedProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function RoleProtected({ 
  children, 
  allowedRoles, 
  fallback,
  redirectTo = "/dashboard" 
}: RoleProtectedProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Helper function to check if user has required role
  const hasRole = (roles: string[]): boolean => {
    if (!user || !isAuthenticated) return false;
    return roles.includes(user.role);
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRole(allowedRoles)) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, allowedRoles, redirectTo, router, user]);

  // Show loading while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Show fallback or nothing if user doesn't have required role
  if (!hasRole(allowedRoles)) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            You are not accessed to this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            This page is restricted to: {allowedRoles.join(', ')} only.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Specific role protection components
export function AdminProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

export function InstructorProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["instructor"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

export function UserProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["user"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

export function AdminOrInstructorProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["admin", "instructor"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

export function AllRolesProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["user", "instructor", "admin"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}
