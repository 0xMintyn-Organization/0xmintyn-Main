"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBookmarkCount } from "@/hooks/useBookmarkCount";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Crown,
  DollarSign,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  ShoppingCart,
  User,
  Users,
  Vote
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  // Dashboard - Available to all
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["user", "instructor", "admin"],
  },
  
  // Public Pages - Available to all
  {
    name: "Education Hub",
    href: "/educationhub",
    icon: BookOpen,
    roles: ["user", "instructor", "admin"],
  },
  {
    name: "Governance",
    href: "/governance",
    icon: Vote,
    roles: ["user", "instructor", "admin"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["user", "instructor", "admin"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    roles: ["user", "instructor", "admin"],
  },

  // User-specific navigation
  {
    name: "My Learning",
    href: "/my-learning",
    icon: BookOpen,
    roles: ["user"],
    children: [
      {
        name: "My Courses",
        href: "/my-courses",
        icon: BookOpen,
        roles: ["user"],
      },
      {
        name: "Bookmarks",
        href: "/bookmarks",
        icon: Heart,
        roles: ["user"],
        badge: "0", // Will be updated dynamically
      },
    ],
  },

  // Instructor-specific navigation
  {
    name: "Instructor Hub",
    href: "/instructor",
    icon: GraduationCap,
    roles: ["instructor", "admin"],
    children: [
      {
        name: "My Courses",
        href: "/instructor/my_courses",
        icon: BookOpen,
        roles: ["instructor", "admin"],
      },
      {
        name: "My Purchased Courses",
        href: "/instructor/purchased-courses",
        icon: ShoppingCart,
        roles: ["instructor", "admin"],
      },
      {
        name: "Create Course",
        href: "/instructor/courses/create",
        icon: Plus,
        roles: ["instructor", "admin"],
      },
      {
        name: "Course Analytics",
        href: "/instructor/analytics",
        icon: BarChart3,
        roles: ["instructor", "admin"],
      },
      {
        name: "Students",
        href: "/instructor/students",
        icon: Users,
        roles: ["instructor", "admin"],
      },
      {
        name: "Earnings",
        href: "/instructor/earnings",
        icon: DollarSign,
        roles: ["instructor", "admin"],
      },
    ],
  },

  // Admin-specific navigation
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Crown,
    roles: ["admin"],
    children: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: Home,
        roles: ["admin"],
      },
      {
        name: "User Management",
        href: "/admin/users",
        icon: Users,
        roles: ["admin"],
      },
      {
        name: "Course Management",
        href: "/admin/courses",
        icon: BookOpen,
        roles: ["admin"],
      },
      {
        name: "Order Management",
        href: "/admin/orders",
        icon: ShoppingCart,
        roles: ["admin"],
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: ["admin"],
      },
      {
        name: "System Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["admin"],
      },
      {
        name: "Governance Management",
        href: "/admin/governance",
        icon: Vote,
        roles: ["admin"],
      },
    ],
  },

  // Support & Help - Available to all
  {
    name: "Support",
    href: "/support",
    icon: HelpCircle,
    roles: ["user", "instructor", "admin"],
    children: [
      {
        name: "Help Center",
        href: "/help",
        icon: HelpCircle,
        roles: ["user", "instructor", "admin"],
      },
      {
        name: "Contact Us",
        href: "/contact",
        icon: MessageSquare,
        roles: ["user", "instructor", "admin"],
      },
      {
        name: "Documentation",
        href: "/docs",
        icon: FileText,
        roles: ["user", "instructor", "admin"],
      },
    ],
  },
];

interface AdvancedSidebarProps {
  className?: string;
}

export default function AdvancedSidebar({ className }: AdvancedSidebarProps) {
  const { user } = useSelector((state: any) => state.auth);
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { bookmarkCount } = useBookmarkCount();

  if (!user) return null;

  const filteredNavigation = navigation.map((item) => {
    if (item.name === "My Learning" && item.children) {
      return {
        ...item,
        children: item.children.map((child) => {
          if (child.name === "Bookmarks") {
            return {
              ...child,
              badge: bookmarkCount > 0 ? bookmarkCount.toString() : undefined
            };
          }
          return child;
        })
      };
    }
    return item;
  }).filter((item) => item.roles.includes(user.role));

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isItemActive = isActive(item.href);
    const isParentItemActive = isParentActive(item);

    if (hasChildren) {
      return (
        <Collapsible
          key={item.name}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.name)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-10 px-3",
                level > 0 && "ml-4",
                isParentItemActive && "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
              )}
            >
              <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.name}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors h-10",
          level > 0 && "ml-4",
          isItemActive
            ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        )}
      >
        <item.icon
          className={cn(
            "mr-3 h-4 w-4 flex-shrink-0",
            isItemActive
              ? "text-green-500"
              : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
          )}
        />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            {user.role === 'admin' ? (
              <Crown className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : user.role === 'instructor' ? (
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.username || `${user.firstName} ${user.lastName}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-700 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <Bell className="w-4 h-4 mr-3" />
          Notifications
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
