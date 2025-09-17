"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Protected from "@/hooks/useProtected";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle,
  Lock,
  ArrowLeft,
  BookOpen,
  Clock,
  Download,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface CourseLearningData {
  course: any;
  currentLesson: any;
  progress: number;
}

function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useRole();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseLearningData | null>(null);
  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Check if user is enrolled
      const enrollmentResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/check/${courseId}`,
        { withCredentials: true }
      );

      if (!enrollmentResponse.data.success || !enrollmentResponse.data.isEnrolled) {
        toast({
          title: "Access Denied",
          description: "You are not enrolled in this course",
          variant: "destructive",
        });
        router.push(`/educationhub/${courseId}`);
        return;
      }

      // Fetch course details
      const courseResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/course/${courseId}`,
        { withCredentials: true }
      );

      if (!courseResponse.data.success) {
        throw new Error("Course not found");
      }

      const course = courseResponse.data.course;
      
      // Calculate progress (mock for now)
      const progress = Math.floor(Math.random() * 100);
      
      // Get current lesson (mock for now)
      const currentLesson = course.courseData?.[0]?.videos?.[0] || null;

      setCourseData({
        course,
        currentLesson,
        progress
      });

    } catch (error: any) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
      router.push("/my-courses");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson: any) => {
    // Handle lesson navigation
    console.log("Navigate to lesson:", lesson);
  };

  if (loading) {
    return (
      <Protected>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      </Protected>
    );
  }

  if (!courseData) {
    return (
      <Protected>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Course Not Found
            </h2>
            <Button onClick={() => router.push("/my-courses")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Courses
            </Button>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/my-courses")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Courses
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courseData.course.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Continue your learning journey
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {courseData.progress}% Complete
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Course Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                  <CardDescription>
                    {courseData.course.courseData?.length || 0} sections with lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseData.course.courseData?.map((section: any, sectionIndex: number) => (
                      <div key={sectionIndex} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">{section.title}</h3>
                        <div className="space-y-2">
                          {section.videos?.map((video: any, videoIndex: number) => (
                            <div
                              key={videoIndex}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                              onClick={() => handleLessonClick(video)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                  <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{video.title}</p>
                                  <p className="text-sm text-gray-500">
                                    {video.videoLength} minutes
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-sm text-gray-500">Completed</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {courseData.progress}%
                        </div>
                        <p className="text-sm text-gray-500">Complete</p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${courseData.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {courseData.course.courseData?.length || 0} Sections
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {courseData.course.level} Level
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {courseData.course.categories}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Resources
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ask Question
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
    </Protected>
  );
}

export default CourseLearningPage;
