'use client';

import React, { useState } from 'react';
import { Star, Heart, Clock, User, CheckCircle, MessageCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';

// Sample service data
const sampleServices = [
  {
    id: 1,
    title: "Professional Logo Design",
    price: 25,
    originalPrice: 50,
    rating: 4.9,
    reviewCount: 1247,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop",
    seller: "DesignPro",
    sellerLevel: "Level 2",
    deliveryTime: "3 days",
    description: "I will create a unique, professional logo for your business",
    isOnline: true,
    badge: "Best Seller",
    packages: [
      { name: "Basic", price: 25, features: ["2 concepts", "2 revisions", "PNG & JPG"] },
      { name: "Standard", price: 50, features: ["3 concepts", "3 revisions", "All formats", "Source files"] },
      { name: "Premium", price: 100, features: ["5 concepts", "Unlimited revisions", "All formats", "Source files", "Brand guidelines"] }
    ]
  },
  {
    id: 2,
    title: "Website Development - React/Next.js",
    price: 150,
    originalPrice: 200,
    rating: 4.8,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    seller: "CodeMaster",
    sellerLevel: "Top Rated",
    deliveryTime: "7 days",
    description: "I will build a modern, responsive website using React and Next.js",
    isOnline: true,
    badge: "Top Rated",
    packages: [
      { name: "Basic", price: 150, features: ["5 pages", "Responsive design", "Basic SEO"] },
      { name: "Standard", price: 300, features: ["10 pages", "Responsive design", "SEO optimized", "CMS integration"] },
      { name: "Premium", price: 500, features: ["Unlimited pages", "Advanced features", "SEO optimized", "CMS integration", "Maintenance"] }
    ]
  },
  {
    id: 3,
    title: "Content Writing & Copywriting",
    price: 20,
    originalPrice: 30,
    rating: 4.7,
    reviewCount: 234,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
    seller: "WordSmith",
    sellerLevel: "Level 2",
    deliveryTime: "2 days",
    description: "I will write engaging, SEO-optimized content for your website",
    isOnline: false,
    badge: "Popular",
    packages: [
      { name: "Basic", price: 20, features: ["500 words", "1 revision", "SEO optimized"] },
      { name: "Standard", price: 40, features: ["1000 words", "2 revisions", "SEO optimized", "Research included"] },
      { name: "Premium", price: 80, features: ["2000 words", "3 revisions", "SEO optimized", "Research included", "Keyword analysis"] }
    ]
  },
  {
    id: 4,
    title: "Digital Marketing Strategy",
    price: 75,
    originalPrice: 100,
    rating: 4.9,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    seller: "MarketingGuru",
    sellerLevel: "Pro",
    deliveryTime: "5 days",
    description: "I will create a comprehensive digital marketing strategy for your business",
    isOnline: true,
    badge: "Pro",
    packages: [
      { name: "Basic", price: 75, features: ["Strategy document", "Social media plan", "1 revision"] },
      { name: "Standard", price: 150, features: ["Strategy document", "Social media plan", "Content calendar", "2 revisions"] },
      { name: "Premium", price: 300, features: ["Strategy document", "Social media plan", "Content calendar", "Analytics setup", "3 revisions"] }
    ]
  },
  {
    id: 5,
    title: "Video Editing & Production",
    price: 50,
    originalPrice: 75,
    rating: 4.6,
    reviewCount: 78,
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop",
    seller: "VideoPro",
    sellerLevel: "Level 2",
    deliveryTime: "4 days",
    description: "I will edit your video with professional quality and effects",
    isOnline: false,
    badge: "Trending",
    packages: [
      { name: "Basic", price: 50, features: ["Up to 5 minutes", "Basic editing", "1 revision"] },
      { name: "Standard", price: 100, features: ["Up to 10 minutes", "Advanced editing", "2 revisions", "Color correction"] },
      { name: "Premium", price: 200, features: ["Up to 20 minutes", "Professional editing", "3 revisions", "Color correction", "Motion graphics"] }
    ]
  },
  {
    id: 6,
    title: "SEO Optimization & Audit",
    price: 40,
    originalPrice: 60,
    rating: 4.8,
    reviewCount: 92,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    seller: "SEOSpecialist",
    sellerLevel: "Top Rated",
    deliveryTime: "3 days",
    description: "I will optimize your website for search engines and provide detailed audit",
    isOnline: true,
    badge: "Expert",
    packages: [
      { name: "Basic", price: 40, features: ["SEO audit", "Keyword research", "Basic optimization"] },
      { name: "Standard", price: 80, features: ["Comprehensive audit", "Keyword research", "On-page optimization", "Technical SEO"] },
      { name: "Premium", price: 150, features: ["Full audit", "Keyword research", "Complete optimization", "Technical SEO", "Link building strategy"] }
    ]
  }
];

interface ServiceGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  services?: any[];
  loading?: boolean;
  hasActiveSearch?: boolean;
}

export default function ServiceGrid({ viewMode, searchQuery, services, loading, hasActiveSearch }: ServiceGridProps) {
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (serviceId: number) => {
    setFavorites(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Use dynamic services from API - no fallback to sample data
  const displayServices = services || [];
  
  const filteredServices = displayServices.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.seller?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading services...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no services AND there's an active search/filter
  if (!loading && displayServices.length === 0 && hasActiveSearch) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No services found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      </div>
    );
  }

  // If no active search and no services, don't show anything (let the parent handle it)
  if (!loading && displayServices.length === 0 && !hasActiveSearch) {
    return null;
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {filteredServices.map((service, index) => (
          <Card key={service.id || `service-list-${index}`} className="hover:shadow-md transition-shadow">
            <div className="flex">
              <div className="relative w-48 h-32 flex-shrink-0">
                {service.image ? (
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover rounded-l-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-l-lg">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {service.badge && (
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                    {service.badge}
                  </Badge>
                )}
                {service.isOnline && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">{service.seller}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {service.sellerLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">{service.deliveryTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(service.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {service.rating} ({service.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {service.packages.slice(0, 3).map((pkg, index) => (
                        <div key={index} className="text-xs bg-muted px-2 py-1 rounded">
                          {pkg.name}: ${pkg.price}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-foreground">
                        Starting at ${service.price}
                      </span>
                      {service.originalPrice > service.price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ${service.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavorite(service.id)}
                        className={favorites.includes(service.id) ? 'text-red-500' : ''}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-green-900 hover:bg-green-800 text-white">
                        Order Now
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredServices.map((service, index) => (
        <Card key={service.id || `service-${index}`} className="group hover:shadow-lg transition-all duration-200 hover:scale-105 border-zinc-200 dark:border-zinc-700">
          <div className="relative">
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              {service.image ? (
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <Briefcase className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {service.badge && (
                <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                  {service.badge}
                </Badge>
              )}
              {service.isOnline && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(service.id)}
                  className={`bg-background shadow-md ${
                    favorites.includes(service.id) ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{service.seller}</span>
                <Badge variant="secondary" className="text-xs">
                  {service.sellerLevel}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {service.deliveryTime}
              </div>
            </div>
            
            <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-heading transition-colors">
              {service.title}
            </h3>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center space-x-1 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(service.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-1">
                {service.rating} ({service.reviewCount})
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                  Starting at ${service.price}
                </span>
                {service.originalPrice > service.price && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                    ${service.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {service.packages.slice(0, 2).map((pkg, index) => (
                <div key={index} className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded">
                  {pkg.name}: ${pkg.price}
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Button className="w-full bg-green-900 hover:bg-green-800 text-white">
              Order Now
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
