'use client';

import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

export default function SearchFilters({ isOpen, onClose, onApplyFilters }: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    rating: 0,
    categories: [] as string[],
    brands: [] as string[],
    shipping: [] as string[],
    condition: [] as string[]
  });

  const categories = [
    'Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports', 'Beauty',
    'Toys', 'Automotive', 'Health', 'Jewelry', 'Tools', 'Music'
  ];

  const brands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Dell', 'HP', 'Canon',
    'Microsoft', 'Google', 'Amazon', 'Bose'
  ];

  const shippingOptions = [
    'Free Shipping', 'Express Delivery', 'Same Day Delivery', 'International'
  ];

  const conditions = [
    'New', 'Like New', 'Good', 'Fair', 'Refurbished'
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      rating: 0,
      categories: [],
      brands: [],
      shipping: [],
      condition: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-zinc-200 dark:border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filter & Sort</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="font-semibold mb-3">Price Range</h3>
            <div className="space-y-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
                max={1000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-semibold mb-3">Minimum Rating</h3>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant={filters.rating >= star ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('rating', star)}
                >
                  {star}+ Stars
                </Button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-3">Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('categories', [...filters.categories, category]);
                      } else {
                        handleFilterChange('categories', filters.categories.filter(c => c !== category));
                      }
                    }}
                  />
                  <label htmlFor={category} className="text-sm cursor-pointer">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-semibold mb-3">Brands</h3>
            <div className="grid grid-cols-2 gap-2">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={filters.brands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('brands', [...filters.brands, brand]);
                      } else {
                        handleFilterChange('brands', filters.brands.filter(b => b !== brand));
                      }
                    }}
                  />
                  <label htmlFor={brand} className="text-sm cursor-pointer">
                    {brand}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h3 className="font-semibold mb-3">Shipping Options</h3>
            <div className="space-y-2">
              {shippingOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={filters.shipping.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('shipping', [...filters.shipping, option]);
                      } else {
                        handleFilterChange('shipping', filters.shipping.filter(s => s !== option));
                      }
                    }}
                  />
                  <label htmlFor={option} className="text-sm cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <h3 className="font-semibold mb-3">Condition</h3>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={filters.condition.includes(condition)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('condition', [...filters.condition, condition]);
                      } else {
                        handleFilterChange('condition', filters.condition.filter(c => c !== condition));
                      }
                    }}
                  />
                  <label htmlFor={condition} className="text-sm cursor-pointer">
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(filters.categories.length > 0 || filters.brands.length > 0 || filters.shipping.length > 0 || filters.condition.length > 0) && (
            <div>
              <h3 className="font-semibold mb-3">Active Filters</h3>
              <div className="flex flex-wrap gap-2">
                {filters.categories.map((category) => (
                  <Badge key={category} variant="secondary" className="cursor-pointer">
                    {category} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.brands.map((brand) => (
                  <Badge key={brand} variant="secondary" className="cursor-pointer">
                    {brand} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.shipping.map((option) => (
                  <Badge key={option} variant="secondary" className="cursor-pointer">
                    {option} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.condition.map((condition) => (
                  <Badge key={condition} variant="secondary" className="cursor-pointer">
                    {condition} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
