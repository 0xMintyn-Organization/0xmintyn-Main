"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeftRight,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  Vote
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    badge: null,
    description: "Overview & Analytics"
  },
  { 
    name: "Marketplace", 
    href: "/marketplace", 
    icon: ShoppingBag,
    badge: "New",
    badgeColor: "bg-green-100 text-green-800",
    description: "Buy & Sell Products"
  },
  { 
    name: "Education Hub", 
    href: "/educationhub", 
    icon: GraduationCap,
    badge: "12",
    badgeColor: "bg-blue-100 text-blue-800",
    description: "Courses & Learning"
  },
  { 
    name: "Exchange", 
    href: "/exchange", 
    icon: ArrowLeftRight,
    badge: null,
    description: "Trade & Swap"
  },
  { 
    name: "Governance", 
    href: "/governance", 
    icon: Vote,
    badge: "3",
    badgeColor: "bg-purple-100 text-purple-800",
    description: "Vote on Proposals"
  },
  { 
    name: "My Profile", 
    href: "/myprofile", 
    icon: User,
    badge: null,
    description: "Personal Settings"
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    badge: null,
    description: "App Configuration"
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 w-72 h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
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
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">John Doe</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Premium Member</p>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs">
              PRO
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
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ name, href, icon: Icon, badge, badgeColor, description }) => {
          const isActive = pathname === href;
          
          return (
            <Link
              key={name}
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
          );
        })}
      </nav>

   

   
    </div>
  );
}