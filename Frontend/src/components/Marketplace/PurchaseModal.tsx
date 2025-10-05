'use client';

import React, { useState } from 'react';
import { ShoppingCart, CreditCard, Wallet, Coins, Shield, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  const handlePurchase = async () => {
    setLoading(true);
    
    // TODO: Implement actual purchase logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    onClose();
    alert('Purchase successful!');
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
