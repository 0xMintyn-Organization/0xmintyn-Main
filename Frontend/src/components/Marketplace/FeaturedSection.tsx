'use client';

import React from 'react';
import { Star, TrendingUp, Clock, Award, Users, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const featuredProducts = [
  {
    id: 1,
    title: "Premium Website Template Pack",
    price: 49,
    originalPrice: 99,
    rating: 4.8,
    reviewCount: 124,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
    badge: "Best Seller"
  },
  {
    id: 2,
    title: "Professional UI/UX Design Kit",
    price: 29,
    originalPrice: 59,
    rating: 4.7,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop",
    badge: "Sale"
  },
  {
    id: 3,
    title: "Stock Photo Collection - Business",
    price: 19,
    originalPrice: 39,
    rating: 4.9,
    reviewCount: 234,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    badge: "Hot"
  },
  {
    id: 4,
    title: "React Native App Template",
    price: 199,
    originalPrice: 299,
    rating: 4.6,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop",
    badge: "New"
  }
];

const featuredServices = [
  {
    id: 1,
    title: "Professional Logo Design",
    price: 25,
    rating: 4.9,
    reviewCount: 1247,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop",
    seller: "DesignPro",
    deliveryTime: "3 days",
    badge: "Best Seller"
  },
  {
    id: 2,
    title: "Website Development - React/Next.js",
    price: 150,
    rating: 4.8,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
    seller: "CodeMaster",
    deliveryTime: "7 days",
    badge: "Top Rated"
  },
  {
    id: 3,
    title: "Digital Marketing Strategy",
    price: 75,
    rating: 4.9,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
    seller: "MarketingGuru",
    deliveryTime: "5 days",
    badge: "Pro"
  },
  {
    id: 4,
    title: "Content Writing & Copywriting",
    price: 20,
    rating: 4.7,
    reviewCount: 234,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
    seller: "WordSmith",
    deliveryTime: "2 days",
    badge: "Popular"
  }
];

const trendingStats = [
  { icon: TrendingUp, label: "Trending Products", value: "1,250", color: "text-blue-600" },
  { icon: Users, label: "Active Sellers", value: "2,500", color: "text-green-600" },
  { icon: Zap, label: "Services Completed", value: "15,000", color: "text-purple-600" },
  { icon: Award, label: "Top Rated Items", value: "98%", color: "text-yellow-600" }
];

interface FeaturedSectionProps {
  activeTab: 'products' | 'services';
}

export default function FeaturedSection({ activeTab }: FeaturedSectionProps) {
  const featuredItems = activeTab === 'products' ? featuredProducts : featuredServices;

  return (
    <div className="mt-16">
    

      {/* Featured Items */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
            {activeTab === 'products' ? 'Trending Products' : 'Top-Rated Services'}
          </h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-105 border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    {item.badge}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-200 dark:text-white mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {item.title}
                </h3>

                {activeTab === 'services' && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Users className="w-4 h-4 mr-1" />
                    {(item as any).seller}
                    <div className="flex items-center ml-2">
                      <Clock className="w-4 h-4 mr-1" />
                      {(item as any).deliveryTime}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-1 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(item.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    {item.rating} ({item.reviewCount})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                      ${item.price}
                    </span>
                    {item.originalPrice > item.price && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                        ${item.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* New Arrivals */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
            {activeTab === 'products' ? 'New Arrivals' : 'Popular Services This Week'}
          </h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-700 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.slice(0, 3).map((item, index) => (
              <div key={`new-${item.id}`} className="bg-background rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 dark:text-white mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(item.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                        {item.rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                      ${item.price}
                    </div>
                    {item.originalPrice > item.price && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        ${item.originalPrice}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Selling?
        </h2>
        <p className="text-xl mb-6 opacity-90">
          Join thousands of sellers who are already making money on our marketplace
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 dark:bg-zinc-800 dark:text-green-400 dark:hover:bg-zinc-700">
            Start Selling Products
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 dark:border-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-300 dark:hover:text-green-600">
            Offer Services
          </Button>
        </div>
      </div>
    </div>
  );
}
