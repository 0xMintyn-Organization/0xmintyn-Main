'use client';

import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Eye, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';

// Sample digital product data
const sampleProducts = [
  {
    id: 1,
    title: "Complete Web Development Course",
    price: 99,
    originalPrice: 199,
    rating: 4.8,
    reviewCount: 124,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
    brand: "TechEdu",
    delivery: "Instant Download",
    badge: "Best Seller",
    inStock: true,
    type: "Course"
  },
  {
    id: 2,
    title: "Premium UI/UX Design Kit",
    price: 49,
    originalPrice: 79,
    rating: 4.7,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop",
    brand: "DesignPro",
    delivery: "Instant Download",
    badge: "Sale",
    inStock: true,
    type: "Design Assets"
  },
  {
    id: 3,
    title: "Digital Marketing Masterclass",
    price: 149,
    originalPrice: 299,
    rating: 4.6,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    brand: "MarketingGuru",
    delivery: "Instant Access",
    badge: "New",
    inStock: true,
    type: "Course"
  },
  {
    id: 4,
    title: "Cryptocurrency Trading Guide",
    price: 79,
    originalPrice: 79,
    rating: 4.9,
    reviewCount: 234,
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop",
    brand: "CryptoEdu",
    delivery: "Instant Download",
    badge: "Hot",
    inStock: true,
    type: "E-book"
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
    inStock: true,
    type: "Code Template"
  },
  {
    id: 6,
    title: "AI & Machine Learning Course",
    price: 249,
    originalPrice: 249,
    rating: 4.8,
    reviewCount: 78,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    brand: "AI Academy",
    delivery: "Instant Access",
    badge: "Popular",
    inStock: true,
    type: "Course"
  }
];

interface ProductGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onQuickView?: (product: any) => void;
}

export default function ProductGrid({ viewMode, searchQuery, onQuickView }: ProductGridProps) {
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = sampleProducts.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <div className="flex">
              <div className="relative w-48 h-32 flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover rounded-l-lg"
                />
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
                    <p className="text-sm text-gray-600 mb-2">by {product.brand}</p>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-1" />
                        {product.delivery}
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Lifetime access
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
                        onClick={() => toggleFavorite(product.id)}
                        className={favorites.includes(product.id) ? 'text-red-500' : ''}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onQuickView?.(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        disabled={!product.inStock}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-105 border-zinc-200 dark:border-zinc-700">
          <div className="relative">
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {product.badge && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  {product.badge}
                </Badge>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(product.id)}
                  className={`bg-background/90 shadow-md border ${
                    favorites.includes(product.id) ? 'text-red-500' : 'text-foreground'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuickView?.(product)}
                  className="bg-background/90 shadow-md text-foreground border"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{product.brand}</span>
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-gray-200 dark:text-white mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {product.title}
            </h3>

            <div className="flex items-center space-x-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-1">
                ({product.reviewCount})
              </span>
            </div>

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

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
              <Truck className="w-4 h-4 mr-1" />
              {product.delivery}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
          <Button
            className="w-full bg-green-900 hover:bg-green-800 text-white"
            disabled={!product.inStock}
          >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
