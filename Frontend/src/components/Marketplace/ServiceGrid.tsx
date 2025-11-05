'use client';

import React from 'react';
import { Clock, MessageCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ServiceGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  services?: any[];
  loading?: boolean;
  hasActiveSearch?: boolean;
}

export default function ServiceGrid({ viewMode, searchQuery, services, loading, hasActiveSearch }: ServiceGridProps) {

  // Use dynamic services from API - no fallback to sample data
  const displayServices = services || [];
  
  // Filter services based on search query (client-side filtering for immediate feedback)
  const filteredServices = displayServices.filter(service =>
    service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get minimum price from packages
  const getMinPrice = (service: any) => {
    if (service.packages && service.packages.length > 0) {
      return Math.min(...service.packages.map((pkg: any) => pkg.price || 0));
    }
    return 0;
  };

  // Helper function to get seller badge based on level
  const getSellerBadge = (seller: any) => {
    if (!seller) return null;
    
    if (seller.sellerLevel === 'Top Rated' || seller.sellerLevel === 'Pro') {
      return seller.sellerLevel;
    }
    if (seller.verified) {
      return 'Verified';
    }
    return null;
  };

  // Helper function to construct full image URLs (same as ProductGrid)
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-service.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Handle environment variable with trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'https://appbackend.0xmintyn.com';
    
    // Remove trailing slash if present
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Helper function to get service image
  const getServiceImage = (service: any) => {
    return service.thumbnailImage || (service.images && service.images[0]) || null;
  };

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
        {filteredServices.map((service, index) => {
          const serviceImage = getServiceImage(service);
          const minPrice = getMinPrice(service);
          const sellerBadge = getSellerBadge(service.sellerId);
          
          return (
            <Card key={service._id || `service-list-${index}`} className="hover:shadow-md transition-shadow">
              <div className="flex">
                <Link href={`/marketplace/service/${service._id}`}>
                  <div className="relative w-48 h-32 flex-shrink-0 cursor-pointer">
                    {serviceImage ? (
                      <Image
                        src={getFullImageUrl(serviceImage)}
                        alt={service.title || 'Service'}
                        fill
                        className="object-cover rounded-l-lg"
                        onError={(e) => {
                          console.error('Service image load error:', e);
                          e.currentTarget.src = '/placeholder-service.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-l-lg">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {sellerBadge && (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                        {sellerBadge}
                      </Badge>
                    )}
                    {service.isFeatured && (
                      <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                </Link>
                
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/marketplace/service/${service._id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer">
                          {service.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {service.description}
                      </p>
                      
                      {service.sellerId && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                          by <span className="font-medium">{service.sellerId.sellerName || service.sellerId.storeName}</span>
                          {service.sellerId.sellerLevel && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                              • {service.sellerId.sellerLevel}
                            </span>
                          )}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {service.deliveryTime || 'Flexible'}
                          </span>
                        </div>
                      </div>

                    
                      {service.packages && service.packages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {service.packages.slice(0, 3).map((pkg: any, idx: number) => (
                            <div key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {pkg.name}: ${pkg.price}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-6">
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          Starting at ${minPrice}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Link href={`/marketplace/service/${service._id}`}>
                          <Button size="sm" className="bg-green-900 hover:bg-green-800 text-white">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      {filteredServices.map((service, index) => {
        const serviceImage = getServiceImage(service);
        const minPrice = getMinPrice(service);
        const sellerBadge = getSellerBadge(service.sellerId);
        
        return (
          <Card key={service._id || `service-${index}`} className="group hover:shadow-lg transition-all duration-200 hover:scale-105 border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <Link href={`/marketplace/service/${service._id}`}>
                <div className="aspect-video relative overflow-hidden rounded-t-lg cursor-pointer">
                  {serviceImage ? (
                    <OptimizedImage
                      src={serviceImage}
                      alt={service.title || 'Service'}
                      fill
                      className="group-hover:scale-110 transition-transform duration-300"
                      fallbackSrc="/placeholder-service.jpg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {sellerBadge && (
                    <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                      {sellerBadge}
                    </Badge>
                  )}
                  {service.isFeatured && (
                    <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                      Featured
                    </Badge>
                  )}
                </div>
              </Link>
            </div>

            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  {service.deliveryTime || 'Flexible'}
                </div>
              </div>
              
              <Link href={`/marketplace/service/${service._id}`}>
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-heading transition-colors cursor-pointer hover:text-green-600 dark:hover:text-green-400">
                  {service.title}
                </h3>
              </Link>

              {service.sellerId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  by <span className="font-medium">{service.sellerId.sellerName || service.sellerId.storeName}</span>
                </p>
              )}

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {service.description}
              </p>


              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-200">
                    Starting at ${minPrice}
                  </span>
                </div>
              </div>

              {service.packages && service.packages.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {service.packages.slice(0, 2).map((pkg: any, idx: number) => (
                    <div key={idx} className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded">
                      {pkg.name}: ${pkg.price}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Link href={`/marketplace/service/${service._id}`} className="w-full">
                <Button className="w-full bg-green-900 hover:bg-green-800 text-white">
                  View Details
                </Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
