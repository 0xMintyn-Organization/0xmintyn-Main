"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "../ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import MobileSidebar from "../Sidebar/MobileSidebar";
import Link from "next/link";
import { useLogOutQuery } from "@/redux/features/auth/authApi";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function Header() {
    const { theme, toggleTheme } = useTheme();
    const { logout: authLogout } = useAuth();
    const [logoutRequested, setLogoutRequested] = useState(false);

    // Call backend logout endpoint when logoutRequested is true
    useLogOutQuery(undefined, {
        skip: !logoutRequested,
    });

    const handleLogout = () => {
        // Trigger backend logout (cookies/session) and clear frontend auth state
        setLogoutRequested(true);
        authLogout(); // Clears local storage/user and redirects to /login
    };

    return (
        <header className="flex justify-between items-center px-4 sm:px-8 py-2 w-full">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                            src="/logo.png" 
                            alt="0xMintyn Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="font-bold text-xl">
                        <span className="hidden lg:inline">0xMintyn Community Hub</span>
                        <span className="lg:hidden">OXM Community Hub</span>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <Button
                    aria-label={theme}
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-gray-700 dark:bg-gray-400"
                >
                    {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                </Button>
                
                <Button
                    className="hidden lg:block bg-green-900 text-white hover:bg-green-700 font-semibold rounded-3xl px-3 text-xs"
                    aria-label="Earning Balance"
                >
                    100 0XM
                </Button>

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