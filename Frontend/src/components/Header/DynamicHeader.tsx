'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, Heart, Bell, User, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import equalUsdService from '@/services/equalUsdService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DynamicHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-background shadow-sm border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Logo and Navigation */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
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

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="p-3 rounded-full bg-gray-700 dark:bg-gray-400"
              aria-label={theme}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </Button>

            {/* EqualUSD Balance */}
            {equalUsdBalance !== null && (
              <Button
                className="hidden lg:block bg-green-900 text-white hover:bg-green-700 font-semibold rounded-3xl px-3 text-xs"
                aria-label="EqualUSD Balance"
              >
                {equalUsdBalance} EqualUSD
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="hidden md:block">{user?.name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
