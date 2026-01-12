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
    priceRange: [0, 500],
    rating: 0,
    categories: [] as string[],
    brands: [] as string[],
    fileFormats: [] as string[],
    licenses: [] as string[]
  });

  const categories = [
    'Website Templates', 'Design Assets', 'Code Templates', 'E-books & Guides',
    'Software & Tools', 'Stock Media', 'Fonts & Typography', '3D Assets'
  ];

  const brands = [
    'WebCraft', 'DesignPro', 'PhotoStock', 'CryptoEdu', 'CodeMaster', 'TypeCraft',
    'TechEdu', 'MarketingGuru', 'AI Academy', 'CreativeStudio', 'DigitalHub', 'PixelCraft'
  ];

  const fileFormats = [
    'HTML/CSS', 'Figma/Sketch', 'JPG/PNG', 'PDF', 'React Native', 'TTF/OTF',
    'MP4', 'MP3', 'ZIP', 'PSD', 'AI', 'SVG'
  ];

  const licenses = [
    'Personal', 'Commercial', 'Extended', 'Standard', 'Premium', 'Lifetime'
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
                <span>{filters.priceRange[0]} 0XM</span>
                <span>{filters.priceRange[1]} 0XM</span>
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

          {/* File Formats */}
          <div>
            <h3 className="font-semibold mb-3">File Formats</h3>
            <div className="grid grid-cols-2 gap-2">
              {fileFormats.map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={format}
                    checked={filters.fileFormats.includes(format)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('fileFormats', [...filters.fileFormats, format]);
                      } else {
                        handleFilterChange('fileFormats', filters.fileFormats.filter(f => f !== format));
                      }
                    }}
                  />
                  <label htmlFor={format} className="text-sm cursor-pointer">
                    {format}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Licenses */}
          <div>
            <h3 className="font-semibold mb-3">License Types</h3>
            <div className="space-y-2">
              {licenses.map((license) => (
                <div key={license} className="flex items-center space-x-2">
                  <Checkbox
                    id={license}
                    checked={filters.licenses.includes(license)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('licenses', [...filters.licenses, license]);
                      } else {
                        handleFilterChange('licenses', filters.licenses.filter(l => l !== license));
                      }
                    }}
                  />
                  <label htmlFor={license} className="text-sm cursor-pointer">
                    {license}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(filters.categories.length > 0 || filters.brands.length > 0 || filters.fileFormats.length > 0 || filters.licenses.length > 0) && (
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
                {filters.fileFormats.map((format) => (
                  <Badge key={format} variant="secondary" className="cursor-pointer">
                    {format} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.licenses.map((license) => (
                  <Badge key={license} variant="secondary" className="cursor-pointer">
                    {license} <X className="w-3 h-3 ml-1" />
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
