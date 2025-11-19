"use client";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBookmarkCount } from "@/hooks/useBookmarkCount";
import { useRole } from "@/hooks/useRole";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  ChevronRight,
  ChevronDown,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  User,
  UserCheck,
  Users,
  MessageSquare,
  Star,
  Vote,
  Store
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Role-based navigation items
const getNavItems = (userRole: string, bookmarkCount: number, hasPurchases: boolean = false, isSeller: boolean = false) => {
  // Build marketplace submenu dynamically based on user status
  const marketplaceChildren = [
    {
      name: "Marketplace Home",
      href: "/marketplace",
      icon: Store,
      description: "Browse All"
    },
    {
      name: "Products",
      href: "/marketplace/products",
      icon: ShoppingCart,
      description: "Digital Products"
    },
    {
      name: "Services",
      href: "/marketplace/services",
      icon: Store,
      description: "Professional Services"
    },
    {
      name: "Messages",
      href: "/marketplace/messages",
      icon: MessageSquare,
      description: "Chat with Sellers"
    }
  ];

  // Add user dashboard if they have purchases
  if (hasPurchases || isSeller) {
    marketplaceChildren.push({
      name: "User Dashboard",
      href: "/marketplace/user-dashboard",
      icon: ShoppingCart,
      description: "My Orders & Purchases"
    });
  }

  // Add seller dashboard if user is a seller
  if (isSeller) {
    marketplaceChildren.push({
      name: "Seller Dashboard",
      href: "/marketplace/seller-dashboard",
      icon: Store,
      description: "My Sales & Orders"
    });
  }

  const publicItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      badge: null,
      description: "Overview & Analytics"
    },
    { 
      name: "Education", 
      href: "#", 
      icon: GraduationCap,
      badge: "12",
      badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      description: "Courses & Learning",
      hasSubmenu: true,
      children: [
        {
          name: "Education Hub",
          href: "/educationhub",
          icon: BookOpen,
          description: "Browse All Courses"
        },
        {
          name: "My Learning",
          href: "/my-courses",
          icon: GraduationCap,
          description: "Continue Learning"
        },
        {
          name: "Bookmarks",
          href: "/bookmarks",
          icon: Bookmark,
          description: "Saved Courses"
        }
      ]
    },
    { 
      name: "Marketplace", 
      href: "#", 
      icon: Store,
      badge: "New",
      badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      description: "Digital Products & Services",
      hasSubmenu: true,
      children: marketplaceChildren
    },
    { 
      name: "Governance", 
      href: "/governance", 
      icon: Vote,
      badge: "3",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      description: "Community Proposals"
    },
    { 
      name: "Exchange", 
      href: "/exchange", 
      icon: TrendingUp,
      badge: "New",
      badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      description: "Trade 0xMintyn Tokens"
    },
    { 
      name: "P2P Trading", 
      href: "/p2p-trading", 
      icon: Users,
      badge: "Live",
      badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      description: "Buy/Sell OXM Directly"
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings,
      badge: null,
      description: "App Configuration"
    },
    { 
      name: "Profile", 
      href: "/myprofile", 
      icon: User,
      badge: null,
      description: "Personal Settings"
    }
  ];

  const userItems = [
    // User-specific items are now in submenus
  ];

  const instructorItems = [
    { 
      name: "Instructor Hub", 
      href: "#", 
      icon: GraduationCap,
      badge: "Pro",
      badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      description: "Teaching Dashboard",
      hasSubmenu: true,
      children: [
        {
          name: "Dashboard",
          href: "/instructor/dashboard",
          icon: LayoutDashboard,
          description: "Overview & Stats"
        },
        {
          name: "My Courses",
          href: "/instructor/my_courses",
          icon: BookOpen,
          description: "Manage Courses"
        },
        {
          name: "My Purchased Courses",
          href: "/instructor/purchased-courses",
          icon: ShoppingCart,
          description: "Courses I Bought"
        },
        {
          name: "Create Course",
          href: "/create-course",
          icon: Plus,
          description: "New Course"
        },
        {
          name: "Students",
          href: "/instructor/students",
          icon: Users,
          description: "Student Management"
        },
        {
          name: "Earnings",
          href: "/instructor/earnings",
          icon: DollarSign,
          description: "Revenue & Payouts"
        },
        {
          name: "Analytics",
          href: "/instructor/analytics",
          icon: BarChart3,
          description: "Course Performance"
        }
      ]
    }
  ];

  const adminItems = [
    { 
      name: "Admin Panel", 
      href: "/admin", 
      icon: Shield,
      badge: "Admin",
      badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      description: "System Management"
    },
    { 
      name: "User Management", 
      href: "/admin/users", 
      icon: UserCheck,
      badge: null,
      description: "Manage Users"
    },
    { 
      name: "Education Management", 
      href: "#", 
      icon: GraduationCap,
      badge: null,
      description: "Education Platform",
      hasSubmenu: true,
      children: [
        {
          name: "All Courses",
          href: "/admin/courses",
          icon: BookOpen,
          description: "Manage All Courses"
        },
        {
          name: "Course Reviews",
          href: "/admin/reviews",
          icon: Star,
          description: "Manage Reviews"
        },
        {
          name: "Course Orders",
          href: "/admin/orders",
          icon: ShoppingCart,
          description: "Orders & Transactions"
        }
      ]
    },
    { 
      name: "Marketplace Management", 
      href: "#", 
      icon: Store,
      badge: null,
      description: "Marketplace Admin",
      hasSubmenu: true,
      children: [
        {
          name: "Dashboard",
          href: "/admin/marketplace",
          icon: LayoutDashboard,
          description: "Marketplace Overview"
        },
        {
          name: "Sellers",
          href: "/admin/marketplace/sellers",
          icon: Users,
          description: "Manage Sellers"
        },
        {
          name: "Products",
          href: "/admin/marketplace/products",
          icon: ShoppingCart,
          description: "Manage Products"
        },
        {
          name: "Services",
          href: "/admin/marketplace/services",
          icon: Store,
          description: "Manage Services"
        },
        {
          name: "Orders",
          href: "/admin/marketplace/orders",
          icon: FileText,
          description: "Marketplace Orders"
        },
        {
          name: "Reviews",
          href: "/admin/marketplace/reviews",
          icon: Star,
          description: "Marketplace Reviews"
        },
        {
          name: "Analytics",
          href: "/admin/marketplace/analytics",
          icon: BarChart3,
          description: "Sales Analytics"
        }
      ]
    },
    { 
      name: "Governance Management", 
      href: "/admin/governance", 
      icon: Vote,
      badge: "Admin",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      description: "Manage Proposals"
    },
    { 
      name: "Analytics", 
      href: "/analytics", 
      icon: TrendingUp,
      badge: null,
      description: "Platform Analytics"
    }
  ];

  // Combine items based on role
  let items = [...publicItems];
  
  if (userRole === 'user') {
    items = [...publicItems, ...userItems];
  } else if (userRole === 'instructor') {
    items = [...publicItems, ...instructorItems];
  } else if (userRole === 'admin') {
    items = [...publicItems, ...adminItems];
  }

  return items;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useRole();
  const { bookmarkCount } = useBookmarkCount();
  
  // Check if user has any purchased items
  const hasPurchases = user && (
    (user.purchasedItems && user.purchasedItems.length > 0) ||
    (user.purchasedProducts && user.purchasedProducts.length > 0) ||
    (user.purchasedServices && user.purchasedServices.length > 0)
  );
  
  // Check if user is a seller
  const isSeller = user?.isSeller || false;
  
  const navItems = getNavItems(user?.role || 'user', bookmarkCount, hasPurchases, isSeller);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  return (
    <div className="fixed left-0 w-72 h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="0xMintyn Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              0xMintyn
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Community Hub</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10 ring-2 ring-green-600 ring-offset-2">
              <AvatarImage src={user?.avatar || "https://github.com/shadcn.png"} />
              <AvatarFallback>{(user?.username || user?.name)?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.username || user?.name || "User"}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                {user?.role === 'instructor' ? 'Instructor' : 
                 user?.role === 'admin' ? 'Administrator' : 'Member'}
              </p>
            </div>
            <Badge className={`text-xs ${
              user?.role === 'admin' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' :
              user?.role === 'instructor' ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
              'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
            }`}>
              {user?.role === 'admin' ? 'ADMIN' : 
               user?.role === 'instructor' ? 'PRO' : 'USER'}
            </Badge>
          </div>
          
          {/* Wallet Balance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Wallet Balance</span>
              <span className="font-semibold text-green-600">$1,234.56</span>
            </div>
            <Progress value={75} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 sidebar-scroll">
        {navItems.map((item) => {
          const { name, href, icon: Icon, badge, badgeColor, description, hasSubmenu, children } = item;
          const isActive = pathname === href;
          const isExpanded = expandedMenus.includes(name);
          
          const toggleSubmenu = () => {
            if (hasSubmenu) {
              setExpandedMenus(prev => 
                prev.includes(name) 
                  ? prev.filter(menu => menu !== name)
                  : [...prev, name]
              );
            }
          };
          
          return (
            <div key={name}>
              {/* Main Menu Item */}
              {hasSubmenu ? (
                <button
                  onClick={toggleSubmenu}
                  className={`
                    group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left
                    ${isActive 
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/25" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300"
                    }
                  `}
                >
                  {/* Icon with animation */}
                  <div className={`
                    transition-transform duration-200 
                    ${isActive ? "scale-110" : "group-hover:scale-110"}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Text and Description */}
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isActive ? "text-white" : ""}`}>
                      {name}
                    </p>
                    {!isActive && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                        {description}
                      </p>
                    )}
                  </div>
                  
                  {/* Badge or Arrow */}
                  {badge ? (
                    <Badge className={`${badgeColor} text-xs`}>
                      {badge}
                    </Badge>
                  ) : (
                    <ChevronDown className={`
                      w-4 h-4 transition-all duration-200
                      ${isActive 
                        ? "text-white opacity-70" 
                        : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                      }
                      ${isExpanded ? "rotate-180" : ""}
                    `} />
                  )}
                </button>
              ) : (
                <Link
                  href={href}
                  className={`
                    group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/25" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300"
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}
                  
                  {/* Icon with animation */}
                  <div className={`
                    transition-transform duration-200 
                    ${isActive ? "scale-110" : "group-hover:scale-110"}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Text and Description */}
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isActive ? "text-white" : ""}`}>
                      {name}
                    </p>
                    {!isActive && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                        {description}
                      </p>
                    )}
                  </div>
                  
                  {/* Badge or Arrow */}
                  {badge ? (
                    <Badge className={`${badgeColor} text-xs`}>
                      {badge}
                    </Badge>
                  ) : (
                    <ChevronRight className={`
                      w-4 h-4 transition-all duration-200
                      ${isActive 
                        ? "opacity-100 translate-x-0" 
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                      }
                    `} />
                  )}
                </Link>
              )}
              
              {/* Submenu Items */}
              {hasSubmenu && isExpanded && children && (
                <div className="ml-4 mt-1 space-y-1">
                  {children.map((child) => {
                    const childIsActive = pathname === child.href;
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`
                          group relative flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                          ${childIsActive 
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md" 
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400"
                          }
                        `}
                      >
                        {/* Icon */}
                        <child.icon className="w-4 h-4" />
                        
                        {/* Text */}
                        <div className="flex-1">
                          <p className={`text-sm ${childIsActive ? "text-white" : ""}`}>
                            {child.name}
                          </p>
                          {!childIsActive && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              {child.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </div>
  );
}