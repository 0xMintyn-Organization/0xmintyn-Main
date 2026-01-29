"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardAPI, apiCall } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  Users,
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  ShoppingCart,
  Zap,
  Target,
  ChevronRight,
  CheckCircle,
  BarChart3,
  Crown,
  GraduationCap,
  Package,
  Briefcase,
  ArrowUpRight,
  Trophy,
  Activity,
  Code,
  Palette,
  Music,
  Video,
  PenTool,
  Smartphone,
  User,
  Rocket,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

// Icon mapping for activity types
const activityIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  ShoppingCart,
  Briefcase,
  Star
};

interface DashboardState {
  auth: {
    user: {
      firstName?: string;
      lastName?: string;
    } | null;
  };
}

interface Instructor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: string;
  students: number;
  courses: number;
  verified: boolean;
  badge: string;
  level: string;
}

interface Category {
  name: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Activity {
  id: string;
  type: string;
  user: string;
  action: string;
  item: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function EnhancedDashboard() {
  const router = useRouter();
  const { user } = useSelector((state: DashboardState) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Debug: Log user data to help troubleshoot
  useEffect(() => {
    console.log("Dashboard - User data:", user);
    console.log("Dashboard - User data:", user);
  }, [user]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState([
    { icon: GraduationCap, label: "Instructors", value: "0", change: "+0%", color: "text-gray-400" },
    { icon: BookOpen, label: "Courses", value: "0", change: "+0%", color: "text-gray-400" },
    { icon: Star, label: "Avg Rating", value: "0.0", change: "+0.0", color: "text-gray-400" }
  ]);

  const [topInstructors, setTopInstructors] = useState<Instructor[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<Category[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all stats in parallel (excluding Total Users - admin only)
        // Wrap each call in error handling so one failure doesn't break all
        const [
          instructorsData,
          coursesData,
          ratingData,
          instructorsList,
          categoriesList,
          activityList,
          enrolledCoursesData
        ] = await Promise.all([
          dashboardAPI.getTotalInstructors().catch((err) => {
            console.error("Error fetching instructors:", err);
            return { success: false, data: { totalInstructors: 0, change: "+0%" } };
          }),
          dashboardAPI.getTotalCourses().catch((err) => {
            console.error("Error fetching courses:", err);
            return { success: false, data: { totalCourses: 0, change: "+0%" } };
          }),
          dashboardAPI.getAvgRating().catch((err) => {
            console.error("Error fetching rating:", err);
            return { success: false, data: { avgRating: 0, change: "+0.0" } };
          }),
          dashboardAPI.getTopInstructors(12).catch((err) => {
            console.error("Error fetching top instructors:", err);
            return { success: false, data: { instructors: [] } };
          }),
          dashboardAPI.getTrendingCategories().catch((err) => {
            console.error("Error fetching categories:", err);
            return { success: false, data: { categories: [] } };
          }),
          dashboardAPI.getRecentActivity(10).catch((err) => {
            console.error("Error fetching activity:", err);
            return { success: false, data: { activities: [] } };
          }),
          apiCall({
            method: 'GET',
            url: 'enrollment/my-courses'
          }).catch(() => ({ success: false, courses: [] })) // Handle error gracefully
        ]);

        // Update platform stats (Total Users removed - admin only)
        // Log data for debugging
        console.log("Dashboard API Responses:", {
          instructors: instructorsData,
          courses: coursesData,
          rating: ratingData
        });
        
        setPlatformStats([
          {
            icon: GraduationCap,
            label: "Instructors",
            value: (instructorsData?.success && instructorsData?.data?.totalInstructors) 
              ? instructorsData.data.totalInstructors.toLocaleString() 
              : "0",
            change: instructorsData?.data?.change || instructorsData?.data?.growth || "+0%",
            color: "text-gray-400"
          },
          {
            icon: BookOpen,
            label: "Courses",
            value: (coursesData?.success && coursesData?.data?.totalCourses) 
              ? coursesData.data.totalCourses.toLocaleString() 
              : "0",
            change: coursesData?.data?.change || coursesData?.data?.growth || "+0%",
            color: "text-gray-400"
          },
          {
            icon: Star,
            label: "Avg Rating",
            value: (ratingData?.success && ratingData?.data?.avgRating !== undefined) 
              ? ratingData.data.avgRating.toFixed(1) 
              : "0.0",
            change: ratingData?.data?.change || ratingData?.data?.growth || "+0.0",
            color: "text-gray-400"
          }
        ]);

        // Update lists
        setTopInstructors(instructorsList.data?.instructors || []);

        // Map trending categories with icons
        const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
          "Web Development": Code,
          "UI/UX Design": Palette,
          "Mobile Development": Smartphone,
          "Digital Marketing": Target,
          "Data Science": BarChart3,
          "Content Writing": PenTool,
          "Design & Creative": Palette,
          "Writing & Translation": PenTool,
          "Video & Animation": Video,
          "Music & Audio": Music,
          "Programming & Tech": Code
        };

        const formattedCategories = (categoriesList.data?.categories || []).map((cat: { name: string; count: number }) => ({
          name: cat.name,
          count: cat.count,
          icon: categoryIcons[cat.name] || Code,
          color: "bg-gray-600"
        }));
        setTrendingCategories(formattedCategories);

        // Map recent activity with icons
        const formattedActivity = (activityList.data?.activities || []).map((activity: { icon: string; [key: string]: unknown }) => ({
          ...activity,
          icon: activityIconMap[activity.icon] || CheckCircle
        }));
        setRecentActivity(formattedActivity);

        // Set enrolled courses with progress
        if (enrolledCoursesData.success && enrolledCoursesData.courses) {
          // Fetch progress for each course
          const coursesWithProgress = await Promise.all(
            enrolledCoursesData.courses.slice(0, 6).map(async (enrollment: any) => {
              try {
                const progressResponse = await apiCall({
                  method: 'GET',
                  url: `enrollment/progress/${enrollment.courseId}`
                });
                return {
                  ...enrollment,
                  progress: progressResponse.data?.progressPercentage || 0,
                  completedLectures: progressResponse.data?.completedLectures || 0,
                  totalLectures: progressResponse.data?.totalLectures || 0
                };
              } catch {
                return {
                  ...enrollment,
                  progress: 0,
                  completedLectures: 0,
                  totalLectures: 0
                };
              }
            })
          );
          setEnrolledCourses(coursesWithProgress);
        } else {
          setEnrolledCourses([]);
        }

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        console.error("Error details:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status
        });
        
        // Set default values on error but don't crash
        setPlatformStats([
          { icon: GraduationCap, label: "Instructors", value: "0", change: "+0%", color: "text-gray-400" },
          { icon: BookOpen, label: "Courses", value: "0", change: "+0%", color: "text-gray-400" },
          { icon: Package, label: "Products", value: "0", change: "+0%", color: "text-gray-400" },
          { icon: Briefcase, label: "Services", value: "0", change: "+0%", color: "text-gray-400" },
          { icon: Star, label: "Avg Rating", value: "0.0", change: "+0.0", color: "text-gray-400" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {getGreeting()}, {user?.firstName || "User"}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome to Equalmint - Your learning and earning platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === "user" && (
                <>
                  <Button
                    onClick={() => router.push("/contributor/apply")}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Become Contributor
                  </Button>
                  <Button
                    onClick={() => router.push("/startup/apply")}
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Apply as Startup
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => router.push("/courses")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-8">
        {/* Platform Stats */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Platform Overview
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover top instructors and courses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
          {platformStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 relative">
              <CardContent className="p-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <div className="w-4 h-4 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center">
                      <stat.icon className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className={`text-xs font-medium ${stat.color}`}>
                    {stat.change} from last month
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instructors">Top Instructors</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Instructors Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                    Top Instructors
                  </CardTitle>
                  <CardDescription>
                    Meet our most successful educators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {topInstructors.length > 0 ? (
                    topInstructors.slice(0, 3).map((instructor) => (
                    <div key={instructor.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback>{instructor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-zinc-900 dark:text-white">
                            {instructor.name}
                          </h3>
                          {instructor.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {instructor.students.toLocaleString()} students • {instructor.courses} courses
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium ml-1">{instructor.rating}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {instructor.badge}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No instructors available</p>
                    </div>
                  )}
                  {topInstructors.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("instructors")}
                    >
                      View All Instructors
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Trending Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Trending Categories
                  </CardTitle>
                  <CardDescription>
                    Most popular learning areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trendingCategories.length > 0 ? (
                    trendingCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-600">
                          <category.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-900 dark:text-white">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.count.toLocaleString()} items
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No trending categories available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Get started with these popular actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => router.push("/courses")}
                  >
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">Browse Courses</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Start Learning</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => router.push("/governance")}
                  >
                    <Users className="w-6 h-6 text-purple-600" />
                    <span className="font-medium">Governance</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Vote & Propose</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => router.push("/myprofile")}
                  >
                    <User className="w-6 h-6 text-orange-600" />
                    <span className="font-medium">My Profile</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Manage Account</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Instructors Tab */}
          <TabsContent value="instructors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                  Top Instructors
                </CardTitle>
                <CardDescription>
                  Meet our most successful educators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topInstructors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topInstructors.map((instructor) => (
                      <div key={instructor.id} className="p-6 border border-gray-200 dark:border-zinc-700 rounded-lg hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={instructor.avatar} alt={instructor.name} />
                            <AvatarFallback>{instructor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-zinc-900 dark:text-white">
                                {instructor.name}
                              </h3>
                              {instructor.verified && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              @{instructor.username}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Students</span>
                                <span className="text-sm font-medium">{instructor.students.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Courses</span>
                                <span className="text-sm font-medium">{instructor.courses}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                  <span className="text-sm font-medium">{instructor.rating}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="mt-3">
                              {instructor.badge}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                      No instructors available
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check back later for top instructors
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  My Courses
                </CardTitle>
                <CardDescription>
                  All your enrolled courses and learning progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.map((enrollment) => {
                      const course = enrollment.course || {};
                      const progress = enrollment.progress || 0;
                      const completedLectures = enrollment.completedLectures || 0;
                      const totalLectures = enrollment.totalLectures || 0;
                      const remainingLectures = totalLectures - completedLectures;
                      const isCompleted = progress >= 100;
                      const isInProgress = progress > 0 && progress < 100;
                      
                      // Get course category icon
                      const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
                        "Web Development": Code,
                        "UI/UX Design": Palette,
                        "Mobile Development": Smartphone,
                        "Digital Marketing": Target,
                        "Data Science": BarChart3,
                        "Content Writing": PenTool,
                        "Design & Creative": Palette,
                        "Writing & Translation": PenTool,
                        "Video & Animation": Video,
                        "Music & Audio": Music,
                        "Programming & Tech": Code
                      };
                      const CategoryIcon = course.categories && course.categories.length > 0
                        ? categoryIcons[course.categories[0]] || Code
                        : Code;

                      // Color based on progress
                      const progressColor = isCompleted ? "bg-purple-500" : isInProgress ? "bg-blue-500" : "bg-green-500";
                      const bgColor = isCompleted ? "bg-purple-100 dark:bg-purple-900/20" : isInProgress ? "bg-blue-100 dark:bg-blue-900/20" : "bg-green-100 dark:bg-green-900/20";
                      const iconColor = isCompleted ? "text-purple-600" : isInProgress ? "text-blue-600" : "text-green-600";

                      return (
                        <div key={enrollment.courseId} className="p-6 border border-gray-200 dark:border-zinc-700 rounded-lg hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start space-x-4">
                            <div className={`w-16 h-16 ${bgColor} rounded-lg flex items-center justify-center`}>
                              <CategoryIcon className={`w-8 h-8 ${iconColor}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white line-clamp-1">
                                  {enrollment.courseName || course.name || "Course"}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Recently Started"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {course.description || "Continue learning"}
                              </p>
                              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mb-3">
                                <div className={`h-2 ${progressColor} rounded-full transition-all`} style={{ width: `${progress}%` }}></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {isCompleted 
                                    ? "Completed • Certificate earned"
                                    : `${Math.round(progress)}% complete${remainingLectures > 0 ? ` • ${remainingLectures} lessons remaining` : ""}`
                                  }
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => router.push(`/courses/${enrollment.courseId}`)}
                                >
                                  {isCompleted ? "View Certificate" : "Continue"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                      No enrolled courses yet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Start your learning journey by enrolling in a course
                    </p>
                    <Button onClick={() => router.push("/educationhub")}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest platform activity and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-zinc-800">
                      <activity.icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold">{activity.item}</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
