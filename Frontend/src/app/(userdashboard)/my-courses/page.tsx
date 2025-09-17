"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Protected from "@/hooks/useProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Play,
  Clock,
  Star,
  Calendar,
  User,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface EnrolledCourse {
  orderId: string;
  courseId: string;
  courseName: string;
  courseThumbnail: string;
  coursePrice: number;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar: string;
  };
  enrolledAt: string;
  status: string;
  course: {
    _id: string;
    name: string;
    description: string;
    categories: string;
    level: string;
    averageRating: number;
    totalReviews: number;
    courseData: any[];
  };
}

function MyCoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/enrollment/my-courses`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error: any) {
      console.error("Error fetching enrolled courses:", error);
      toast({
        title: "Error",
        description: "Failed to load your courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || course.course.categories === categoryFilter;
    const matchesLevel = levelFilter === "all" || course.course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const calculateProgress = (course: EnrolledCourse) => {
    // This would be calculated based on user's progress through the course
    // For now, return a random progress for demonstration
    return Math.floor(Math.random() * 100);
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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Continue your learning journey
                </p>
              </div>
              <Button onClick={() => router.push("/educationhub")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse More Courses
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search your courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const progress = calculateProgress(course);
                return (
                  <Card key={course.orderId} className="group hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={course.courseThumbnail}
                        alt={course.courseName}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className={getLevelBadgeColor(course.course.level)}>
                          {course.course.level}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-white mt-1">{progress}% Complete</p>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-green-600 transition-colors">
                            {course.courseName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            by {course.instructor.firstName} {course.instructor.lastName}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{course.course.averageRating || 0}</span>
                          <span>({course.course.totalReviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.course.courseData?.length || 0} lessons</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Enrolled {new Date(course.enrolledAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push(`/courses/${course.courseId}`)}
                          className="bg-green-900 hover:bg-green-800 text-white"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || categoryFilter !== "all" || levelFilter !== "all" 
                  ? "No courses match your filters" 
                  : "No courses enrolled yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || categoryFilter !== "all" || levelFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Start your learning journey by enrolling in a course"}
              </p>
              <Button onClick={() => router.push("/educationhub")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}

export default MyCoursesPage;
