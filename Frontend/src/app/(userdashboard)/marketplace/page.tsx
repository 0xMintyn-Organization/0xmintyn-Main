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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Grid, List, Search } from 'lucide-react';
import { useState } from 'react';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleQuickView = (product: any) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applied filters:', filters);
    // Implement filter logic here
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
    </div>
  );
}