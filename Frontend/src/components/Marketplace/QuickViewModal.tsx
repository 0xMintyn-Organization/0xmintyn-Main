'use client';

import React, { useState } from 'react';
import { X, Star, Heart, ShoppingCart, Truck, Shield, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    title: string;
    brand: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    image: string;
    description: string;
    features: string[];
    inStock: boolean;
    seller: string;
  };
}

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen) return null;

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-zinc-200 dark:border-zinc-700">
        <div className="flex">
          {/* Product Image */}
          <div className="w-1/2 p-6">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-700">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="w-1/2 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">{product.title}</h2>
                <p className="text-gray-600 mb-2">by {product.brand}</p>
                <div className="flex items-center space-x-2">
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
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-foreground">${product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                    <Badge className="bg-red-500 text-white">
                      Save ${product.originalPrice - product.price}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-muted-foreground mb-3">{product.description}</p>
              <h4 className="font-semibold mb-2">Key Features:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {product.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Quantity:</label>
              <div className="flex items-center space-x-2">
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
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700" 
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <Button variant="outline" className="flex-1">
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={isFavorite ? 'text-red-500' : ''}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              {/* Shipping Info */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2" />
                  Free shipping on orders over $50
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  30-day return policy
                </div>
              </div>

              {/* Seller Info */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Sold by {product.seller}</p>
                      <p className="text-xs text-gray-600">Top-rated seller</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Store
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
