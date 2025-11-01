"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardAPI } from "@/lib/api";
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

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge: string;
  category: string;
  downloads: number;
  seller: string;
  fileFormat: string;
  license: string;
}

interface Service {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  seller: string;
  deliveryTime: string;
  badge: string;
  category: string;
  orders: number;
  revisions: string;
  level: string;
}

interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalSales: number;
  products: number;
  services: number;
  earnings: string;
  verified: boolean;
  level: string;
  badge: string;
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
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState([
    { icon: Users, label: "Total Users", value: "0", change: "+0%", color: "text-slate-400" },
    { icon: GraduationCap, label: "Instructors", value: "0", change: "+0%", color: "text-slate-400" },
    { icon: BookOpen, label: "Courses", value: "0", change: "+0%", color: "text-slate-400" },
    { icon: Package, label: "Products", value: "0", change: "+0%", color: "text-slate-400" },
    { icon: Briefcase, label: "Services", value: "0", change: "+0%", color: "text-slate-400" },
    { icon: Star, label: "Avg Rating", value: "0.0", change: "+0.0", color: "text-slate-400" }
  ]);

  const [topInstructors, setTopInstructors] = useState<Instructor[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [topServices, setTopServices] = useState<Service[]>([]);
  const [topSellers, setTopSellers] = useState<Seller[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<Category[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

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

        // Fetch all stats in parallel
        const [
          usersData,
          instructorsData,
          coursesData,
          productsData,
          servicesData,
          ratingData,
          instructorsList,
          productsList,
          servicesList,
          sellersList,
          categoriesList,
          activityList
        ] = await Promise.all([
          dashboardAPI.getTotalUsers(),
          dashboardAPI.getTotalInstructors(),
          dashboardAPI.getTotalCourses(),
          dashboardAPI.getTotalProducts(),
          dashboardAPI.getTotalServices(),
          dashboardAPI.getAvgRating(),
          dashboardAPI.getTopInstructors(4),
          dashboardAPI.getTopProducts(4),
          dashboardAPI.getTopServices(4),
          dashboardAPI.getTopSellers(4),
          dashboardAPI.getTrendingCategories(),
          dashboardAPI.getRecentActivity(10)
        ]);

        // Update platform stats
        setPlatformStats([
          {
            icon: Users,
            label: "Total Users",
            value: usersData.data?.totalUsers?.toLocaleString() || "0",
            change: usersData.data?.change || "+0%",
            color: "text-slate-400"
          },
          {
            icon: GraduationCap,
            label: "Instructors",
            value: instructorsData.data?.totalInstructors?.toLocaleString() || "0",
            change: instructorsData.data?.change || "+0%",
            color: "text-slate-400"
          },
          {
            icon: BookOpen,
            label: "Courses",
            value: coursesData.data?.totalCourses?.toLocaleString() || "0",
            change: coursesData.data?.change || "+0%",
            color: "text-slate-400"
          },
          {
            icon: Package,
            label: "Products",
            value: productsData.data?.totalProducts?.toLocaleString() || "0",
            change: productsData.data?.change || "+0%",
            color: "text-slate-400"
          },
          {
            icon: Briefcase,
            label: "Services",
            value: servicesData.data?.totalServices?.toLocaleString() || "0",
            change: servicesData.data?.change || "+0%",
            color: "text-slate-400"
          },
          {
            icon: Star,
            label: "Avg Rating",
            value: ratingData.data?.avgRating?.toFixed(1) || "0.0",
            change: ratingData.data?.change || "+0.0",
            color: "text-slate-400"
          }
        ]);

        // Update lists
        setTopInstructors(instructorsList.data?.instructors || []);
        setTopProducts(productsList.data?.products || []);
        setTopServices(servicesList.data?.services || []);
        setTopSellers(sellersList.data?.sellers || []);

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
          color: "bg-slate-600"
        }));
        setTrendingCategories(formattedCategories);

        // Map recent activity with icons
        const formattedActivity = (activityList.data?.activities || []).map((activity: { icon: string; [key: string]: unknown }) => ({
          ...activity,
          icon: activityIconMap[activity.icon] || CheckCircle
        }));
        setRecentActivity(formattedActivity);

      } catch (error: unknown) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {getGreeting()}, {user?.firstName || "User"}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Welcome to 0xMintyn - Your learning and earning platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/marketplace")}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Explore Marketplace
              </Button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Stats */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Platform Overview
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover top instructors, courses, products, and services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-12">
          {platformStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 relative">
              <CardContent className="p-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                      <stat.icon className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instructors">Top Instructors</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
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
                  {(topInstructors.length > 0 ? topInstructors.slice(0, 3) : []).map((instructor) => (
                    <div key={instructor.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback>{instructor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {instructor.name}
                          </h3>
                          {instructor.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
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
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("instructors")}
                  >
                    View All Instructors
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
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
                  {trendingCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-slate-600">
                          <category.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {category.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {category.count.toLocaleString()} items
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
                    <span className="text-xs text-slate-600 dark:text-slate-400">Start Learning</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => router.push("/marketplace")}
                  >
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                    <span className="font-medium">Marketplace</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Buy & Sell</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => router.push("/governance")}
                  >
                    <Users className="w-6 h-6 text-purple-600" />
                    <span className="font-medium">Governance</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Vote & Propose</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => router.push("/myprofile")}
                  >
                    <User className="w-6 h-6 text-orange-600" />
                    <span className="font-medium">My Profile</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Manage Account</span>
                  </Button>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Code className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            React Fundamentals
                          </h3>
                          <Badge variant="secondary" className="text-xs">In Progress</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          Learn the basics of React development
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            75% complete • 3 lessons remaining
                          </span>
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Code className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            JavaScript Advanced
                          </h3>
                          <Badge variant="secondary" className="text-xs">Recently Started</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          Advanced JavaScript concepts and patterns
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            25% complete • 8 lessons remaining
                          </span>
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            HTML & CSS Basics
                          </h3>
                          <Badge variant="secondary" className="text-xs">Completed</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          Foundation of web development
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                          <div className="h-2 bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Completed • Certificate earned
                          </span>
                          <Button size="sm" variant="outline">
                            View Certificate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Top Products
                  </CardTitle>
                  <CardDescription>
                    Best-selling digital products
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(topProducts.length > 0 ? topProducts : []).map((product) => (
                    <div key={product.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Badge className="absolute -top-1 -right-1 text-xs">
                          {product.badge}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {product.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          by {product.seller} • {product.downloads.toLocaleString()} downloads
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium ml-1">{product.rating}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {product.fileFormat}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.license}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          ${product.price}
                        </div>
                        {product.originalPrice > product.price && (
                          <div className="text-sm text-slate-500 line-through">
                            ${product.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                    Top Services
                  </CardTitle>
                  <CardDescription>
                    Most popular services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(topServices.length > 0 ? topServices : []).map((service) => (
                    <div key={service.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={service.image}
                          alt={service.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Badge className="absolute -top-1 -right-1 text-xs">
                          {service.badge}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {service.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          by {service.seller} • {service.orders.toLocaleString()} orders
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium ml-1">{service.rating}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.deliveryTime}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {service.level}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          ${service.price}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {service.revisions} revisions
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Top Sellers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  Top Sellers
                </CardTitle>
                <CardDescription>
                  Our most successful marketplace sellers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(topSellers.length > 0 ? topSellers : []).map((seller) => (
                    <div key={seller.id} className="text-center p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-200">
                      <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarImage src={seller.avatar} alt={seller.name} />
                        <AvatarFallback>{seller.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {seller.name}
                        </h3>
                        {seller.verified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <Badge variant="outline" className="mb-3">
                        {seller.badge}
                      </Badge>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                          <span className="font-medium">{seller.rating}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          {seller.totalSales.toLocaleString()} sales
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {seller.products} products • {seller.services} services
                        </p>
                        <p className="text-green-600 font-medium">
                          {seller.earnings} earned
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="mt-4">
                        View Store
                      </Button>
                    </div>
                  ))}
                </div>
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
                {(recentActivity.length > 0 ? recentActivity : []).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <activity.icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold">{activity.item}</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
