'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Star, Send, Loader2, ThumbsUp, MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  sellerId: string;
  sellerName: string;
  orderItems: any[];
  onReviewSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  orderId,
  sellerId,
  sellerName,
  orderItems,
  onReviewSuccess
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitReview = async () => {
    if (!review.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review before submitting.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/reviews/create`,
        {
          orderId,
          sellerId,
          rating,
          review: review.trim()
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "⭐ Review Submitted!",
          description: "Thank you for your feedback!",
        });
        
        onReviewSuccess();
        onClose();
        
        // Reset form
        setRating(5);
        setReview('');
      }
    } catch (error: any) {
      console.error('Review submission error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-yellow-600" />
            Leave a Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Seller Info */}
          <Card>
            <CardContent className="p-3">
              <h4 className="font-semibold text-sm mb-1">You're reviewing:</h4>
              <p className="font-medium text-gray-900 dark:text-white">{sellerName}</p>
              <div className="mt-2 space-y-0.5">
                {orderItems.slice(0, 2).map((item, index) => (
                  <p key={index} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    • {item.itemTitle}
                  </p>
                ))}
                {orderItems.length > 2 && (
                  <p className="text-xs text-gray-500">+{orderItems.length - 2} more items</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          <div className="space-y-2">
            <Label className="text-sm">Your Rating *</Label>
            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {getRatingText(hoverRating || rating)}
              </p>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review" className="text-sm">Your Review *</Label>
            <Textarea
              id="review"
              placeholder="Share your experience with this seller..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[100px] max-h-[120px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {review.length}/1000 characters
            </p>
          </div>

          {/* Review Guidelines */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <h4 className="font-semibold text-xs text-blue-900 dark:text-blue-100 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Review Guidelines
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
                <li>• Be honest and constructive</li>
                <li>• Focus on your experience with the seller</li>
                <li>• Mention quality, communication, and delivery</li>
                <li>• Keep it professional and respectful</li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReview(prev => prev + 'Great communication and professional service. ')}
              className="text-xs h-8"
            >
              + Communication
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReview(prev => prev + 'Excellent quality and delivered on time. ')}
              className="text-xs h-8"
            >
              + Quality
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReview(prev => prev + 'Highly recommend this seller! ')}
              className="text-xs h-8"
            >
              + Recommend
            </Button>
          </div>

          {/* Actions */}
        </div>
        
        <div className="flex gap-2 px-6 py-4 border-t bg-background flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmitReview}
            disabled={submitting || !review.trim()}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

