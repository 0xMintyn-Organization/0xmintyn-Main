"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  ArrowLeft,
  BookOpen,
  Users,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Edit,
  Eye,
} from "lucide-react";

interface CourseAccessData {
  hasAccess: boolean;
  accessLevel: 'none' | 'student' | 'instructor' | 'admin';
  isAdmin: boolean;
  isInstructor: boolean;
  isEnrolled: boolean;
  course: {
    _id: string;
    name: string;
    description: string;
    thumbnail: string;
    price: number;
    level: string;
    createdBy: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
  };
  enrollment: any;
}

interface CourseAccessGuardProps {
  children: React.ReactNode;
  requiredAccess?: ('student' | 'instructor' | 'admin')[];
  fallbackPath?: string;
}

export default function CourseAccessGuard({ 
  children, 
  requiredAccess = ['student', 'instructor', 'admin'],
  fallbackPath = "/educationhub"
}: CourseAccessGuardProps) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accessData, setAccessData] = useState<CourseAccessData | null>(null);
  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      checkCourseAccess();
    }
  }, [courseId]);

  const checkCourseAccess = async () => {
    try {
      setLoading(true);
      
      const accessResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/access/${courseId}`,
        { withCredentials: true }
      );

      if (!accessResponse.data.success) {
        throw new Error("Failed to check course access");
      }

      const accessData = accessResponse.data;
      setAccessData(accessData);

      // Check if user has required access
      if (!accessData.hasAccess || !requiredAccess.includes(accessData.accessLevel)) {
        // Don't redirect, just show access denied message
        return;
      }

    } catch (error: any) {
      console.error("Error checking course access:", error);
      // Don't redirect on error, just show error state
      setAccessData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCourse = () => {
    if (!accessData) return;

    switch (accessData.accessLevel) {
      case 'admin':
        router.push(`/instructor/courses/${courseId}`);
        break;
      case 'instructor':
        router.push(`/instructor/courses/${courseId}`);
        break;
      case 'student':
        router.push(`/courses/${courseId}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!accessData || !accessData.hasAccess || !requiredAccess.includes(accessData.accessLevel)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this course content. Only course instructors, enrolled students, and administrators can view this course.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accessData && (
              <div className="space-y-4">
                
                <div className="flex items-center justify-center">
                  {getAccessStatus()}
                </div>

                <div className="text-center">
                  {getAccessButton()}
                </div>
              </div>
            )}
            
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>To access this course, you need to:</p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Be enrolled in this course</li>
                  <li>• Be the course instructor</li>
                  <li>• Have administrator privileges</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="default"
                  onClick={() => router.push(`/educationhub/${courseId}`)}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Course Details
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push(fallbackPath)}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
