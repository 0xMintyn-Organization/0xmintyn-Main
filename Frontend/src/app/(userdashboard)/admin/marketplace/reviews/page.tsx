'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Star, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Trash2,
  Flag,
  TrendingUp,
  AlertTriangle,
  Users,
  MessageSquare
} from 'lucide-react';
import Protected from '@/hooks/useProtected';
import { toast } from 'sonner';
import { marketplaceAPI } from '@/lib/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';

interface Review {
  _id: string;
  orderId: string;
  buyerId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  sellerId: {
    _id: string;
    sellerName: string;
    storeName: string;
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
  reviewText: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch all reviews - we need to get reviews for all sellers
      const sellersData = await marketplaceAPI.getSellers();
      const sellers = sellersData.sellers || [];
      const allReviews: Review[] = [];

      // Fetch reviews for each seller
      for (const seller of sellers) {
        try {
          const reviewsData = await marketplaceAPI.getSellerReviews(seller._id);
          const sellerReviews = reviewsData.reviews || [];
          allReviews.push(...sellerReviews);
        } catch (error) {
          console.error(`Error fetching reviews for seller ${seller._id}:`, error);
        }
      }

      setReviews(allReviews);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.error(error.message || 'Failed to load reviews');
      
      // Fallback to empty array if API fails
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.buyerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.buyerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.sellerId.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'rating-high':
        return b.rating - a.rating;
      case 'rating-low':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'text-yellow-500 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingBadge = (rating: number) => {
    const colors = {
      5: 'bg-green-100 text-green-800',
      4: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      2: 'bg-orange-100 text-orange-800',
      1: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`${colors[rating as keyof typeof colors] || colors[1]} border-0`}>
        {rating} Star{rating !== 1 ? 's' : ''}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Protected>
        <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        </div>
        </ErrorBoundary>
      </Protected>
    );
  }

  return (
    <Protected>
      <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Reviews Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Monitor and moderate all marketplace reviews
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={fetchReviews} variant="outline" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{reviews.length}</p>
                  </div>
                  <Star className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">5 Star Reviews</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {reviews.filter(r => r.rating === 5).length}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Ratings (1-2)</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {reviews.filter(r => r.rating <= 2).length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search reviews by buyer, seller, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rating-high">Highest Rating</SelectItem>
                    <SelectItem value="rating-low">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                All Reviews ({sortedReviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Review</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedReviews.map((review) => (
                        <TableRow key={review._id}>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                                {review.reviewText}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Order: {review.orderId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {review.buyerId.firstName[0]}{review.buyerId.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {review.buyerId.firstName} {review.buyerId.lastName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{review.sellerId.sellerName}</div>
                              <div className="text-xs text-gray-500">{review.sellerId.storeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {review.serviceId ? review.serviceId.title : review.productId?.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {review.serviceId ? 'Service' : 'Product'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {getRatingStars(review.rating)}
                              </div>
                              <div className="text-sm font-medium">
                                {review.rating}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                              <div className="text-gray-500">
                                {new Date(review.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/marketplace/orders/${review.orderId}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Order
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </ErrorBoundary>
    </Protected>
  );
}