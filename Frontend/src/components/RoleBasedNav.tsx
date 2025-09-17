"use client";

import { useSelector } from "react-redux";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Crown,
  GraduationCap,
  User,
  Home,
  Plus,
  List,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["user", "instructor", "admin"],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Crown,
    roles: ["admin"],
  },
  {
    name: "My Courses",
    href: "/instructor/my_courses",
    icon: BookOpen,
    roles: ["instructor"],
  },
  {
    name: "Create Course",
    href: "/instructor/courses/create",
    icon: Plus,
    roles: ["instructor"],
  },
  {
    name: "Instructor Analytics",
    href: "/instructor/analytics",
    icon: BarChart3,
    roles: ["instructor"],
  },
  {
    name: "User Management",
    href: "/admin",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "My Courses",
    href: "/my-courses",
    icon: BookOpen,
    roles: ["user"],
  },
  {
    name: "Browse Courses",
    href: "/educationhub",
    icon: List,
    roles: ["user"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    roles: ["user", "instructor", "admin"],
  },
];

export default function RoleBasedNav() {
  const { user } = useSelector((state: any) => state.auth);
  const pathname = usePathname();

  if (!user) return null;

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <nav className="space-y-1">
      {filteredNavigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                isActive
                  ? "text-green-500"
                  : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
