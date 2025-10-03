'use client';

import ProductGrid from '@/components/Marketplace/ProductGrid';
import SearchFilters from '@/components/Marketplace/SearchFilters';
import QuickViewModal from '@/components/Marketplace/QuickViewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Grid, List, Search, SortAsc, SortDesc, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMarketplace } from '@/contexts/MarketplaceContext';

export default function AllProductsPage() {
  const { searchQuery, setSearchQuery } = useMarketplace();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categories for filtering
  const categories = [
    'Website Templates',
    'Design Assets', 
    'Code Templates',
    'E-books & Guides',
    'Software & Tools',
    'Stock Media',
    'Fonts & Typography',
    '3D Models',
    'Audio & Music',
    'Video Templates'
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, sortBy, selectedCategories]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch products with filters
      // For now, using mock data
      setProducts([]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickView = (product: any) => {
    setSelectedProduct(product);
    setShowQuickView(true);
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
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                All Digital Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover amazing digital products from talented creators
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span>2,500+ Products Available</span>
            <span>•</span>
            <span>1,200+ Active Sellers</span>
            <span>•</span>
            <span>98% Success Rate</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search & Filter Products</span>
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
                        placeholder="Search products..."
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
                      {sortOptions.map((option) => (
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

                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {loading ? 'Loading products...' : `${products.length} Products Found`}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Showing all products</span>
            </div>
          </div>

          <ProductGrid 
            viewMode={viewMode} 
            searchQuery={searchQuery}
            onQuickView={handleQuickView}
          />
        </div>
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
          product={selectedProduct}
        />
      )}
    </div>
  );
}
