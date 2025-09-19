"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Edit3, 
  Trash2,
  Send,
  User
} from "lucide-react";
import Spinner from "@/components/Spinner";

interface Review {
  _id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewData {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface CanReviewData {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  existingReview: Review | null;
}

export default function ReviewSection() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { toast } = useToast();
  
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [canReviewData, setCanReviewData] = useState<CanReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });

  // Fetch reviews and review eligibility
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch reviews (public)
        const reviewsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}review/course/${courseId}`
        );
        
        // Fetch review eligibility (authenticated)
        try {
          const canReviewResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SERVER_URI}review/can-review/${courseId}`,
            { withCredentials: true }
          );
          setCanReviewData(canReviewResponse.data);
        } catch (error) {
          // User not authenticated, can't review
          setCanReviewData({
            canReview: false,
            hasPurchased: false,
            hasReviewed: false,
            existingReview: null
          });
        }
        
        setReviewData(reviewsResponse.data);
      } catch (error) {
        console.error("Error fetching review data:", error);
        toast({
          title: "Error",
          description: "Failed to load reviews",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, toast]);

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      toast({
        title: "Error",
        description: "Please write a review comment",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/create`,
        {
          courseId,
          rating: newReview.rating,
          comment: newReview.comment
        },
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });

      // Reset form and refresh data
      setNewReview({ rating: 5, comment: "" });
      setShowReviewForm(false);
      
      // Refresh reviews
      const reviewsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/course/${courseId}`
      );
      setReviewData(reviewsResponse.data);
      
      // Refresh can review data
      const canReviewResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/can-review/${courseId}`,
        { withCredentials: true }
      );
      setCanReviewData(canReviewResponse.data);

    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle review update
  const handleUpdateReview = async (reviewId: string, rating: number, comment: string) => {
    try {
      setSubmitting(true);
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/${reviewId}`,
        { rating, comment },
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Review updated successfully!",
      });

      // Refresh reviews
      const reviewsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/course/${courseId}`
      );
      setReviewData(reviewsResponse.data);

    } catch (error: any) {
      console.error("Error updating review:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) {
      return;
    }

    try {
      setSubmitting(true);
      
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/${reviewId}`,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Review deleted successfully!",
      });

      // Refresh reviews
      const reviewsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/course/${courseId}`
      );
      setReviewData(reviewsResponse.data);
      
      // Refresh can review data
      const canReviewResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/can-review/${courseId}`,
        { withCredentials: true }
      );
      setCanReviewData(canReviewResponse.data);

    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load reviews</p>
      </div>
    );
  }

  const { reviews, stats, pagination } = reviewData;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Student Reviews</h2>
          
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">
                {stats.averageRating || 0}
              </div>
              <div className="flex justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${
                      star <= Math.round(stats.averageRating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-gray-600">Course Rating</p>
            </div>
            
            <div className="col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars as keyof typeof stats.distribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < stars
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-gray-600 w-10">{Math.round(percentage)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Form - Only for enrolled students */}
          {canReviewData?.canReview && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Write a Review
                </h3>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  Verified Purchase
                </Badge>
              </div>
              
              {!showReviewForm ? (
                <Button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= newReview.rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Review</label>
                    <Textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience with this course..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <>
                          <Spinner size="sm" inline />
                          <span className="ml-2">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Review
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Reviews */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="border-t pt-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback>
                        {review.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.userName}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.isVerified && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <p className="text-zinc-700 dark:text-gray-300 mb-2">
                        {review.comment}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-gray-700">
                          <ThumbsUp className="w-4 h-4" />
                          Helpful ({review.helpful})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  disabled={!pagination.hasPrevPage}
                  onClick={() => {/* TODO: Implement pagination */}}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={!pagination.hasNextPage}
                  onClick={() => {/* TODO: Implement pagination */}}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
