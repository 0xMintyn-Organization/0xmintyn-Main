'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface OfferCardProps {
  offer: any;
  currentUserId: string;
  onOfferUpdate?: () => void;
}

export default function OfferCard({ offer, currentUserId, onOfferUpdate }: OfferCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const isBuyer = offer.buyerId._id === currentUserId || offer.buyerId === currentUserId;
  const isSeller = offer.sellerId._id === currentUserId || offer.sellerId === currentUserId;
  const isPending = offer.status === 'pending';
  const isExpired = new Date() > new Date(offer.expiresAt) && isPending;

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (offer.status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge>{offer.status}</Badge>;
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/${offer._id}/accept`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        if (onOfferUpdate) {
          onOfferUpdate();
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (optional):');
    
    try {
      setRejecting(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/${offer._id}/reject`,
        { reason },
        { withCredentials: true }
      );

      if (response.data.success) {
        if (onOfferUpdate) {
          onOfferUpdate();
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject offer');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <Card className="my-4 border-2 border-green-500">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Custom Offer</CardTitle>
            {getStatusBadge()}
          </div>
          {!isExpired && isPending && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Expires {formatDistanceToNow(new Date(offer.expiresAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Offer Title */}
          <div>
            <h4 className="font-semibold text-base mb-1">{offer.offerTitle}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{offer.offerDescription}</p>
          </div>

          {/* Price and Details */}
          <div className="grid grid-cols-3 gap-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg px-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">{offer.price} 0XM</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Price</p>
            </div>
            <div className="text-center border-l dark:border-gray-700">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">{offer.deliveryTime}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Delivery</p>
            </div>
            <div className="text-center border-l dark:border-gray-700">
              <div className="flex items-center justify-center gap-1 mb-1">
                <RefreshCw className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold">{offer.revisions}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Revisions</p>
            </div>
          </div>

          {/* Deliverables */}
          {offer.deliverables && offer.deliverables.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-2">What's Included:</h5>
              <ul className="space-y-1">
                {offer.deliverables.map((item: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Terms */}
          {offer.additionalTerms && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-900 dark:text-yellow-200">
                <strong>Additional Terms:</strong> {offer.additionalTerms}
              </p>
            </div>
          )}

          {/* Action Buttons for Buyer */}
          {isBuyer && isPending && !isExpired && (
            <div className="flex gap-3 pt-3 border-t">
              <Button
                onClick={handleAccept}
                disabled={accepting || rejecting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Offer
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                disabled={accepting || rejecting}
                variant="outline"
                className="flex-1"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {offer.status === 'accepted' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ <strong>Offer Accepted</strong> on {new Date(offer.acceptedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {offer.status === 'rejected' && offer.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                ❌ <strong>Declined:</strong> {offer.rejectionReason}
              </p>
            </div>
          )}

          {isExpired && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ⏰ This offer has expired
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

