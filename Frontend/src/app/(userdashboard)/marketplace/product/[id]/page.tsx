'use client';

import React, { useState, useEffect } from 'react';
import { Star, Download, FileText, Shield, CheckCircle, Clock, Users, Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import PurchaseModal from '@/components/Marketplace/PurchaseModal';
import SellerReviews from '@/components/Marketplace/SellerReviews';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  // State management
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // UI state
  const [selectedImage, setSelectedImage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) {
      return '/placeholder-product.jpg';
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Handle environment variable with trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const fullUrl = `${baseUrl}${normalizedPath}`;
    
    console.log('Constructed image URL:', fullUrl, 'from path:', imagePath, 'baseUrl:', baseUrl);
    return fullUrl;
  };

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/products/${productId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          
          // Test image accessibility
          if (response.data.product.images && response.data.product.images.length > 0) {
            const testUrl = getFullImageUrl(response.data.product.images[0]);
            fetch(testUrl, { method: 'HEAD' })
              .then(res => console.log('Image accessibility test:', res.status, res.ok ? 'SUCCESS' : 'FAILED'))
              .catch(err => console.error('Image accessibility test failed:', err));
          }
          
          setProduct(response.data.product);
          setRelatedProducts(response.data.relatedProducts || []);
          setIsPurchased(response.data.isPurchased || false);
          setDownloadUrl(response.data.downloadUrl || null);
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        setError(error.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);


  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-fetch product
    window.location.reload();
  };

  const handleDownload = async () => {
    if (!product?._id) {
      console.error('No product ID available');
      return;
    }

    try {
      setDownloading(true);
      
      // Use secure file access endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/purchase/product/${product._id}/file`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        // Create blob from response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `${product.title}.${product.fileFormat?.toLowerCase() || 'zip'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.text();
        console.error('Download failed:', response.status, errorData);
        alert('You must purchase this product to download the file');
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading product...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we fetch the product details</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load product</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Link href="/marketplace">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No product found
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Product not found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Link href="/marketplace">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-card">
              <Image
                src={getFullImageUrl(product.images?.[selectedImage] || product.thumbnailImage)}
                alt={product.title}
                fill
                className="object-cover"
                onError={(e) => {
                  console.error('Main image load error:', {
                    error: e,
                    src: e.currentTarget.src,
                    alt: e.currentTarget.alt,
                    originalPath: product.images?.[selectedImage] || product.thumbnailImage
                  });
                  // Try fallback to thumbnail if main image fails
                  if (product.thumbnailImage && e.currentTarget.src !== getFullImageUrl(product.thumbnailImage)) {
                    e.currentTarget.src = getFullImageUrl(product.thumbnailImage);
                  } else {
                    e.currentTarget.src = '/placeholder-product.jpg';
                  }
                }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={getFullImageUrl(image)}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error('Thumbnail image load error:', {
                          error: e,
                          src: e.currentTarget.src,
                          alt: e.currentTarget.alt,
                          originalPath: image
                        });
                        e.currentTarget.src = '/placeholder-product.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {product.isFeatured && <Badge className="bg-green-500 text-white">Featured</Badge>}
                {product.discount > 0 && <Badge className="bg-red-500 text-white">Sale</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-4">
                {product.title}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating || 0} ({product.reviewCount || 0} reviews)
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                {isPurchased ? (
                  <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                    <CheckCircle className="w-5 h-5 mr-2 inline" />
                    Already Purchased
                  </Badge>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                      {product.price} 0XM
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-500 line-through">
                          {product.originalPrice} 0XM
                        </span>
                        <Badge className="bg-red-500 text-white">
                          Save {product.originalPrice - product.price} 0XM
                        </Badge>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

                {/* Digital Product Actions */}
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      size="lg"
                      className="flex-1 bg-green-900 hover:bg-green-800 text-white"
                      onClick={isPurchased ? handleDownload : () => setShowPurchaseModal(true)}
                      disabled={downloading}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {downloading ? 'Downloading...' : isPurchased ? 'Download Product' : 'Get Instant Access'}
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
                      Full refund if not satisfied
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-600">Unlimited Downloads</p>
                    <p className="text-sm text-gray-600">
                      Download as many times as you need
                    </p>
                  </div>
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
                <p className="text-gray-700 mb-4">{product.description}</p>
                {product.features && product.features.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {product.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  try {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">File Format</span>
                          <span className="text-gray-900 dark:text-gray-200">{String(product?.fileFormat || 'N/A')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">File Size</span>
                          <span className="text-gray-900 dark:text-gray-200">{String(product?.fileSize || 'N/A')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">Category</span>
                          <span className="text-gray-900 dark:text-gray-200">{String(product?.category || 'N/A')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">License</span>
                          <span className="text-gray-900 dark:text-gray-200">{String(product?.license || 'Standard')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">Updates</span>
                          <span className="text-gray-900 dark:text-gray-200">
                            {product?.updates?.lifetime ? 'Lifetime' : 
                             product?.updates?.duration ? String(product.updates.duration) : 
                             product?.updates?.type ? String(product.updates.type) : 'Limited'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">Support</span>
                          <span className="text-gray-900 dark:text-gray-200">
                            {product?.support?.included ? 
                              `${product.support.type} Support (${product.support.duration})` : 
                              'No Support'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">Compatibility</span>
                          <span className="text-gray-900 dark:text-gray-200">{String(product?.compatibility || 'All Modern Browsers')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium text-gray-600">Version</span>
                          <span className="text-gray-900 dark:text-gray-200">{String(product?.version || '1.0')}</span>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering specifications:', error);
                    return (
                      <div className="text-center py-8">
                        <p className="text-red-600">Error loading specifications</p>
                      </div>
                    );
                  }
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {product.sellerId?._id && (
              <SellerReviews sellerId={product.sellerId._id} />
            )}
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
                      <li>• Access duration: {product.digitalDelivery?.accessDuration || 'Lifetime'}</li>
                      <li>• Download limit: {product.digitalDelivery?.downloadLimit || 5} times</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Return Policy</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• {product.digitalDelivery?.returnPolicy || '30-day return policy'}</li>
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
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct._id} href={`/marketplace/product/${relatedProduct._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                        <Image
                          src={getFullImageUrl(relatedProduct.thumbnailImage)}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('Related product image load error:', e);
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                        />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">{relatedProduct.title}</h3>
                      <div className="flex items-center space-x-1 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(relatedProduct.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">{relatedProduct.rating || 0}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-200">{relatedProduct.price} 0XM</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {product && (
          <PurchaseModal
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
            item={{
              id: product._id,
              title: product.title,
              price: product.price,
              image: getFullImageUrl(product.thumbnailImage),
              type: 'product',
              sellerName: product.sellerId?.sellerName
            }}
          />
        )}
      </div>
    </div>
  );
}
