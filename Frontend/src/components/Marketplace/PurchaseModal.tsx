'use client';

import React, { useState } from 'react';
import { ShoppingCart, CreditCard, Wallet, Coins, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

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
  const [payingWithMintyn, setPayingWithMintyn] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const handlePurchase = async () => {
    // For products, use blockchain payment
    if (item.type === 'product') {
      await handleProductPurchase();
    } else {
      // For services, use existing flow (can be updated later)
      toast({
        variant: "error",
        title: "Service Purchase",
        description: "Service purchases are not yet integrated with blockchain payment.",
      });
    }
  };

  const handleProductPurchase = async () => {
    if (!authUser?.walletAddress) {
      toast({
        variant: "error",
        title: "Wallet Required",
        description: "Please connect your wallet to pay with Mintyn tokens",
      });
      return;
    }

    // Check Phantom wallet
    if (typeof window === 'undefined' || !(window as any).solana?.isPhantom) {
      toast({
        variant: "error",
        title: "Phantom Wallet Required",
        description: "Please install and connect Phantom wallet to pay with Mintyn tokens",
      });
      return;
    }

    const phantomProvider = (window as any).solana;

    try {
      setPayingWithMintyn(true);

      // Get seller wallet address from product
      // We'll need to fetch product details to get seller info
      const productResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/products/${item.id}`,
        { withCredentials: true }
      );

      if (!productResponse.data.success) {
        throw new Error('Failed to fetch product details');
      }

      const product = productResponse.data.product;
      const sellerId = product.sellerId?._id || product.sellerId;

      // Get seller's wallet address (userId is populated with walletAddress)
      const sellerResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/sellers/${sellerId}`,
        { withCredentials: true }
      );

      if (!sellerResponse.data.success || !sellerResponse.data.seller?.userId) {
        throw new Error('Failed to fetch seller information');
      }

      const sellerWalletAddress = sellerResponse.data.seller.userId?.walletAddress;
      if (!sellerWalletAddress) {
        toast({
          variant: "error",
          title: "Error",
          description: "Seller wallet address not found. The seller needs to connect their wallet to receive payments.",
        });
        return;
      }

      const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS;
      if (!ADMIN_WALLET_ADDRESS) {
        toast({
          variant: "error",
          title: "Configuration Error",
          description: "Admin wallet address is not configured. Please contact support.",
        });
        return;
      }

      const { PublicKey } = await import("@solana/web3.js");
      const userWallet = new PublicKey(authUser.walletAddress);
      const sellerWallet = new PublicKey(sellerWalletAddress);
      const adminWallet = new PublicKey(ADMIN_WALLET_ADDRESS);

      // Create and sign transaction with Phantom wallet
      const { transferMintynTokensWithFeeSplit } = await import("@/utils/mintynPayment");
      const { sellerAmount, adminAmount, signedTransaction } = await transferMintynTokensWithFeeSplit(
        userWallet,
        sellerWallet,
        adminWallet,
        item.price,
        phantomProvider
      );

      // Send signed transaction to backend for order creation
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/create`,
        {
          items: [{
            itemId: item.id,
            itemType: 'product',
            quantity: 1
          }],
          shippingAddress: {
            fullName: authUser.name || 'N/A',
            email: authUser.email || 'N/A',
            address: 'N/A',
            city: 'N/A',
            zipCode: 'N/A',
            country: 'N/A'
          },
          notes: 'Purchase via Mintyn blockchain',
          signedTransaction: signedTransaction
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const order = response.data.order;
        const paymentInfo = order?.paymentDetails;
        const transactionSignature = paymentInfo?.transactionSignature || "";
        
        // Get amounts from backend response or use calculated values
        const finalSellerAmount = paymentInfo?.sellerAmount || sellerAmount || 0;
        const finalAdminAmount = paymentInfo?.adminAmount || adminAmount || 0;
        
        toast({
          variant: "success",
          title: "🎉 Purchase Successful!",
          description: `Payment successful! ${finalSellerAmount.toLocaleString()} 0XM to seller, ${finalAdminAmount.toLocaleString()} 0XM platform fee. Transaction: ${transactionSignature.substring(0, 8)}...`,
        });
        
        onClose();
        
        // Refresh page to show updated purchase status
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        variant: "error",
        title: "Payment Failed",
        description: error.response?.data?.message || error.message || "Failed to complete payment. Please try again.",
      });
    } finally {
      setPayingWithMintyn(false);
    }
  };


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
                    <span className="text-2xl font-bold text-green-600">{item.price} 0XM</span>
                    <Badge variant="secondary">Instant Access</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {item.type === 'product' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Coins className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">Pay with Mintyn (0XM)</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Complete your purchase using Mintyn tokens. 5% platform fee, 95% goes to the seller.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={payingWithMintyn || loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {payingWithMintyn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  {item.type === 'product' ? `Buy Product - ${item.price} 0XM` : `Complete Purchase - ${item.price} 0XM`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
