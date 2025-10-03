'use client';

import ServiceGrid from '@/components/Marketplace/ServiceGrid';
import SearchFilters from '@/components/Marketplace/SearchFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Grid, List, Search, SortAsc, SortDesc, Users, Clock, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMarketplace } from '@/contexts/MarketplaceContext';

export default function AllServicesPage() {
  const { searchQuery, setSearchQuery } = useMarketplace();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deliveryTime, setDeliveryTime] = useState<string>('any');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchServices();
  }, [searchQuery, sortBy, selectedCategories, deliveryTime]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch services with filters
      // For now, using mock data
      setServices([]);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applied filters:', filters);
    // Implement filter logic here
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy('newest');
    setDeliveryTime('any');
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

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span>1,200+ Services Available</span>
            <span>•</span>
            <span>800+ Active Freelancers</span>
            <span>•</span>
            <span>99% Success Rate</span>
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

        {/* Services Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {loading ? 'Loading services...' : `${services.length} Services Found`}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Showing all services</span>
            </div>
          </div>

          <ServiceGrid 
            viewMode={viewMode} 
            searchQuery={searchQuery}
          />
        </div>
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
