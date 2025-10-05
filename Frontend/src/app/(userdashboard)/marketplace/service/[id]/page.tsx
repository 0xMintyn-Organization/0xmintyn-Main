'use client';

import React, { useState, useEffect } from 'react';
import { Star, Clock, User, CheckCircle, MessageCircle, Award, Shield, Zap, Loader2, AlertCircle, RefreshCw, ArrowLeft, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

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

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/services/${id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setService(response.data.service);
          setRelatedServices(response.data.relatedServices || []);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        console.error('Error fetching service:', err);
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-fetch service
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading service...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Service Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The service you are looking for does not exist.'}</p>
          <div className="space-x-4">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => router.push('/marketplace')}>
              Browse Services
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Service Images */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video relative overflow-hidden rounded-lg bg-card">
                <Image
                  src={getFullImageUrl(service.images?.[selectedImage] || service.thumbnailImage)}
                  alt={service.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('Service image load error:', e);
                    e.currentTarget.src = '/placeholder-product.jpg';
                  }}
                />
            </div>
            <div className="flex space-x-2">
              {(service.images || [service.thumbnailImage]).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={getFullImageUrl(image)}
                    alt={`${service.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Service thumbnail image load error:', e);
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Service Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge className="bg-green-500 text-white">Best Seller</Badge>
                {service.sellerId?.isOnline && (
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-sm">Online</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-4">
                {service.title}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(service.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {service.rating} ({service.reviewCount} reviews)
                </span>
              </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>{service.deliveryTime}</span>
              </div>
            </div>
            </div>

            {/* Service Packages */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-200">Choose a Package</h3>
              {service.packages?.map((pkg, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all ${
                    selectedPackage === index 
                      ? 'border-green-500 bg-green-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{pkg.name}</h4>
                        {pkg.popular && (
                          <Badge className="bg-green-500 text-white">Most Popular</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-200">
                          ${pkg.price}
                        </div>
                        {pkg.originalPrice > pkg.price && (
                          <div className="text-sm text-gray-500 line-through">
                            ${pkg.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {pkg.features.slice(0, 3).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-gray-500">
                          +{pkg.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>


            {/* Order Button */}
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
              Order Now - ${service.packages?.[selectedPackage]?.price || service.price}
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>

            {/* Seller Info Card */}
            {service.sellerId && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12">
                      {service.sellerId.storeLogo ? (
                        <Image
                          src={service.sellerId.storeLogo}
                          alt={service.sellerId.sellerName}
                          fill
                          className="object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {service.sellerId.sellerName?.charAt(0) || 'S'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{service.sellerId.sellerName}</h4>
                        {service.sellerId.verified && (
                          <Badge className="bg-blue-500 text-white text-xs">Verified</Badge>
                        )}
                        <Badge className="bg-green-500 text-white text-xs">{service.sellerId.sellerLevel}</Badge>
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          {service.sellerId.rating || 0} ({service.sellerId.reviewCount || 0})
                        </div>
                        <div className="flex items-center">
                          <Award className="w-3 h-3 mr-1" />
                          {service.sellerId.totalSales || 0} orders
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Service Details Tabs */}
        <Tabs defaultValue="about" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About This Service</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="seller">About Seller</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">{service.description}</p>
                
                <h4 className="font-semibold mb-4">What's Included:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {service.packages?.map((pkg, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${
                      selectedPackage === index ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}>
                      <h5 className="font-medium mb-2">{pkg.name} Package</h5>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {pkg.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {service.reviews?.map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.user}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <h4 className="font-medium mb-1">{review.title}</h4>
                      <p className="text-gray-700">{review.comment}</p>
                      {review.package && (
                        <Badge variant="secondary" className="mt-2">
                          {review.package} Package
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About the Seller</CardTitle>
              </CardHeader>
              <CardContent>
                {service.sellerId ? (
                  <div className="space-y-6">
                    {/* Seller Profile */}
                    <div className="flex items-start space-x-4">
                      <div className="relative w-16 h-16">
                        {service.sellerId.storeLogo ? (
                          <Image
                            src={service.sellerId.storeLogo}
                            alt={service.sellerId.sellerName}
                            fill
                            className="object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                              {service.sellerId.sellerName?.charAt(0) || 'S'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{service.sellerId.sellerName}</h3>
                          {service.sellerId.verified && (
                            <Badge className="bg-blue-500 text-white">Verified</Badge>
                          )}
                          <Badge className="bg-green-500 text-white">{service.sellerId.sellerLevel}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            {service.sellerId.rating || 0} ({service.sellerId.reviewCount || 0} reviews)
                          </div>
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            {service.sellerId.totalSales || 0} orders completed
                          </div>
                        </div>
                        {service.sellerId.responseTime && (
                          <div className="flex items-center text-green-600 text-sm">
                            <Zap className="w-4 h-4 mr-1" />
                            Usually responds in {service.sellerId.responseTime}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seller Description */}
                    {service.sellerId.description && (
                      <div>
                        <h4 className="font-semibold mb-2">About {service.sellerId.sellerName}</h4>
                        <p className="text-gray-700">{service.sellerId.description}</p>
                      </div>
                    )}

                    {/* Skills and Languages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {service.sellerId.skills && service.sellerId.skills.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {service.sellerId.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {service.sellerId.languages && service.sellerId.languages.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Languages</h4>
                          <div className="flex flex-wrap gap-2">
                            {service.sellerId.languages.map((language: string, index: number) => (
                              <Badge key={index} variant="outline">{language}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location and Join Date */}
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      {service.sellerId.location && (
                        <div className="flex items-center">
                          <span className="mr-1">📍</span>
                          {service.sellerId.location}
                        </div>
                      )}
                      {service.sellerId.joinDate && (
                        <div className="flex items-center">
                          <span className="mr-1">📅</span>
                          Joined {new Date(service.sellerId.joinDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Contact Button */}
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact {service.sellerId.sellerName}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Seller information not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Related Services */}
        {relatedServices && relatedServices.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">More Services from This Seller</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedServices.map((relatedService) => (
                <Link key={relatedService._id} href={`/marketplace/service/${relatedService._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        {relatedService.thumbnailImage ? (
                          <Image
                            src={getFullImageUrl(relatedService.thumbnailImage)}
                            alt={relatedService.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              console.error('Related service image load error:', e);
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                          />
                        ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Briefcase className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2 line-clamp-2">
                        {relatedService.title}
                      </h3>
                      <div className="flex items-center space-x-1 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(relatedService.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-1">
                          {relatedService.rating || 0} ({relatedService.reviewCount || 0})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-200">
                          ${relatedService.price}
                        </span>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {relatedService.deliveryTime}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {service.faq?.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">{item.question}</h4>
                  <p className="text-gray-700">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
