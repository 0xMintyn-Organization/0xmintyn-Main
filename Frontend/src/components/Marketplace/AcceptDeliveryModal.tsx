'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Star, Package, AlertCircle, Loader2, ThumbsUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface AcceptDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItems: any[];
  onAcceptSuccess: () => void;
}

export default function AcceptDeliveryModal({
  isOpen,
  onClose,
  orderId,
  orderItems,
  onAcceptSuccess
}: AcceptDeliveryModalProps) {
  const [accepting, setAccepting] = useState(false);
  const [leaveReview, setLeaveReview] = useState(false);
  const { toast } = useToast();

  const handleAcceptDelivery = async () => {
    setAccepting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/accept-delivery`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "✅ Delivery Accepted!",
          description: "Order has been marked as completed.",
        });
        
        onAcceptSuccess();
        onClose();
        
        // If user wants to leave a review, trigger the review modal
        if (leaveReview) {
          // This will be handled by parent component
          setTimeout(() => {
            const reviewBtn = document.querySelector('[data-open-review]');
            if (reviewBtn) {
              (reviewBtn as HTMLButtonElement).click();
            }
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Accept delivery error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to accept delivery. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Accept Delivery
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Order Items:</h4>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.itemTitle}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.itemType === 'service' ? 'Service' : 'Product'}
                        {item.packageDetails?.packageName && ` • ${item.packageDetails.packageName}`}
                      </p>
                    </div>
                    <Badge variant="outline">${item.itemPrice}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Message */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Please Confirm
                  </h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• You are satisfied with the delivered work</li>
                    <li>• You have downloaded and verified all files</li>
                    <li>• You understand this action cannot be undone</li>
                    <li>• Payment will be released to the seller</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Review Option */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Share Your Experience
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Help other buyers by leaving a review about your experience with this seller.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="leaveReview"
                      checked={leaveReview}
                      onChange={(e) => setLeaveReview(e.target.checked)}
                      className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="leaveReview" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                      I want to leave a review after accepting
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Important:</strong> Once you accept the delivery, the order will be marked as completed 
                    and payment will be released to the seller. This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={accepting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptDelivery}
              disabled={accepting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Delivery
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

