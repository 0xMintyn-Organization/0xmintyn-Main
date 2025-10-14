'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, XCircle, Loader2, FileText, User } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface OfferBubbleProps {
  offer: {
    _id: string;
    offerTitle: string;
    offerDescription: string;
    price: number;
    deliveryTime: string;
    revisions: number;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
    createdAt: string;
    sellerId: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    buyerId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  };
  currentUserId: string;
  onOfferUpdate: () => void;
}

export default function OfferBubble({ offer, currentUserId, onOfferUpdate }: OfferBubbleProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Determine user role in this offer
  const isBuyer = offer.buyerId._id === currentUserId;
  const isSeller = offer.sellerId._id === currentUserId;

  const handleAcceptOffer = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/${offer._id}/accept`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast({
          title: "🎉 Offer Accepted!",
          description: "Great choice! The seller will be notified and you can proceed to payment.",
        });
        onOfferUpdate();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Accept Offer",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/${offer._id}/reject`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast({
          title: "Offer Declined",
          description: "You've declined this offer. The seller has been notified.",
        });
        onOfferUpdate();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Decline Offer",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          icon: <Clock className="w-4 h-4" />,
          text: 'Pending Response'
        };
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Accepted'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Declined'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <FileText className="w-4 h-4" />,
          text: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const statusConfig = getStatusConfig(offer.status);

  return (
    <div className={`flex ${isSeller ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-[500px] w-full">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Custom Offer</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSeller ? 'Sent to' : 'From'} {isSeller ? `${offer.buyerId.firstName} ${offer.buyerId.lastName}` : `${offer.sellerId.firstName} ${offer.sellerId.lastName}`}
                  </p>
                </div>
              </div>
              <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                {statusConfig.icon}
                {statusConfig.text}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Offer Details */}
            <div>
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">{offer.offerTitle}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{offer.offerDescription}</p>
            </div>

            {/* Pricing & Terms */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900 dark:bg-gray-950 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Price</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${offer.price}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Delivery</span>
                </div>
                <p className="text-lg font-semibold text-blue-400">{offer.deliveryTime}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Revisions</span>
                </div>
                <p className="text-lg font-semibold text-purple-400">{offer.revisions}</p>
              </div>
            </div>

            {/* Action Buttons - Only for buyers with pending offers */}
            {isBuyer && offer.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAcceptOffer}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Accept Offer
                </Button>
                <Button
                  onClick={handleRejectOffer}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 font-semibold py-3"
                  size="lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Decline
                </Button>
              </div>
            )}

            {/* Status Messages */}
            {offer.status === 'accepted' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-green-900/20 rounded-lg border border-green-700">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-300">Offer Accepted!</p>
                    <p className="text-sm text-green-400">
                      {isBuyer ? 'Order has been created and is now in progress.' : 'The buyer has accepted your offer. You can now proceed with the work.'}
                    </p>
                  </div>
                </div>
                {isBuyer && (
                  <Link href="/marketplace/user-dashboard">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      View My Orders
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {offer.status === 'rejected' && (
              <div className="flex items-center gap-3 p-4 bg-red-900/20 rounded-lg border border-red-700">
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-300">Offer Declined</p>
                  <p className="text-sm text-red-400">
                    {isBuyer ? 'You have declined this offer.' : 'The buyer has declined your offer.'}
                  </p>
                </div>
              </div>
            )}

            {isSeller && offer.status === 'pending' && (
              <div className="flex items-center gap-3 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                <Clock className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-300">Waiting for Response</p>
                  <p className="text-sm text-blue-400">
                    The buyer is reviewing your offer. You'll be notified when they respond.
                  </p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
              {new Date(offer.createdAt).toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
