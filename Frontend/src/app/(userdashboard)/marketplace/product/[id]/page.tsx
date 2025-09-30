'use client';

import React, { useState } from 'react';
import { Star, Heart, Download, FileText, Shield, CheckCircle, Minus, Plus, Share2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

// Sample digital product data
const productData = {
  id: 1,
  title: "Premium Website Template Pack",
  brand: "WebCraft",
  price: 49,
  originalPrice: 99,
  rating: 4.8,
  reviewCount: 124,
  images: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop"
  ],
  description: "A comprehensive collection of premium website templates designed for modern businesses. This pack includes 10 responsive HTML/CSS templates with clean code, modern design, and mobile-first approach.",
  features: [
    "10 Responsive HTML/CSS Templates",
    "Mobile-First Design Approach",
    "Clean, Semantic HTML5 Code",
    "CSS3 Animations & Transitions",
    "Cross-Browser Compatible",
    "SEO Optimized Structure",
    "Easy to Customize",
    "Well Documented Code",
    "Free Fonts & Icons Included"
  ],
  specifications: {
    "File Format": "HTML/CSS",
    "File Size": "25.4 MB",
    "Templates": "10 Responsive Templates",
    "Browser Support": "Chrome, Firefox, Safari, Edge",
    "Framework": "Pure HTML/CSS",
    "License": "Commercial License",
    "Updates": "Lifetime Updates",
    "Support": "6 Months Email Support",
    "Documentation": "Included"
  },
  digitalDelivery: {
    instant: true,
    downloadLimit: 5,
    accessDuration: "Lifetime",
    returnPolicy: "30-day return policy"
  },
  seller: {
    name: "WebCraft",
    rating: 4.9,
    reviewCount: 1250,
    verified: true
  },
  reviews: [
    {
      id: 1,
      user: "John D.",
      rating: 5,
      date: "2024-01-15",
      title: "Excellent templates!",
      comment: "These templates are exactly what I needed for my client projects. Clean code, modern design, and easy to customize. The documentation is very helpful."
    },
    {
      id: 2,
      user: "Sarah M.",
      rating: 4,
      date: "2024-01-10",
      title: "Great value for money",
      comment: "Good collection of templates with responsive design. The code quality is high and the templates are well-structured. Minor issues with some browser compatibility."
    }
  ],
  relatedProducts: [
    {
      id: 2,
      title: "Professional UI/UX Design Kit",
      price: 29,
      image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop",
      rating: 4.7
    },
    {
      id: 3,
      title: "React Native App Template",
      price: 199,
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop",
      rating: 4.8
    }
  ]
};

export default function ProductDetailPage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-card">
              <Image
                src={productData.images[selectedImage]}
                alt={productData.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex space-x-2">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${productData.title} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-600">{productData.brand}</span>
                <Badge className="bg-green-500 text-white">Best Seller</Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-4">
                {productData.title}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(productData.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {productData.rating} ({productData.reviewCount} reviews)
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                  ${productData.price}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ${productData.originalPrice}
                </span>
                <Badge className="bg-red-500 text-white">
                  Save ${productData.originalPrice - productData.price}
                </Badge>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button size="lg" className="flex-1 bg-green-900 hover:bg-green-800 text-white">
                  <Download className="w-5 h-5 mr-2" />
                  Get Instant Access
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={isFavorite ? 'text-red-500' : ''}
                >
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Digital Delivery Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Download className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-600">Instant Download</p>
                    <p className="text-sm text-gray-600">
                      Access immediately after purchase
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-600">30-day returns</p>
                    <p className="text-sm text-gray-600">
                      Free returns within 30 days
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-600">Lifetime Access</p>
                    <p className="text-sm text-gray-600">
                      Download up to {productData.digitalDelivery.downloadLimit} times
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {productData.seller.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{productData.seller.name}</p>
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(productData.seller.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {productData.seller.rating} ({productData.seller.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="shipping">Digital Delivery & Returns</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{productData.description}</p>
                <h4 className="font-semibold mb-2">Key Features:</h4>
                <ul className="space-y-1">
                  {productData.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(productData.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">{key}</span>
                      <span className="text-gray-900 dark:text-gray-200">{value}</span>
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
                  {productData.reviews.map((review) => (
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Digital Delivery & Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Digital Delivery Information</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Instant download after purchase</li>
                      <li>• Access duration: {productData.digitalDelivery.accessDuration}</li>
                      <li>• Download limit: {productData.digitalDelivery.downloadLimit} times</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Return Policy</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• {productData.digitalDelivery.returnPolicy}</li>
                      <li>• Digital product returns accepted</li>
                      <li>• Full refund or exchange</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productData.relatedProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">{product.title}</h3>
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
                    <span className="text-sm text-gray-600">{product.rating}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-200">${product.price}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
