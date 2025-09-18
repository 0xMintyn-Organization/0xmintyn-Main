"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  Search,
  Clock,
  Users,
  Star,
  Play,
  Trash2,
  Filter,
  Grid,
  List,
  Heart,
  BookOpen,
  Calendar,
  User,
  DollarSign,
  Tag,
  ChevronRight,
  Eye,
} from "lucide-react";
import Spinner from "@/components/Spinner";

interface BookmarkItem {
  _id: string;
  courseId: string;
  courseName: string;
  courseDescription: string;
  courseThumbnail: string;
  instructorName: string;
  coursePrice: number;
  courseCategory: string;
  courseLevel: string;
  courseDuration: string;
  createdAt: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [categorizedBookmarks, setCategorizedBookmarks] = useState<Record<string, BookmarkItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [removingBookmark, setRemovingBookmark] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/my-bookmarks`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setBookmarks(response.data.bookmarks);
        setCategorizedBookmarks(response.data.categorizedBookmarks);
      }
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookmarks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (courseId: string) => {
    try {
      setRemovingBookmark(courseId);
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/remove/${courseId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setBookmarks(prev => prev.filter(bookmark => bookmark.courseId !== courseId));
        
        // Update categorized bookmarks
        const updatedCategorized = { ...categorizedBookmarks };
        Object.keys(updatedCategorized).forEach(category => {
          updatedCategorized[category] = updatedCategorized[category].filter(
            bookmark => bookmark.courseId !== courseId
          );
        });
        setCategorizedBookmarks(updatedCategorized);

        toast({
          title: "Bookmark Removed",
          description: "Course removed from your bookmarks.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error removing bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingBookmark(null);
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.courseDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || bookmark.courseCategory === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Object.keys(categorizedBookmarks)];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Bookmarks
            </h1>
            <Badge variant="secondary" className="ml-2">
              {bookmarks.length} courses
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your saved courses organized by category
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  <Tag className="w-4 h-4 mr-1" />
                  {category === "all" ? "All Categories" : category}
                </Button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bookmarks Content */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || selectedCategory !== "all" ? "No matching bookmarks" : "No bookmarks yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Start bookmarking courses to see them here."
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => router.push("/educationhub")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredBookmarks.map((bookmark) => (
              <Card key={bookmark._id} className="group hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-0">
                  {viewMode === "grid" ? (
                    // Grid View
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                        {bookmark.courseThumbnail ? (
                          <img
                            src={bookmark.courseThumbnail}
                            alt={bookmark.courseName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {bookmark.courseCategory}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBookmark(bookmark.courseId)}
                            disabled={removingBookmark === bookmark.courseId}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {bookmark.courseName}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {bookmark.courseDescription}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {bookmark.instructorName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {bookmark.courseDuration}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {bookmark.courseLevel}
                            </Badge>
                            <span className="text-lg font-bold text-green-600">
                              ${bookmark.coursePrice}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCourseClick(bookmark.courseId)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <div className="flex p-4">
                      <div className="w-32 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                        {bookmark.courseThumbnail ? (
                          <img
                            src={bookmark.courseThumbnail}
                            alt={bookmark.courseName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {bookmark.courseCategory}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {bookmark.courseLevel}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBookmark(bookmark.courseId)}
                            disabled={removingBookmark === bookmark.courseId}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {bookmark.courseName}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-1">
                          {bookmark.courseDescription}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {bookmark.instructorName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {bookmark.courseDuration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            ${bookmark.coursePrice}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleCourseClick(bookmark.courseId)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Course
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
