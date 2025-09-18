"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Protected from "@/hooks/useProtected";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Eye,
  Play,
  Star,
  Clock,
  Users,
  MoreVertical,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface PurchasedCourse {
  _id: string;
  courseId: string;
  courseName: string;
  courseThumbnail: string;
  coursePrice: number;
  instructorName: string;
  instructorId: string;
  status: string;
  enrolledAt: string;
  completedAt: string;
  course: {
    _id: string;
    name: string;
    description: string;
    thumbnail: string;
    price: number;
    level: string;
    categories: string;
    createdBy: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
  };
}

function PurchasedCoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<PurchasedCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const fetchPurchasedCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/my-courses`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error: unknown) {
      console.error("Error fetching purchased courses:", error);
      toast({
        title: "Error",
        description: "Failed to load your purchased courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPurchasedCourses();
  }, [fetchPurchasedCourses]);

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.courseName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || course.course.categories === categoryFilter;
    const matchesLevel =
      levelFilter === "all" || course.course.level === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getCategories = () => {
    const categories = new Set(courses.map((course) => course.course.categories));
    return Array.from(categories);
  };

  const getLevels = () => {
    const levels = new Set(courses.map((course) => course.course.level));
    return Array.from(levels);
  };

  if (loading) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Spinner />
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Purchased Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Courses you&apos;ve purchased from other instructors
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {courses.length > 0 ? "Courses purchased" : "No purchases yet"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${courses.reduce((sum, course) => sum + course.coursePrice, 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total investment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Instructors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(courses.map(course => course.instructorId)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Different instructors
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search purchased courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Levels</option>
                {getLevels().map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Courses List */}
          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {courses.length === 0 ? "No purchased courses yet" : "No courses match your filters"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {courses.length === 0 
                    ? "Start learning by purchasing courses from other instructors" 
                    : "Try adjusting your search or filter criteria"}
                </p>
                <Button onClick={() => router.push("/educationhub")}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course._id} className="group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Image
                      src={course.courseThumbnail}
                      alt={course.courseName}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Purchased
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {course.courseName}
                    </CardTitle>
                    <CardDescription>
                      by {course.instructorName}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.course.level}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>${course.coursePrice}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{course.course.categories}</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewCourse(course.courseId)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Learning
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCourse(course.courseId)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Course
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/educationhub/${course.courseId}`)}>
                              <BookOpen className="w-4 h-4 mr-2" />
                              Course Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}

export default PurchasedCoursesPage;
