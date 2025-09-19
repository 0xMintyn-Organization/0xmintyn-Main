import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URI;

// Role management API service
export const roleService = {
  // Get all users (Admin only)
  getAllUsers: async (params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.role && params.role !== "all") queryParams.append("role", params.role);
    if (params.search) queryParams.append("search", params.search);

    const response = await axios.get(
      `${API_BASE_URL}role/users?${queryParams}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Update user role (Admin only)
  updateUserRole: async (userId: string, role: string) => {
    const response = await axios.put(
      `${API_BASE_URL}/role/users/${userId}/role`,
      { role },
      { withCredentials: true }
    );
    return response.data;
  },

  // Delete user (Admin only)
  deleteUser: async (userId: string) => {
    const response = await axios.delete(
      `${API_BASE_URL}role/users/${userId}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get user profile
  getUserProfile: async (userId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}role/users/${userId}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Update user profile
  updateUserProfile: async (userId: string, profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
  }) => {
    const response = await axios.put(
      `${API_BASE_URL}role/users/${userId}`,
      profileData,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get role-based dashboard data
  getRoleDashboard: async () => {
    const response = await axios.get(
      `${API_BASE_URL}role/dashboard`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Request instructor role
  requestInstructorRole: async () => {
    const response = await axios.post(
      `${API_BASE_URL}role/request-instructor`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },
};

// Role-based access control utilities
export const roleUtils = {
  // Check if user has specific role
  hasRole: (userRole: string, requiredRoles: string | string[]): boolean => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userRole);
  },

  // Check if user is admin
  isAdmin: (userRole: string): boolean => {
    return userRole === "admin";
  },

  // Check if user is instructor
  isInstructor: (userRole: string): boolean => {
    return userRole === "instructor";
  },

  // Check if user is instructor or admin
  isInstructorOrAdmin: (userRole: string): boolean => {
    return ["instructor", "admin"].includes(userRole);
  },

  // Get role display name
  getRoleDisplayName: (role: string): string => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "instructor":
        return "Instructor";
      case "user":
        return "User";
      default:
        return "Unknown";
    }
  },

  // Get role color class
  getRoleColorClass: (role: string): string => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "instructor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "user":
        return "bg-gray-100 text-gray-800 dark:bg-zinc-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-900 dark:text-gray-300";
    }
  },

  // Get role icon
  getRoleIcon: (role: string): string => {
    switch (role) {
      case "admin":
        return "crown";
      case "instructor":
        return "graduation-cap";
      case "user":
        return "user";
      default:
        return "user";
    }
  },
};

// Role-based navigation configuration
export const roleNavigation = {
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Analytics", href: "/analytics", icon: "bar-chart-3" },
    { name: "Admin Panel", href: "/admin", icon: "crown" },
    { name: "Profile", href: "/profile", icon: "user" },
  ],
  instructor: [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "My Courses", href: "/instructor/my_courses", icon: "book-open" },
    { name: "My Purchased Courses", href: "/instructor/purchased-courses", icon: "shopping-cart" },
    { name: "Create Course", href: "/create-course", icon: "plus" },
    { name: "Analytics", href: "/instructor/analytics", icon: "bar-chart-3" },
    { name: "Profile", href: "/profile", icon: "user" },
  ],
  user: [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "My Courses", href: "/my-courses", icon: "book-open" },
    { name: "Profile", href: "/profile", icon: "user" },
  ],
};

export default roleService;
