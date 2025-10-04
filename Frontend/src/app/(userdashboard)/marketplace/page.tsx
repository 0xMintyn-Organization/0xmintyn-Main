'use client';

import CategoryGrid from '@/components/Marketplace/CategoryGrid';
import HeroSection from '@/components/Marketplace/HeroSection';
import ProductGrid from '@/components/Marketplace/ProductGrid';
import QuickViewModal from '@/components/Marketplace/QuickViewModal';
import SearchFilters from '@/components/Marketplace/SearchFilters';
import ServiceGrid from '@/components/Marketplace/ServiceGrid';
import BecomeSellerModal from '@/components/Marketplace/BecomeSellerModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { Filter, Grid, List, Plus, Search, Store, Package, Users, TrendingUp, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export default function MarketplacePage(): React.JSX.Element {
  const { user } = useAuth();
  const { activeTab, searchQuery, setSearchQuery } = useMarketplace();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<unknown>(null);
  const [showBecomeSeller, setShowBecomeSeller] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  
  // Dynamic data state
  const [products, setProducts] = useState<unknown[]>([]);
  const [services, setServices] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  
  // Stats state
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalServices: 0,
    totalSellers: 0,
    successRate: 0
  });

  // Category stats state
  const [categoryStats, setCategoryStats] = useState<{
    products: Record<string, number>;
    services: Record<string, number>;
  } | undefined>(undefined);

  // API Functions
  const fetchMarketplaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        categories: selectedCategories.join(','),
        sortBy,
        type: activeTab
      };

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/search`, {
        params,
        withCredentials: true
      });

      if (response.data.success) {
        console.log('API Response:', response.data);
        if (activeTab === 'products') {
          setProducts(response.data.data.items || []);
          console.log('Set products:', response.data.data.items);
        } else {
          setServices(response.data.data.items || []);
          console.log('Set services:', response.data.data.items);
        }
        
        setTotalPages(response.data.data.pagination.totalPages || 1);
        setTotalItems(response.data.data.pagination.totalItems || 0);
        setStats(response.data.stats || {
          totalProducts: 0,
          totalServices: 0,
          totalSellers: 0,
          successRate: 0
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching marketplace data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, currentPage, selectedCategories, sortBy, itemsPerPage]);

  // Fetch category stats
  const fetchCategoryStats = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/category-stats`, {
        withCredentials: true
      });

      if (response.data.success) {
        setCategoryStats(response.data.categoryStats);
        console.log('Category stats:', response.data.categoryStats);
      }
    } catch (error: unknown) {
      console.error('Error fetching category stats:', error);
    }
  }, []);

  // Check seller status on component mount
  useEffect(() => {
    if (user) {
      setIsSeller(user.isSeller || false);
    }
  }, [user]);

  // Fetch marketplace data
  useEffect(() => {
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  // Fetch category stats on component mount
  useEffect(() => {
    fetchCategoryStats();
  }, [fetchCategoryStats]);

  const handleQuickView = (product: unknown) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApplyFilters = (filters: any) => {
    setSelectedCategories(filters.categories || []);
    setSortBy(filters.sortBy || 'newest');
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleBecomeSellerSuccess = () => {
    setIsSeller(true);
    setShowBecomeSeller(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Dynamic Stats Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Digital Products</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalProducts.toLocaleString()}+</p>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Sellers</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalSellers.toLocaleString()}+</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Services</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalServices.toLocaleString()}+</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.successRate}%</p>
                  </div>
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
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
        <CategoryGrid 
          activeTab={activeTab} 
          categoryStats={categoryStats}
          loading={loading}
        />
        
        {/* Enhanced Search and Filter Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-4">
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
                    Advanced Filters
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

              {/* Quick Filters */}
              <div className="space-y-3">
                {/* Categories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Website Templates', 'Design Assets', 'Code Templates', 'E-books & Guides', 'Software & Tools', 'Stock Media'].map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategories.includes(category) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          selectedCategories.includes(category)
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'hover:bg-green-50 dark:hover:bg-green-950/20'
                        }`}
                        onClick={() => handleCategoryToggle(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</h4>
                  <div className="flex gap-2">
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'price-low', label: 'Price: Low to High' },
                      { value: 'price-high', label: 'Price: High to Low' },
                      { value: 'popular', label: 'Most Popular' },
                      { value: 'rating', label: 'Highest Rated' }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy(option.value)}
                        className={sortBy === option.value ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedCategories.length > 0 || sortBy !== 'newest') && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header - Only show when there's an active search or filter */}
        {(searchQuery || selectedCategories.length > 0 || sortBy !== 'newest') && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading {activeTab}...
                  </div>
                ) : error ? (
                  <span className="text-red-600">Error loading {activeTab}</span>
                ) : (
                  `${totalItems} ${activeTab} found`
                )}
              </h2>
              {!loading && !error && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchMarketplaceData} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        {!error && (
          <>
            {activeTab === 'products' ? (
              <ProductGrid 
                viewMode={viewMode} 
                searchQuery={searchQuery}
                onQuickView={handleQuickView}
                products={products}
                loading={loading}
                hasActiveSearch={!!searchQuery || selectedCategories.length > 0 || sortBy !== 'newest'}
              />
            ) : (
              <ServiceGrid 
                viewMode={viewMode} 
                searchQuery={searchQuery}
                services={services}
                loading={loading}
                hasActiveSearch={!!searchQuery || selectedCategories.length > 0 || sortBy !== 'newest'}
              />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Featured Sections - Temporarily disabled to test dynamic data */}
        {/* {!loading && !error && (
          <FeaturedSection activeTab={activeTab} />
        )} */}
      </div>

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
          product={selectedProduct as any} // eslint-disable-line @typescript-eslint/no-explicit-any
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