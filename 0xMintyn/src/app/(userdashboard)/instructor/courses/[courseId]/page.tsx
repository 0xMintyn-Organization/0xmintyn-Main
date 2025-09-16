"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Protected from "@/hooks/useProtected";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Eye,
  Users,
  Star,
  Clock,
  DollarSign,
  Calendar,
  BookOpen,
  Play,
  Download,
  Share2,
  MoreVertical,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";

interface CourseData {
  _id: string;
  name: string;
  description: string;
  categories: string;
  level: string;
  price: number;
  estimatedPrice: number;
  thumbnail: string;
  demoUrl: string;
  tags: string[];
  benefits: string[];
  prerequisites: string[];
  courseData: CourseSection[];
  createdBy: {
    _id: string;
    username: string;
    avatar: string;
  };
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseSection {
  title: string;
  description: string;
  videoSection: string;
  videos: CourseVideo[];
}

interface CourseVideo {
  title: string;
  videoUrl: string;
  videoLength: number;
  description: string;
  links: CourseLink[];
}

interface CourseLink {
  title: string;
  url: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const courseId = params.courseId as string;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/course/${courseId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }

        const data = await response.json();
        if (data.success) {
          setCourse(data.course);
        } else {
          throw new Error(data.message || "Failed to fetch course");
        }
      } catch (err: any) {
        console.error("Error fetching course:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, toast]);

  const calculateTotalDuration = () => {
    if (!course?.courseData) return 0;
    return course.courseData.reduce((total, section) => {
      return total + section.videos.reduce((sectionTotal, video) => sectionTotal + video.videoLength, 0);
    }, 0);
  };

  const calculateTotalVideos = () => {
    if (!course?.courseData) return 0;
    return course.courseData.reduce((total, section) => total + section.videos.length, 0);
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

  if (error || !course) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Course Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "The course you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {course.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Course Management
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${courseId}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Public
                </Button>
                <Button
                  onClick={() => router.push(`/instructor/courses/${courseId}/edit`)}
                  className="bg-green-900 hover:bg-green-800 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Course
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Course Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {course.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="sections" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sections">Sections</TabsTrigger>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sections" className="space-y-4">
                      {course.courseData.map((section, sectionIndex) => (
                        <div
                          key={sectionIndex}
                          className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4"
                        >
                          <h4 className="font-semibold mb-2">{section.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {section.description}
                          </p>
                          <div className="space-y-2">
                            {section.videos.map((video, videoIndex) => (
                              <div
                                key={videoIndex}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Play className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{video.title}</p>
                                    <p className="text-sm text-gray-500">
                                      {video.videoLength} minutes
                                    </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                          <h4 className="font-semibold mb-2">Benefits</h4>
                          <ul className="text-sm space-y-1">
                            {course.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                          <h4 className="font-semibold mb-2">Prerequisites</h4>
                          <ul className="text-sm space-y-1">
                            {course.prerequisites.map((prereq, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {prereq}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Videos
                    </span>
                    <span className="font-semibold">{calculateTotalVideos()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Duration
                    </span>
                    <span className="font-semibold">
                      {calculateTotalDuration()} minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Sections
                    </span>
                    <span className="font-semibold">{course.courseData.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Level
                    </span>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Category
                    </span>
                    <Badge variant="secondary">{course.categories}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Current Price
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ${course.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Original Price
                    </span>
                    <span className="text-lg line-through text-gray-500">
                      ${course.estimatedPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Discount
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {Math.round(((course.estimatedPrice - course.price) / course.estimatedPrice) * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Course Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Updated: {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Instructor: {course.createdBy.username}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}
