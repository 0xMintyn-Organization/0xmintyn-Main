'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, Heart, Bell, User, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
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
  const pathname = usePathname();
  
  // Check if we're on marketplace pages
  const isMarketplace = pathname?.includes('/marketplace');
  
  // Get marketplace state from context
  const marketplaceState = isMarketplace ? useMarketplace() : null;
  
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="0xMintyn Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="font-bold text-xl">
                {isMarketplace ? (
                  <span className="text-green-600 dark:text-green-400">Marketplace</span>
                ) : (
                  <>
                    <span className="hidden lg:inline">0xMintyn Community Hub</span>
                    <span className="lg:hidden">OXM Community Hub</span>
                  </>
                )}
              </div>
            </Link>
          </div>

          {/* Center - Marketplace Navigation Tabs (only on marketplace pages) */}
          {isMarketplace && marketplaceState && (
            <div className="hidden lg:flex space-x-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
              <Button
                variant={marketplaceState.activeTab === 'products' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => marketplaceState.setActiveTab('products')}
                className={marketplaceState.activeTab === 'products' 
                  ? "bg-green-900 hover:bg-green-800 text-white" 
                  : "hover:bg-gray-200 dark:hover:bg-zinc-600"
                }
              >
                Digital Products
              </Button>
              <Button
                variant={marketplaceState.activeTab === 'services' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => marketplaceState.setActiveTab('services')}
                className={marketplaceState.activeTab === 'services' 
                  ? "bg-green-900 hover:bg-green-800 text-white" 
                  : "hover:bg-gray-200 dark:hover:bg-zinc-600"
                }
              >
                Services
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/marketplace/products'}
                className="hover:bg-gray-200 dark:hover:bg-zinc-600"
              >
                All Products
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/marketplace/services'}
                className="hover:bg-gray-200 dark:hover:bg-zinc-600"
              >
                All Services
              </Button>
            </div>
          )}

          {/* Search Bar (only on marketplace pages) */}
          {isMarketplace && marketplaceState && (
            <div className="flex-1 max-w-md mx-8 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search digital products and services..."
                  value={marketplaceState.searchQuery}
                  onChange={(e) => marketplaceState.setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
          )}

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

            {/* OXM Balance */}
            <Button
              className="hidden lg:block bg-green-900 text-white hover:bg-green-700 font-semibold rounded-3xl px-3 text-xs"
              aria-label="Earning Balance"
            >
              1000 OXM
            </Button>

            {/* Marketplace specific actions (only on marketplace pages) */}
            {isMarketplace && (
              <>
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
              </>
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
                <DropdownMenuItem>My Orders</DropdownMenuItem>
                <DropdownMenuItem>My Favorites</DropdownMenuItem>
                <DropdownMenuItem>My Reviews</DropdownMenuItem>
                <DropdownMenuSeparator />
                {isMarketplace && (
                  <>
                    <DropdownMenuItem>
                      <Link href="/marketplace/create-product">Create Product</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/marketplace/create-service">Create Service</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/seller-dashboard">Seller Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Marketplace Navigation (only on marketplace pages) */}
        {isMarketplace && marketplaceState && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-700 py-2">
            <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
              <Button
                variant={marketplaceState.activeTab === 'products' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => marketplaceState.setActiveTab('products')}
                className={marketplaceState.activeTab === 'products' 
                  ? "bg-green-900 hover:bg-green-800 text-white" 
                  : "hover:bg-gray-200 dark:hover:bg-zinc-600"
                }
              >
                Products
              </Button>
              <Button
                variant={marketplaceState.activeTab === 'services' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => marketplaceState.setActiveTab('services')}
                className={marketplaceState.activeTab === 'services' 
                  ? "bg-green-900 hover:bg-green-800 text-white" 
                  : "hover:bg-gray-200 dark:hover:bg-zinc-600"
                }
              >
                Services
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/marketplace/products'}
                className="hover:bg-gray-200 dark:hover:bg-zinc-600"
              >
                All Products
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/marketplace/services'}
                className="hover:bg-gray-200 dark:hover:bg-zinc-600"
              >
                All Services
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
