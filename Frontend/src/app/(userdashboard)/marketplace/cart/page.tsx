'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Sample cart data
const cartItems = [
  {
    id: 1,
    type: 'product',
    title: "Premium Website Template Pack",
    price: 49,
    originalPrice: 99,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop",
    seller: "WebCraft",
    delivery: "Instant Download",
    inStock: true,
    fileFormat: "HTML/CSS",
    fileSize: "25.4 MB"
  },
  {
    id: 2,
    type: 'product',
    title: "Professional UI/UX Design Kit",
    price: 29,
    originalPrice: 59,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=150&fit=crop",
    seller: "DesignPro",
    delivery: "Instant Download",
    inStock: true,
    fileFormat: "Figma/Sketch",
    fileSize: "12.8 MB"
  },
  {
    id: 3,
    type: 'service',
    title: "Professional Logo Design",
    price: 50,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=150&fit=crop",
    seller: "DesignPro",
    deliveryTime: "3 days",
    inStock: true
  }
];

// No shipping options needed for digital products

export default function CartPage() {
  const [items, setItems] = useState(cartItems);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);

  const updateQuantity = (id: number, change: number) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === 'save10') {
      setAppliedCoupon({ code: couponCode, discount: 0.1 });
    } else if (couponCode.toLowerCase() === 'welcome20') {
      setAppliedCoupon({ code: couponCode, discount: 0.2 });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon ? subtotal * appliedCoupon.discount : 0;
  const total = subtotal - discount;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/marketplace">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">Shopping Cart</h1>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
                  <Link href="/marketplace">
                    <Button>Start Shopping</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {item.seller}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {item.type === 'product' ? (
                            <div className="flex items-center">
                              <Truck className="w-4 h-4 mr-1" />
                              {item.delivery}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Truck className="w-4 h-4 mr-1" />
                              Delivery: {item.deliveryTime}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-200">
                            ${item.price}
                          </div>
                          {item.originalPrice > item.price && (
                            <div className="text-sm text-gray-500 line-through">
                              ${item.originalPrice}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="px-4 py-2 border-x">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coupon Code</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button size="sm" onClick={applyCoupon}>
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Coupon "{appliedCoupon.code}" applied</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Digital Delivery Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Digital Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    All digital products will be delivered instantly via email after payment confirmation. No shipping required.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                        <Button className="w-full bg-green-900 hover:bg-green-800 text-white" size="lg">
                          <CreditCard className="w-5 h-5 mr-2" />
                          Proceed to Checkout
                        </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Secure checkout with SSL encryption
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Badges */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="flex justify-center space-x-4">
                    <Badge variant="secondary">SSL Secured</Badge>
                    <Badge variant="secondary">30-Day Returns</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    Your payment information is secure and encrypted
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Items */}
        {items.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Sample recommended items */}
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <Image
                      src={`https://images.unsplash.com/photo-${1500000000000 + item}?w=300&h=300&fit=crop`}
                      alt={`Recommended item ${item}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">Recommended Item {item}</h3>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-200">$99.99</div>
                    <Button size="sm" className="w-full mt-2">
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
