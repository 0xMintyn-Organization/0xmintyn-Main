"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AdminProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Star, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  MessageSquare,
  BookOpen,
  User,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface Review {
  _id: string;
  userId: string;
  courseId: {
    _id: string;
    name: string;
    thumbnail?: string;
  };
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  name: string;
}

interface ReviewData {
  reviews: Review[];
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null
  });

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20"
      });
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (selectedCourse !== "all") {
        params.append("courseId", selectedCourse);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/admin/all?${params}`,
        { withCredentials: true }
      );
      
      setReviewData(response.data);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchTerm, selectedCourse]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle course filter
  const handleCourseFilter = (courseId: string) => {
    setSelectedCourse(courseId);
    setCurrentPage(1);
  };

  // Handle delete review
  const handleDeleteReview = async () => {
    if (!deleteDialog.review) return;

    try {
      setDeleting(deleteDialog.review._id);
      
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI}review/admin/${deleteDialog.review._id}`,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Review deleted successfully",
      });

      setDeleteDialog({ open: false, review: null });
      fetchReviews();
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete review",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <AdminProtected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Spinner fullScreen text="Loading reviews..." />
        </div>
      </AdminProtected>
    );
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="w-full px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                  Review Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage and moderate course reviews across the platform
                </p>
              </div>
            </div>

            {/* Statistics */}
            {reviewData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                          {reviewData.pagination.totalReviews}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                          {reviewData.courses.length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Courses with Reviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                          {reviewData.reviews.length > 0 
                            ? (reviewData.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewData.reviews.length).toFixed(1)
                            : "0.0"
                          }
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                          {new Set(reviewData.reviews.map(review => review.userId)).size}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Unique Reviewers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search reviews by content or user name..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="md:w-64">
                  <Select value={selectedCourse} onValueChange={handleCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {reviewData?.courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle>Course Reviews</CardTitle>
              <CardDescription>
                Manage and moderate reviews from students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewData?.reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewData?.reviews.map((review) => (
                    <div key={review._id} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback>
                            {review.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 dark:text-white">
                              {review.userName}
                            </h4>
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
                            {review.isVerified && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <BookOpen className="w-4 h-4" />
                              <span className="font-medium">{review.courseId.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(review.createdAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {review.helpful} helpful
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {review.comment}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/educationhub/${review.courseId._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Course
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, review })}
                              disabled={deleting === review._id}
                            >
                              {deleting === review._id ? (
                                <>
                                  <Spinner size="sm" inline />
                                  <span className="ml-2">Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {reviewData && reviewData.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      disabled={!reviewData.pagination.hasPrevPage}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {reviewData.pagination.currentPage} of {reviewData.pagination.totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      disabled={!reviewData.pagination.hasNextPage}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, review: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Delete Review
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this review? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {deleteDialog.review && (
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={deleteDialog.review.userAvatar} />
                    <AvatarFallback>
                      {deleteDialog.review.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{deleteDialog.review.userName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {deleteDialog.review.courseId.name}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  "{deleteDialog.review.comment}"
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialog({ open: false, review: null })}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteReview}
                disabled={deleting !== null}
              >
                {deleting ? "Deleting..." : "Delete Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminProtected>
  );
}
