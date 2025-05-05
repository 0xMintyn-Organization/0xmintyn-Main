"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "../ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import MobileSidebar from "../Sidebar/MobileSidebar";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLogOutQuery } from "@/redux/features/auth/authApi";
import { useState } from "react";
import { redirect } from "next/navigation";

function Header() {
    const { theme, toggleTheme } = useTheme();
    const { data: session } = useSession();
    const [logout, setLogout] = useState(false);
    const { } = useLogOutQuery(undefined, {
        skip: !logout ? true : false,
    });

    const handleLogout = async () => {
        setLogout(true);
        await signOut();
        redirect("/login");
    };


    return (
        <div className="bg-white dark:bg-zinc-800 fixed top-0 left-0 z-50 w-full shadow-sm border-b border-zinc-200 dark:border-zinc-700">
            <header className="px-8 py-2 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <MobileSidebar />
                    <Link href="/registration-form" className="font-bold text-xl">
                        <span className="hidden lg:inline">OXMINTYN Community Hub</span>
                        <span className="lg:hidden">OXM Community Hub</span>
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
                        1000 OXM
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
        </div>
    );
}

export default Header;
