'use client';

import ServiceGrid from '@/components/Marketplace/ServiceGrid';
import SearchFilters from '@/components/Marketplace/SearchFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Grid, List, Search, SortAsc, SortDesc, Users, Clock, Star, ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import axios from 'axios';

export default function AllServicesPage() {
  const { searchQuery, setSearchQuery } = useMarketplace();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deliveryTime, setDeliveryTime] = useState<string>('any');
  
  // Dynamic data state
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);
  
  // Stats state
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalServices: 0,
    totalSellers: 0,
    successRate: 0
  });

  // Categories for filtering
  const categories = [
    'Web Development',
    'Mobile App Development',
    'UI/UX Design',
    'Graphic Design',
    'Digital Marketing',
    'Content Writing',
    'Video Editing',
    'Photography',
    'Consulting',
    'Data Analysis',
    'SEO Services',
    'E-commerce Development'
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'delivery', label: 'Fastest Delivery' }
  ];

  // Delivery time options
  const deliveryOptions = [
    { value: 'any', label: 'Any Time' },
    { value: '1-day', label: '1 Day' },
    { value: '3-days', label: '3 Days' },
    { value: '1-week', label: '1 Week' },
    { value: '2-weeks', label: '2 Weeks' },
    { value: '1-month', label: '1 Month+' }
  ];

  // API Functions
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        categories: selectedCategories.join(','),
        sortBy,
        type: 'services'
      };

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/search`, {
        params,
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Services API Response:', response.data);
        setServices(response.data.data.items || []);
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
      console.error('Error fetching services:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, selectedCategories, sortBy, itemsPerPage]);

  // Fetch services when dependencies change
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleApplyFilters = (filters: any) => {
    setSelectedCategories(filters.categories || []);
    setSortBy(filters.sortBy || 'newest');
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1); // Reset to first page when category changes
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy('newest');
    setDeliveryTime('any');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setError(null);
    fetchServices();
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                All Services
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Find professional services from skilled freelancers
              </p>
            </div>
          </div>

          {/* Dynamic Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span>{stats.totalServices.toLocaleString()}+ Services Available</span>
            <span>•</span>
            <span>{stats.totalSellers.toLocaleString()}+ Active Freelancers</span>
            <span>•</span>
            <span>{stats.successRate}% Success Rate</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search & Filter Services</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search services..."
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
                        className={viewMode === 'grid' ? 'bg-blue-900 hover:bg-blue-800 text-white rounded-r-none' : 'rounded-r-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-blue-900 hover:bg-blue-800 text-white rounded-l-none' : 'rounded-l-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-4">
                  {/* Categories */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge
                          key={category}
                          variant={selectedCategories.includes(category) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedCategories.includes(category)
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
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
                      {sortOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={sortBy === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy(option.value)}
                          className={sortBy === option.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Time */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Time</h4>
                    <div className="flex gap-2">
                      {deliveryOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={deliveryTime === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryTime(option.value)}
                          className={deliveryTime === option.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading services...
                </div>
              ) : error ? (
                <span className="text-red-600">Error loading services</span>
              ) : (
                `${totalItems} Services Found`
              )}
            </h2>
            {!loading && !error && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
              </p>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load services</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={handleRetry} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        {!error && (
          <div className="mb-8">
            <ServiceGrid 
              viewMode={viewMode} 
              searchQuery={searchQuery}
              services={services}
              loading={loading}
              hasActiveSearch={!!searchQuery || selectedCategories.length > 0 || sortBy !== 'newest'}
            />

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
                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
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
          </div>
        )}
      </div>

      {/* Search Filters Modal */}
      <SearchFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
}
