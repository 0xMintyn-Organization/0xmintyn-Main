"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "../ui/button";
import { Moon, Sun, LogOut, LayoutDashboard } from "lucide-react";
import MobileSidebar from "../Sidebar/MobileSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogOutQuery } from "@/redux/features/auth/authApi";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import equalUsdService from "@/services/equalUsdService";
import { isStartupUser } from "@/lib/onboarding";
import { getStartupViewMode, setStartupViewMode } from "@/lib/startupViewMode";

function Header() {
    const { theme, toggleTheme } = useTheme();
    const { user, logout: authLogout } = useAuth();
    const router = useRouter();
    const [logoutRequested, setLogoutRequested] = useState(false);
    const isStartup = user ? isStartupUser(user) : false;
    const viewingAsNormal = isStartup && getStartupViewMode() === "normal";
    const [equalUsdBalance, setEqualUsdBalance] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            equalUsdService.getBalance()
                .then((res) => res.success && typeof res.balance === "number" ? setEqualUsdBalance(res.balance) : setEqualUsdBalance(0))
                .catch(() => setEqualUsdBalance(0));
        } else {
            setEqualUsdBalance(null);
        }
    }, [user]);

    const handleStartupMode = () => {
        setStartupViewMode("startup");
        router.push("/startup/dashboard");
    };

    // Call backend logout endpoint when logoutRequested is true
    useLogOutQuery(undefined, {
        skip: !logoutRequested,
    });

    const handleLogout = async () => {
        try {
            // Trigger backend logout first (clears cookies/session)
            setLogoutRequested(true);
            
            // Wait a moment for the logout query to execute
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then clear frontend auth state
            authLogout();
        } catch (error) {
            console.error('Logout error:', error);
            // Even if backend logout fails, clear frontend state
            authLogout();
        }
    };

    return (
        <header className="flex justify-between items-center px-4 sm:px-8 py-2 w-full">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img 
                            src="/logo.png" 
                            alt="Equalmint Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="font-bold text-xl">
                        <span className="hidden lg:inline">Equalmint Community Hub</span>
                        <span className="lg:hidden">EQM Community Hub</span>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {viewingAsNormal && (
                    <Button
                        onClick={handleStartupMode}
                        className="hidden sm:inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-3 py-2 text-sm"
                    >
                        <LayoutDashboard size={18} />
                        Startup mode
                    </Button>
                )}
                <Button
                    aria-label={theme}
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-gray-700 dark:bg-gray-400"
                >
                    {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                </Button>
                
                {equalUsdBalance !== null && (
                    <Button
                        className="hidden lg:block bg-green-900 text-white hover:bg-green-700 font-semibold rounded-3xl px-3 text-xs"
                        aria-label="EqualUSD Balance"
                    >
                        {equalUsdBalance} EqualUSD
                    </Button>
                )}

                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="flex items-center gap-2 text-sm font-medium border-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    aria-label="Logout"
                >
                    <LogOut size={16} />
                    Logout
                </Button>
            </div>
        </header>
    );
}

export default Header;