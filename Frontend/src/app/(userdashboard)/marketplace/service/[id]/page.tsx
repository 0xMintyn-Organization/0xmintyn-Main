'use client';

import React, { useState } from 'react';
import { Star, Heart, Clock, User, CheckCircle, MessageCircle, Award, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

// Sample service data
const serviceData = {
  id: 1,
  title: "Professional Logo Design",
  seller: "DesignPro",
  sellerLevel: "Level 2",
  rating: 4.9,
  reviewCount: 1247,
  deliveryTime: "3 days",
  isOnline: true,
  images: [
    "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=600&fit=crop"
  ],
  description: "I will create a unique, professional logo for your business that reflects your brand identity and stands out from the competition. With over 5 years of experience in logo design, I specialize in creating memorable and impactful logos.",
  packages: [
    {
      name: "Basic",
      price: 25,
      originalPrice: 50,
      features: [
        "2 unique logo concepts",
        "2 revisions",
        "PNG & JPG formats",
        "3 business days delivery",
        "Commercial use license"
      ],
      popular: false
    },
    {
      name: "Standard",
      price: 50,
      originalPrice: 100,
      features: [
        "3 unique logo concepts",
        "3 revisions",
        "All formats (PNG, JPG, SVG, PDF)",
        "Source files (AI, PSD)",
        "2 business days delivery",
        "Commercial use license",
        "Social media kit"
      ],
      popular: true
    },
    {
      name: "Premium",
      price: 100,
      originalPrice: 200,
      features: [
        "5 unique logo concepts",
        "Unlimited revisions",
        "All formats (PNG, JPG, SVG, PDF)",
        "Source files (AI, PSD)",
        "1 business day delivery",
        "Commercial use license",
        "Social media kit",
        "Business card design",
        "Letterhead design",
        "Brand guidelines document"
      ],
      popular: false
    }
  ],
  addOns: [
    {
      name: "Rush Delivery",
      price: 15,
      description: "Get your logo in 24 hours"
    },
    {
      name: "Business Card Design",
      price: 25,
      description: "Professional business card design"
    },
    {
      name: "Social Media Kit",
      price: 20,
      description: "Logo variations for social media"
    }
  ],
  portfolio: [
    {
      id: 1,
      title: "Tech Startup Logo",
      image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop",
      category: "Technology"
    },
    {
      id: 2,
      title: "Restaurant Branding",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop",
      category: "Food & Beverage"
    },
    {
      id: 3,
      title: "Fashion Brand Logo",
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=300&h=200&fit=crop",
      category: "Fashion"
    }
  ],
  reviews: [
    {
      id: 1,
      user: "Sarah M.",
      rating: 5,
      date: "2024-01-15",
      title: "Perfect logo for my business!",
      comment: "DesignPro delivered exactly what I needed. The logo perfectly represents my brand and I've received so many compliments. Highly recommended!",
      package: "Standard"
    },
    {
      id: 2,
      user: "John D.",
      rating: 5,
      date: "2024-01-10",
      title: "Excellent work and communication",
      comment: "Great experience from start to finish. The designer was very responsive and made all the changes I requested. The final logo exceeded my expectations."
    }
  ],
  faq: [
    {
      question: "What file formats will I receive?",
      answer: "You'll receive your logo in multiple formats including PNG, JPG, SVG, and PDF. Source files (AI, PSD) are included in Standard and Premium packages."
    },
    {
      question: "How many revisions are included?",
      answer: "Basic package includes 2 revisions, Standard includes 3 revisions, and Premium includes unlimited revisions until you're completely satisfied."
    },
    {
      question: "Can I use the logo commercially?",
      answer: "Yes, all packages include commercial use license, so you can use your logo for any business purposes without restrictions."
    }
  ],
  sellerInfo: {
    name: "DesignPro",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 4.9,
    reviewCount: 1247,
    completedOrders: 2500,
    responseTime: "1 hour",
    languages: ["English", "Spanish"],
    skills: ["Logo Design", "Branding", "Graphic Design", "Illustration"],
    verified: true,
    level: "Level 2"
  }
};

export default function ServiceDetailPage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Service Images */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video relative overflow-hidden rounded-lg bg-card">
              <Image
                src={serviceData.images[selectedImage]}
                alt={serviceData.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex space-x-2">
              {serviceData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${serviceData.title} ${index + 1}`}
                    fill
                    className="object-cover"
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
                {serviceData.isOnline && (
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-sm">Online</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-4">
                {serviceData.title}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(serviceData.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {serviceData.rating} ({serviceData.reviewCount} reviews)
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{serviceData.deliveryTime}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  <span>{serviceData.sellerLevel}</span>
                </div>
              </div>
            </div>

            {/* Service Packages */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-200">Choose a Package</h3>
              {serviceData.packages.map((pkg, index) => (
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

            {/* Add-ons */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-200">Add-ons</h3>
              {serviceData.addOns.map((addon, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{addon.name}</h4>
                    <p className="text-sm text-gray-600">{addon.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">+${addon.price}</span>
                    <Button variant="outline" size="sm">Add</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Button */}
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
              Order Now - ${serviceData.packages[selectedPackage].price}
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'text-red-500' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>
        </div>

        {/* Service Details Tabs */}
        <Tabs defaultValue="about" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About This Service</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="seller">About Seller</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">{serviceData.description}</p>
                
                <h4 className="font-semibold mb-4">What's Included:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {serviceData.packages.map((pkg, index) => (
                    <div key={index} className="border rounded-lg p-4">
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

          <TabsContent value="portfolio" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {serviceData.portfolio.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-200">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.category}</p>
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
                  {serviceData.reviews.map((review) => (
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
                <div className="flex items-start space-x-4 mb-6">
                  <div className="relative w-16 h-16">
                    <Image
                      src={serviceData.sellerInfo.avatar}
                      alt={serviceData.sellerInfo.name}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{serviceData.sellerInfo.name}</h3>
                      <Badge className="bg-green-500 text-white">{serviceData.sellerInfo.level}</Badge>
                      {serviceData.sellerInfo.verified && (
                        <Badge className="bg-blue-500 text-white">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {serviceData.sellerInfo.rating} ({serviceData.sellerInfo.reviewCount} reviews)
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {serviceData.sellerInfo.completedOrders} orders completed
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {serviceData.sellerInfo.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {serviceData.sellerInfo.languages.map((language, index) => (
                        <Badge key={index} variant="outline">{language}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Response Time</h4>
                  <div className="flex items-center text-green-600">
                    <Zap className="w-4 h-4 mr-1" />
                    <span>Usually responds in {serviceData.sellerInfo.responseTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {serviceData.faq.map((item, index) => (
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
