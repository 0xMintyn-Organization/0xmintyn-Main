'use client';

import React from 'react';
import { Search, ShoppingCart, Heart, Bell, User, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MarketplaceHeaderProps {
  activeTab: 'products' | 'services';
  onTabChange: (tab: 'products' | 'services') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function MarketplaceHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: MarketplaceHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className=" shadow-sm border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 ">0xMintyn</h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">Marketplace</span>
          </div>

          {/* Navigation Tabs */}
                  <div className="flex space-x-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
                    <Button
                      variant={activeTab === 'products' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTabChange('products')}
                      className={activeTab === 'products' 
                        ? "bg-green-900 hover:bg-green-800 text-white" 
                        : "hover:bg-gray-200 dark:hover:bg-zinc-600"
                      }
                    >
                      Digital Products
                    </Button>
                    <Button
                      variant={activeTab === 'services' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTabChange('services')}
                      className={activeTab === 'services' 
                        ? "bg-green-900 hover:bg-green-800 text-white" 
                        : "hover:bg-gray-200 dark:hover:bg-zinc-600"
                      }
                    >
                      Services
                    </Button>
                  </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search digital products and services..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Favorites */}
            <Button variant="ghost" size="sm" className="relative">
              <Heart className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                12
              </Badge>
            </Button>

            {/* Shopping Cart */}
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                5
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="hidden md:block">John Doe</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>My Orders</DropdownMenuItem>
                <DropdownMenuItem>My Favorites</DropdownMenuItem>
                <DropdownMenuItem>My Reviews</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sell on Marketplace</DropdownMenuItem>
                <DropdownMenuItem>Seller Dashboard</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
