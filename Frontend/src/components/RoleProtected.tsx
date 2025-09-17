"use client";

import { ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "@/components/Spinner";

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
  const { hasRole, isAuthenticated, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !hasRole(allowedRoles)) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, hasRole, allowedRoles, redirectTo, router]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800"
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
    <RoleProtected allowedRoles={["instructor", "admin"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

export function UserProtected({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["user", "instructor", "admin"]} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}
