'use client';

import React, { useState } from 'react';
import { Menu, X, Search, ShoppingCart, Heart, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MobileNavigationProps {
  activeTab: 'products' | 'services';
  onTabChange: (tab: 'products' | 'services') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function MobileNavigation({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { name: 'Products', tab: 'products' as const },
    { name: 'Services', tab: 'services' as const },
    { name: 'Categories', href: '/marketplace/categories' },
    { name: 'Deals', href: '/marketplace/deals' },
    { name: 'Sell', href: '/marketplace/sell' },
  ];

  const userMenuItems = [
    { name: 'My Orders', href: '/marketplace/orders' },
    { name: 'My Favorites', href: '/marketplace/favorites' },
    { name: 'My Reviews', href: '/marketplace/reviews' },
    { name: 'Account Settings', href: '/marketplace/settings' },
    { name: 'Help & Support', href: '/marketplace/support' },
  ];

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="bg-background shadow-sm border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-green-600 dark:text-green-400">0xMintyn</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">Marketplace</span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <Button variant="ghost" size="sm">
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                5
              </Badge>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Marketplace Menu</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products and services..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Tab Toggle */}
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={activeTab === 'products' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        onTabChange('products');
                        setIsOpen(false);
                      }}
                      className="flex-1"
                    >
                      Products
                    </Button>
                    <Button
                      variant={activeTab === 'services' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        onTabChange('services');
                        setIsOpen(false);
                      }}
                      className="flex-1"
                    >
                      Services
                    </Button>
                  </div>

                  {/* Navigation Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">Browse</h3>
                    <div className="space-y-2">
                      {navigationItems.map((item) => (
                        <Button
                          key={item.name}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* User Menu */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">Account</h3>
                    <div className="space-y-2">
                      {userMenuItems.map((item) => (
                        <Button
                          key={item.name}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Start Selling
                      </Button>
                      <Button variant="outline" className="w-full">
                        Become a Seller
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex border-t">
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            className="flex-1 rounded-none"
            onClick={() => onTabChange('products')}
          >
            Products
          </Button>
          <Button
            variant={activeTab === 'services' ? 'default' : 'ghost'}
            className="flex-1 rounded-none"
            onClick={() => onTabChange('services')}
          >
            Services
          </Button>
        </div>
      </div>
    </div>
  );
}
