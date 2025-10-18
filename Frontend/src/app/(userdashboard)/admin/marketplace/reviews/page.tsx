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
  CheckCircle, 
  XCircle,
  Users,
  MessageSquare,
  AlertTriangle,
  Trash2,
  Flag
} from 'lucide-react';
import Protected from '@/hooks/useProtected';

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
  review: string;
  isActive: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      setReviews([
        {
          _id: '1',
          orderId: 'ORD-001',
          buyerId: {
            _id: 'buyer1',
            firstName: 'Alice',
            lastName: 'Johnson',
            avatar: '/placeholder-avatar.jpg'
          },
          sellerId: {
            _id: 'seller1',
            sellerName: 'John Doe',
            storeName: 'Creative Designs Co.'
          },
          serviceId: {
            _id: 'service1',
            title: 'Professional Logo Design'
          },
          rating: 5,
          review: 'Excellent work! John delivered exactly what I asked for and even exceeded my expectations. The logo is perfect for my business and the communication throughout the process was outstanding.',
          isActive: true,
          isFlagged: false,
          createdAt: '2024-03-16',
          updatedAt: '2024-03-16'
        },
        {
          _id: '2',
          orderId: 'ORD-002',
          buyerId: {
            _id: 'buyer2',
            firstName: 'Bob',
            lastName: 'Smith'
          },
          sellerId: {
            _id: 'seller2',
            sellerName: 'Jane Smith',
            storeName: 'Tech Solutions Pro'
          },
          productId: {
            _id: 'product1',
            title: 'Website Template - Business Pro'
          },
          rating: 4,
          review: 'Good template overall, but the documentation could be better. The design is clean and modern, exactly what I needed for my business website.',
          isActive: true,
          isFlagged: false,
          createdAt: '2024-03-15',
          updatedAt: '2024-03-15'
        },
        {
          _id: '3',
          orderId: 'ORD-003',
          buyerId: {
            _id: 'buyer3',
            firstName: 'Carol',
            lastName: 'Williams'
          },
          sellerId: {
            _id: 'seller3',
            sellerName: 'Mike Johnson',
            storeName: 'Digital Marketing Hub'
          },
          serviceId: {
            _id: 'service3',
            title: 'Social Media Marketing'
          },
          rating: 3,
          review: 'The service was okay, but delivery was delayed by 2 days. The results were decent but not exceptional. Communication could have been better.',
          isActive: true,
          isFlagged: false,
          createdAt: '2024-03-14',
          updatedAt: '2024-03-14'
        },
        {
          _id: '4',
          orderId: 'ORD-004',
          buyerId: {
            _id: 'buyer4',
            firstName: 'David',
            lastName: 'Brown'
          },
          sellerId: {
            _id: 'seller4',
            sellerName: 'Sarah Wilson',
            storeName: 'Content Creation Studio'
          },
          productId: {
            _id: 'product4',
            title: 'Content Writing Templates Pack'
          },
          rating: 1,
          review: 'This is absolutely terrible! The templates are poorly written and contain grammatical errors. Complete waste of money. I demand a refund!',
          isActive: false,
          isFlagged: true,
          flagReason: 'Inappropriate language and false claims',
          createdAt: '2024-03-13',
          updatedAt: '2024-03-14'
        },
        {
          _id: '5',
          orderId: 'ORD-005',
          buyerId: {
            _id: 'buyer5',
            firstName: 'Eva',
            lastName: 'Davis'
          },
          sellerId: {
            _id: 'seller1',
            sellerName: 'John Doe',
            storeName: 'Creative Designs Co.'
          },
          serviceId: {
            _id: 'service5',
            title: 'Brand Identity Package'
          },
          rating: 5,
          review: 'Outstanding service! The brand identity package was exactly what my startup needed. Professional, creative, and delivered on time. Highly recommended!',
          isActive: true,
          isFlagged: false,
          createdAt: '2024-03-12',
          updatedAt: '2024-03-12'
        }
      ]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.buyerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.buyerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.sellerId.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.serviceId?.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.productId?.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && review.isActive) ||
      (statusFilter === 'inactive' && !review.isActive) ||
      (statusFilter === 'flagged' && review.isFlagged);
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (isActive: boolean, isFlagged: boolean) => {
    if (isFlagged) {
      return <Badge className="bg-red-100 text-red-800">Flagged</Badge>;
    }
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  const handleToggleActive = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review._id === reviewId 
        ? { ...review, isActive: !review.isActive }
        : review
    ));
  };

  const handleToggleFlag = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review._id === reviewId 
        ? { ...review, isFlagged: !review.isFlagged }
        : review
    ));
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(review => review._id !== reviewId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <Protected>
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
                <Button
                  variant="outline"
                  onClick={fetchReviews}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search reviews by buyer, seller, content, or item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Rating" />
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="lowest">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Reviews ({filteredReviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                    No reviews found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filter criteria.
                  </p>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => (
                        <TableRow key={review._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <TableCell>
                            <div className="max-w-md">
                              <div className="text-sm line-clamp-3 mb-2">{review.review}</div>
                              {review.isFlagged && review.flagReason && (
                                <Badge variant="destructive" className="text-xs">
                                  {review.flagReason}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium">{review.buyerId.firstName} {review.buyerId.lastName}</div>
                                <div className="text-sm text-gray-500">{review.orderId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{review.sellerId.sellerName}</div>
                              <div className="text-sm text-gray-500">{review.sellerId.storeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {review.serviceId ? (
                                <>
                                  <div className="font-medium">{review.serviceId.title}</div>
                                  <Badge variant="outline" className="text-xs">Service</Badge>
                                </>
                              ) : (
                                <>
                                  <div className="font-medium">{review.productId?.title}</div>
                                  <Badge variant="outline" className="text-xs">Product</Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {getRatingStars(review.rating)}
                              <span className="ml-1 text-sm font-medium">{review.rating}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(review.isActive, review.isFlagged)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Contact Buyer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleActive(review._id)}>
                                  {review.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Hide Review
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Show Review
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleFlag(review._id)}>
                                  {review.isFlagged ? (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Unflag Review
                                    </>
                                  ) : (
                                    <>
                                      <Flag className="mr-2 h-4 w-4" />
                                      Flag Review
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteReview(review._id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Review
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
    </Protected>
  );
}

