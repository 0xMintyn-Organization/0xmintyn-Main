'use client';

import React, { useState } from 'react';
import { X, Download, FileText, Shield, Truck } from 'lucide-react';
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
  };
}

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-zinc-200 dark:border-zinc-700">
        <div className="flex">
          {/* Product Image */}
          <div className="w-1/2 p-6">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-700">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-1/2 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">{product.title}</h2>
                <p className="text-gray-600 mb-2">by {product.brand}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-foreground">{product.price} 0XM</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {product.originalPrice} 0XM
                    </span>
                    <Badge className="bg-red-500 text-white">
                      Save {product.originalPrice - product.price} 0XM
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

            {/* Digital Info */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  Instant Download
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Lifetime Access
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-green-900 hover:bg-green-800 text-white" 
                >
                  <Download className="w-4 h-4 mr-2" />
                  Get Instant Access
                </Button>
              </div>

              {/* Shipping Info */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2" />
                  Free shipping on orders over 50 0XM
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  30-day return policy
                </div>
              </div>

            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
