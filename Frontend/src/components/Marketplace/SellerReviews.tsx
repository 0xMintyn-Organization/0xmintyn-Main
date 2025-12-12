'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, User, Calendar, ThumbsUp, Loader2
} from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface SellerReviewsProps {
  sellerId: string;
}

interface Review {
  _id: string;
  orderId?: string;
  buyerId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  serviceId?: {
    _id: string;
    title: string;
  };
  productId?: {
    _id: string;
    title: string;
  };
  rating: number;
  review: string;
  createdAt: string;
}

export default function SellerReviews({ sellerId }: SellerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (sellerId) {
      fetchReviews();
    }
  }, [sellerId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/reviews/seller/${sellerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setReviews(response.data.reviews || []);
        setAverageRating(response.data.averageRating || 0);
        setTotalReviews(response.data.totalReviews || 0);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      distribution[5 - review.rating]++;
    });
    return distribution.map((count, index) => ({
      stars: 5 - index,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading reviews...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Seller Reviews & Ratings
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Reviews from customers who purchased products and services from this seller
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
              <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 mt-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {getRatingDistribution().map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{item.stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.buyerId?.avatar} />
                    <AvatarFallback>
                      {review.buyerId?.firstName?.[0]}{review.buyerId?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Review Content */}
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {review.buyerId?.firstName} {review.buyerId?.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            • {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Verified Purchase
                      </Badge>
                    </div>

                    {/* Product/Service Info */}
                    {(review.productId || review.serviceId) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {review.productId ? '📦 Product' : '🛠️ Service'}
                        </Badge>
                        <span className="text-gray-600 dark:text-gray-400">
                          {review.productId?.title || review.serviceId?.title}
                        </span>
                      </div>
                    )}

                    {/* Review Text */}
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {review.review}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                This seller hasn't received any reviews yet. Be the first to purchase and review their products or services!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

