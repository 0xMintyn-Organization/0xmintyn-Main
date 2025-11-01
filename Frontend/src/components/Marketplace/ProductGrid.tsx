/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ShoppingCart, Eye, Download, FileText, Image as ImageIcon, Code, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useAccessibility } from '@/lib/accessibility';
import { LoadingGrid, EmptyState, ErrorState } from '@/components/ui/LoadingStates';

// Sample digital product data
const sampleProducts = [
  {
    id: 1,
    title: "Premium Website Template Pack",
    price: 29,
    originalPrice: 59,
    rating: 4.8,
    reviewCount: 124,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    brand: "WebCraft",
    delivery: "Instant Download",
    badge: "Best Seller",
    type: "Template",
    fileFormat: "HTML/CSS",
    fileSize: "25.4 MB",
    license: "Commercial"
  },
  {
    id: 2,
    title: "Professional UI/UX Design Kit",
    price: 49,
    originalPrice: 79,
    rating: 4.7,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop",
    brand: "DesignPro",
    delivery: "Instant Download",
    badge: "Sale",
    type: "Design Assets",
    fileFormat: "Figma/Sketch",
    fileSize: "12.8 MB",
    license: "Extended"
  },
  {
    id: 3,
    title: "Stock Photo Collection - Business",
    price: 19,
    originalPrice: 39,
    rating: 4.6,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    brand: "PhotoStock",
    delivery: "Instant Download",
    badge: "New",
    type: "Stock Photos",
    fileFormat: "JPG/PNG",
    fileSize: "45.2 MB",
    license: "Standard"
  },
  {
    id: 4,
    title: "Cryptocurrency Trading eBook",
    price: 39,
    originalPrice: 79,
    rating: 4.9,
    reviewCount: 234,
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop",
    brand: "CryptoEdu",
    delivery: "Instant Download",
    badge: "Hot",
    type: "E-book",
    fileFormat: "PDF",
    fileSize: "8.7 MB",
    license: "Personal"
  },
  {
    id: 5,
    title: "React Native App Template",
    price: 199,
    originalPrice: 299,
    rating: 4.5,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
    brand: "CodeMaster",
    delivery: "Instant Download",
    badge: "Trending",
    type: "Code Template",
    fileFormat: "React Native",
    fileSize: "156.3 MB",
    license: "Commercial"
  },
  {
    id: 6,
    title: "Premium Font Collection",
    price: 49,
    originalPrice: 99,
    rating: 4.8,
    reviewCount: 78,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    brand: "TypeCraft",
    delivery: "Instant Download",
    badge: "Popular",
    type: "Fonts",
    fileFormat: "TTF/OTF",
    fileSize: "12.1 MB",
    license: "Extended"
  }
];

interface ProductGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onQuickView?: (product: any) => void;
  products?: any[];
  loading?: boolean;
  hasActiveSearch?: boolean;
}

export default function ProductGrid({ viewMode, searchQuery, onQuickView, products, loading, hasActiveSearch }: ProductGridProps) {
  const { generateLabel, generateDescription } = useAccessibility();
  console.log('ProductGrid received products:', products);
  console.log('ProductGrid loading:', loading);

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Handle environment variable with trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Use dynamic products from API - no fallback to sample data
  const displayProducts = products || [];
  
  const filteredProducts = displayProducts.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (loading) {
    return <LoadingGrid count={8} />;
  }

  // Show empty state when no products AND there's an active search/filter
  if (!loading && displayProducts.length === 0 && hasActiveSearch) {
    return (
      <EmptyState
        icon={<ShoppingCart className="w-16 h-16 text-gray-400" />}
        title="No products found"
        description="Try adjusting your search or filters to find what you're looking for"
        action={{
          label: "Clear Filters",
          onClick: () => window.location.reload()
        }}
        className="py-12"
      />
    );
  }

  // If no active search and no products, don't show anything (let the parent handle it)
  if (!loading && displayProducts.length === 0 && !hasActiveSearch) {
    return null;
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {filteredProducts.map((product, index) => (
          <Card key={product.id || `product-list-${index}`} className="hover:shadow-md transition-shadow">
            <div className="flex">
              <div className="relative w-48 h-32 flex-shrink-0">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover rounded-l-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 rounded-l-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {product.badge && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    {product.badge}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
                      {product.title}
                    </h3>
                    

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Download className="w-4 h-4 mr-1" />
                        {product.delivery}
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs mr-2">
                          {product.fileFormat}
                        </Badge>
                        <span>{product.fileSize}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="text-xs">
                          {product.license} License
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                        ${product.price}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onQuickView?.(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-900 hover:bg-green-800 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Get Instant Access
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {filteredProducts.map((product, index) => (
        <Card
          key={product._id || product.id || `product-${index}`}
          className="group hover:shadow-lg transition-all duration-200 hover:scale-105 border-zinc-200 dark:border-zinc-700"
          role="article"
          aria-label={generateLabel('product-card', product.title)}
          aria-describedby={`product-${product._id || product.id}-description`}
        >
          <div className="relative">
            <Link href={`/marketplace/product/${product._id || product.id}`}>
              <div className="aspect-square relative overflow-hidden rounded-t-lg cursor-pointer">
                {product.thumbnailImage || product.image ? (
                  <OptimizedImage
                    src={product.thumbnailImage || product.image}
                    alt={product.title}
                    fill
                    className="group-hover:scale-110 transition-transform duration-300"
                    fallbackSrc="/placeholder-product.jpg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </Link>
            {product.badge && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                {product.badge}
              </Badge>
            )}
             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => onQuickView?.(product)}
                 className="bg-background/90 shadow-md text-foreground border"
                 aria-label={generateLabel('view-details', product.title)}
                 title="Quick view"
               >
                 <Eye className="w-4 h-4" />
               </Button>
             </div>
          </div>

          <CardContent className="p-4">
            <div 
              id={`product-${product._id || product.id}-description`}
              className="sr-only"
            >
              {generateDescription('product-card', `${product.title} - ${product.description?.substring(0, 100)}...`)}
            </div>
            <div className="mb-2">
            </div>

            <Link href={`/marketplace/product/${product._id || product.id}`}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-200 dark:text-white mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors cursor-pointer">
                {product.title}
              </h3>
            </Link>


            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                  ${product.price}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                    ${product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-1" />
                {product.delivery}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {product.fileFormat}
                </Badge>
                <span className="text-xs">{product.fileSize}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Link href={`/marketplace/product/${product._id || product.id}`} className="w-full">
              <Button 
                className="w-full bg-green-900 hover:bg-green-800 text-white"
                aria-label={generateLabel('add-to-cart', product.title)}
                title="Get instant access to this product"
              >
                <Download className="w-4 h-4 mr-2" />
                Get Instant Access
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
