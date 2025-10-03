'use client';

import CategoryGrid from '@/components/Marketplace/CategoryGrid';
import FeaturedSection from '@/components/Marketplace/FeaturedSection';
import HeroSection from '@/components/Marketplace/HeroSection';
import MarketplaceHeader from '@/components/Marketplace/MarketplaceHeader';
import MobileNavigation from '@/components/Marketplace/MobileNavigation';
import ProductGrid from '@/components/Marketplace/ProductGrid';
import QuickViewModal from '@/components/Marketplace/QuickViewModal';
import SearchFilters from '@/components/Marketplace/SearchFilters';
import ServiceGrid from '@/components/Marketplace/ServiceGrid';
import BecomeSellerModal from '@/components/marketplace/BecomeSellerModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Grid, List, Search, Store, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBecomeSeller, setShowBecomeSeller] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  // Check seller status on component mount
  useEffect(() => {
    if (user) {
      setIsSeller(user.isSeller || false);
    }
  }, [user]);

  const handleQuickView = (product: any) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applied filters:', filters);
    // Implement filter logic here
  };

  const handleBecomeSellerSuccess = () => {
    setIsSeller(true);
    setShowBecomeSeller(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <MarketplaceHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Seller Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    {isSeller ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Welcome back, Seller!
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Manage your products, services, and track your sales performance
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Start Selling on Our Marketplace
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Join thousands of sellers earning from digital products and services
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {isSeller ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.location.href = '/marketplace/create-product'}
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Product
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/marketplace/create-service'}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Service
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/seller-dashboard'}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 gap-2"
                    >
                      <Store className="h-4 w-4" />
                      View Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowBecomeSeller(true)}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Become a Seller
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Category Grid */}
        <CategoryGrid activeTab={activeTab} />
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search digital products and services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-green-900 hover:bg-green-800 text-white rounded-r-none' : 'rounded-r-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-green-900 hover:bg-green-800 text-white rounded-l-none' : 'rounded-l-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' ? (
          <ProductGrid 
            viewMode={viewMode} 
            searchQuery={searchQuery}
            onQuickView={handleQuickView}
          />
        ) : (
          <ServiceGrid 
            viewMode={viewMode} 
            searchQuery={searchQuery}
          />
        )}

        {/* Featured Sections */}
        <FeaturedSection activeTab={activeTab} />
      </main>

      {/* Search Filters Modal */}
      <SearchFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
      />

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal
          isOpen={showQuickView}
          onClose={() => {
            setShowQuickView(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}

      {/* Become a Seller Modal */}
      <BecomeSellerModal
        isOpen={showBecomeSeller}
        onClose={() => setShowBecomeSeller(false)}
        onSuccess={handleBecomeSellerSuccess}
      />
    </div>
  );
}