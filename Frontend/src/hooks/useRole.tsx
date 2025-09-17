"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface User {
  _id: string;
  role: 'user' | 'instructor' | 'admin';
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const useRole = () => {
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);
  const router = useRouter();

  const hasRole = (roles: string | string[]): boolean => {
    if (!user || !isAuthenticated) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isInstructor = (): boolean => hasRole('instructor');
  const isUser = (): boolean => hasRole('user');
  const isInstructorOrAdmin = (): boolean => hasRole(['instructor', 'admin']);

  const requireRole = (roles: string | string[], redirectTo: string = '/dashboard') => {
    if (!hasRole(roles)) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const requireAdmin = (redirectTo: string = '/dashboard') => requireRole('admin', redirectTo);
  const requireInstructor = (redirectTo: string = '/dashboard') => requireRole('instructor', redirectTo);
  const requireInstructorOrAdmin = (redirectTo: string = '/dashboard') => requireRole(['instructor', 'admin'], redirectTo);

  return {
    user,
    isAuthenticated,
    hasRole,
    isAdmin,
    isInstructor,
    isUser,
    isInstructorOrAdmin,
    requireRole,
    requireAdmin,
    requireInstructor,
    requireInstructorOrAdmin,
  };
};

// Higher-order component for role-based access control
export const withRole = (WrappedComponent: React.ComponentType<any>, allowedRoles: string[]) => {
  return function RoleProtectedComponent(props: any) {
    const { hasRole, isAuthenticated } = useRole();
    const router = useRouter();

    useEffect(() => {
      if (isAuthenticated && !hasRole(allowedRoles)) {
        router.push('/dashboard');
      }
    }, [isAuthenticated, hasRole, router]);

    if (!isAuthenticated || !hasRole(allowedRoles)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

// Hook for role-based conditional rendering
export const useRoleAccess = () => {
  const { hasRole, isAdmin, isInstructor, isUser, isInstructorOrAdmin } = useRole();

  return {
    canAccessAdmin: isAdmin(),
    canAccessInstructor: isInstructorOrAdmin(),
    canCreateCourses: isInstructorOrAdmin(),
    canManageUsers: isAdmin(),
    canViewAnalytics: isInstructorOrAdmin(),
    canViewInstructorAnalytics: isInstructorOrAdmin(),
    hasRole,
  };
};
