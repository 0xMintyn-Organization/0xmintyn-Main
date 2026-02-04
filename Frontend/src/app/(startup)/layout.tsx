"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Protected from "@/hooks/useProtected";
import useAuth from "@/hooks/userAuth";
import { isStartupUser } from "@/lib/onboarding";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useLogOutQuery } from "@/redux/features/auth/authApi";
import { LayoutDashboard, User, LogOut, Menu, Moon, Sun, Target, Users, DollarSign, MessageSquare, UserCircle } from "lucide-react";
import { setStartupViewMode } from "@/lib/startupViewMode";

const startupNav = [
  { name: "Dashboard", href: "/startup/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/startup/profile", icon: User },
  { name: "Milestones", href: "/startup/milestones", icon: Target },
  { name: "Hiring", href: "/startup/hiring", icon: Users },
  { name: "Team", href: "/startup/team", icon: Users },
  { name: "Funding & money", href: "/startup/funding", icon: DollarSign },
  { name: "Messenger", href: "/startup/messenger", icon: MessageSquare },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {startupNav.map(({ name, href, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/startup/dashboard" && pathname?.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-green-600 text-white"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{name}</span>
          </Link>
        );
      })}
    </>
  );
}

function StartupLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { logout: authLogout } = useAuthContext();
  const [logoutRequested, setLogoutRequested] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useLogOutQuery(undefined, { skip: !logoutRequested });

  const handleLogout = () => {
    setLogoutRequested(true);
    setTimeout(() => authLogout(), 150);
  };

  const handleViewAsMember = () => {
    setStartupViewMode("normal");
    router.push("/dashboard");
  };

  return (
    <div className="antialiased bg-background text-foreground min-h-screen flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 z-30 w-64 h-screen hidden lg:block border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <Link href="/startup/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="Equalmint" className="w-10 h-10 object-contain" />
            <span className="font-bold text-lg">Startup Hub</span>
          </Link>
        </div>
        <nav className="p-2 space-y-1 mt-4">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      <div className="flex flex-col flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 bg-background border-b border-border px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b border-border text-left">
                  <SheetTitle className="flex items-center gap-3">
                    <img src="/logo.png" alt="Equalmint" className="w-10 h-10 object-contain" />
                    <span>Startup Hub</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-2 space-y-1 mt-4">
                  <NavLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-sm text-muted-foreground hidden sm:inline">Startup dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAsMember}
              className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <UserCircle className="w-4 h-4" />
              View as member
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}


export default function StartupLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !isStartupUser(user)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  return (
    <Protected>
      {!isLoading && user && isStartupUser(user) ? (
        <StartupLayoutContent>{children}</StartupLayoutContent>
      ) : !isLoading && user && !isStartupUser(user) ? (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <Spinner />
      )}
    </Protected>
  );
}
