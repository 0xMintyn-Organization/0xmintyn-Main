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
  Edit,
  Eye,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Users,
  Star,
  Clock,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import AdvancedLayout from "@/components/AdvancedLayout";

interface CourseAccessData {
  course: any;
  isEnrolled: boolean;
  isInstructor: boolean;
  enrollment: any;
  accessLevel: 'none' | 'student' | 'instructor' | 'admin';
}

function CourseAccessPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin } = useRole();
  const [loading, setLoading] = useState(true);
  const [accessData, setAccessData] = useState<CourseAccessData | null>(null);
  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      fetchCourseAccess();
    }
  }, [courseId]);

  const fetchCourseAccess = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}course/${courseId}`,
        { withCredentials: true }
      );

      if (!courseResponse.data.success) {
        throw new Error("Course not found");
      }

      const course = courseResponse.data.course;
      
      // Check enrollment status
      let enrollmentResponse;
      try {
        enrollmentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/check/${courseId}`,
          { withCredentials: true }
        );
      } catch (error) {
        enrollmentResponse = { data: { success: false, isEnrolled: false } };
      }

      const isEnrolled = enrollmentResponse.data.success && enrollmentResponse.data.isEnrolled;
      const isInstructor = course.createdBy._id === user?._id;
      const isAdminAccess = isAdmin();

      let accessLevel: 'none' | 'student' | 'instructor' | 'admin' = 'none';
      if (isAdminAccess) {
        accessLevel = 'admin';
      } else if (isInstructor) {
        accessLevel = 'instructor';
      } else if (isEnrolled) {
        accessLevel = 'student';
      }

      setAccessData({
        course,
        isEnrolled,
        isInstructor,
        enrollment: enrollmentResponse.data.enrollment,
        accessLevel
      });

    } catch (error: any) {
      console.error("Error fetching course access:", error);
      toast({
        title: "Error",
        description: "Failed to load course access information",
        variant: "destructive",
      });
      router.push("/educationhub");
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCourse = () => {
    if (!accessData) return;

    switch (accessData.accessLevel) {
      case 'admin':
      case 'instructor':
        router.push(`/instructor/courses/${courseId}`);
        break;
      case 'student':
        router.push(`/courses/${courseId}/learn`);
        break;
      default:
        router.push(`/educationhub/${courseId}`);
    }
  };

  const getAccessButton = () => {
    if (!accessData) return null;

    switch (accessData.accessLevel) {
      case 'admin':
        return (
          <Button
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleAccessCourse}
          >
            <Eye className="w-4 h-4 mr-2" />
            Admin View
          </Button>
        );
      case 'instructor':
        return (
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAccessCourse}
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage Course
          </Button>
        );
      case 'student':
        return (
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleAccessCourse}
          >
            <Play className="w-4 h-4 mr-2" />
            Enter Course
          </Button>
        );
      default:
        return (
          <Button
            size="lg"
            className="w-full bg-gray-400 text-white cursor-not-allowed"
            disabled
          >
            <Lock className="w-4 h-4 mr-2" />
            Access Denied
          </Button>
        );
    }
  };

  const getAccessStatus = () => {
    if (!accessData) return null;

    switch (accessData.accessLevel) {
      case 'admin':
        return (
          <div className="flex items-center gap-2 text-purple-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Admin Access</span>
          </div>
        );
      case 'instructor':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Instructor Access</span>
          </div>
        );
      case 'student':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Student Access</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">No Access</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Protected>
        <AdvancedLayout>
          <div className="min-h-screen flex items-center justify-center">
            <Spinner />
          </div>
        </AdvancedLayout>
      </Protected>
    );
  }

  if (!accessData) {
    return (
      <Protected>
        <AdvancedLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Course Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The course you're looking for doesn't exist or you don't have access.
              </p>
              <Button onClick={() => router.push("/educationhub")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </div>
          </div>
        </AdvancedLayout>
      </Protected>
    );
  }

  return (
    <Protected>
      <AdvancedLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/educationhub")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {accessData.course.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Course Access Portal
                </p>
              </div>
              {getAccessStatus()}
            </div>
          </div>

          {/* Course Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{accessData.course.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {accessData.course.description}
                  </CardDescription>
                </div>
                <img
                  src={accessData.course.thumbnail}
                  alt={accessData.course.name}
                  className="w-24 h-24 object-cover rounded-lg ml-4"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {accessData.course.courseData?.length || 0} Lessons
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {accessData.course.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {accessData.course.averageRating || 0} Rating
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {accessData.course.students || 0} Students
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Card */}
          <Card>
            <CardHeader>
              <CardTitle>Course Access</CardTitle>
              <CardDescription>
                {accessData.accessLevel === 'none' && 
                  "You need to enroll in this course to access the content."}
                {accessData.accessLevel === 'student' && 
                  "You are enrolled in this course. Click below to start learning."}
                {accessData.accessLevel === 'instructor' && 
                  "You are the instructor of this course. Click below to manage the course."}
                {accessData.accessLevel === 'admin' && 
                  "You have admin access to this course. Click below to view course details."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAccessButton()}
                
                {accessData.accessLevel === 'none' && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Want to access this course? Enroll now to start learning!
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/educationhub/${courseId}`)}
                    >
                      View Course Details
                    </Button>
                  </div>
                )}

                {accessData.accessLevel === 'student' && accessData.enrollment && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Enrolled on {new Date(accessData.enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdvancedLayout>
    </Protected>
  );
}

export default CourseAccessPage;
