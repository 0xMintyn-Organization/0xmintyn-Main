import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }

    next();
  };
};

// Admin only access
export const requireAdmin = requireRole(['admin']);

// Instructor or Admin access
export const requireInstructorOrAdmin = requireRole(['instructor', 'admin']);

// Any authenticated user
export const requireAuth = requireRole(['user', 'instructor', 'admin']);

// Check if user can access resource
export const canAccessResource = (resourceUserId: string, currentUserId: string, currentUserRole: string) => {
  // Admin can access any resource
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // Users can only access their own resources
  return resourceUserId === currentUserId;
};

// Check if user can modify resource
export const canModifyResource = (resourceUserId: string, currentUserId: string, currentUserRole: string) => {
  // Admin can modify any resource
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // Users can only modify their own resources
  return resourceUserId === currentUserId;
};
