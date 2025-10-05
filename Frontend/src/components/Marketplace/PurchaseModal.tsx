'use client';

import React, { useState } from 'react';
import { ShoppingCart, CreditCard, Wallet, Coins, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    price: number;
    image: string;
    type: 'product' | 'service';
    sellerName?: string;
  };
}

export default function PurchaseModal({ isOpen, onClose, item }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });
  const { toast } = useToast();

  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      // Validate required fields
      if (!billingInfo.fullName || !billingInfo.email) {
        toast({
          variant: "error",
          title: "Missing Information",
          description: "Please fill in your full name and email address",
        });
        setLoading(false);
        return;
      }

      // Prepare order data
      const orderData = {
        items: [{
          itemId: item.id,
          itemType: item.type,
          quantity: 1,
          // For services, include package index if available
          ...(item.type === 'service' && { packageIndex: 0 })
        }],
        shippingAddress: {
          fullName: billingInfo.fullName || 'N/A',
          email: billingInfo.email || 'N/A',
          address: billingInfo.address || 'N/A',
          city: billingInfo.city || 'N/A',
          zipCode: billingInfo.zipCode || 'N/A',
          country: billingInfo.country || 'N/A'
        },
        notes: `Purchase via ${selectedPaymentMethod}`
      };

      // Create order via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Order created successfully:', result);
        
        // Show success message
        toast({
          variant: "success",
          title: "🎉 Order Created Successfully!",
          description: `Order #${result.order.orderNumber} • Total: $${result.order.orderTotal}`,
        });
        
        // Close modal
        onClose();
        
        // Optionally redirect to order details or user's orders page
        // You can uncomment this line to redirect to orders page
        // window.location.href = '/marketplace/orders';
        
      } else {
        const errorData = await response.json();
        console.error('Order creation failed:', errorData);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Please log in to complete your purchase');
        } else if (response.status === 400) {
          throw new Error(errorData.message || 'Invalid order data. Please check your information.');
        } else if (response.status === 404) {
          throw new Error('Product or service not found. It may have been removed.');
        } else {
          throw new Error(errorData.message || 'Failed to create order. Please try again.');
        }
      }
      
    } catch (error: unknown) {
      console.error('Purchase failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again';
      toast({
        variant: "error",
        title: "❌ Purchase Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: CreditCard, description: 'Visa, Mastercard, American Express' },
    { id: 'paypal', name: 'PayPal', icon: Wallet, description: 'Pay with your PayPal account' },
    { id: 'crypto', name: 'Cryptocurrency', icon: Coins, description: 'Bitcoin, Ethereum, USDT' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Shield, description: 'Direct bank transfer' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Complete Purchase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.type === 'product' ? 'Digital Product' : 'Service'}
                    {item.sellerName && ` • by ${item.sellerName}`}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-green-600">${item.price}</span>
                    <Badge variant="secondary">Instant Access</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <div key={method.id} className="relative">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-not-allowed opacity-60">
                      <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <h4 className="font-medium text-gray-500">{method.name}</h4>
                      <p className="text-sm text-gray-400">{method.description}</p>
                      <Badge variant="secondary" className="mt-2">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">Secure Purchase</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your purchase will be processed securely. Payment methods will be available soon including credit cards, PayPal, and cryptocurrency.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Billing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                <input 
                  id="fullName"
                  type="text"
                  value={billingInfo.fullName}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input 
                  id="email"
                  type="email"
                  value={billingInfo.email}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">Address</label>
                <input 
                  id="address"
                  type="text"
                  value={billingInfo.address}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">City</label>
                <input 
                  id="city"
                  type="text"
                  value={billingInfo.city}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="zipCode" className="text-sm font-medium">ZIP Code</label>
                <input 
                  id="zipCode"
                  type="text"
                  value={billingInfo.zipCode}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="10001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">Country</label>
                <select 
                  id="country"
                  value={billingInfo.country}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Secure Purchase</h4>
                <ul className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2" />
                    SSL encrypted payment processing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2" />
                    30-day money-back guarantee
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2" />
                    Instant access after payment
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase} 
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Complete Purchase - ${item.price}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
