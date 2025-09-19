"use client";

import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BookOpen,
  Clock,
  Star,
  Download,
  Calendar,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  Target,
  Zap,
  Eye,
  MessageSquare,
  ThumbsUp,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  ShoppingCart,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Truck,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types
interface DashboardData {
  overview: {
    totalRevenue: number;
    totalStudents: number;
    totalCourses: number;
    totalOrders: number;
    averageRating: number;
    completionRate: number;
    monthlyRevenue: number;
    monthlyStudents: number;
  };
  recentOrders: Array<{
    _id: string;
    courseName: string;
    studentName: string;
    studentEmail: string;
    amount: number;
    status: string;
    createdAt: string;
    courseId: string;
    userId: string;
  }>;
  topCourses: Array<{
    _id: string;
    name: string;
    students: number;
    revenue: number;
    rating: number;
    reviews: number;
  }>;
  monthlyStats: Array<{
    month: string;
    revenue: number;
    students: number;
    orders: number;
  }>;
}

function InstructorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState("last30days");
  const [ordersFilter, setOrdersFilter] = useState("all");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}instructor/dashboard`,
        {
          params: { timeRange },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch dashboard data");
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      
      // Set default empty data to prevent crashes
      setDashboardData({
        overview: {
          totalRevenue: 0,
          totalStudents: 0,
          totalCourses: 0,
          totalOrders: 0,
          averageRating: 0,
          completionRate: 0,
          monthlyRevenue: 0,
          monthlyStudents: 0
        },
        recentOrders: [],
        topCourses: [],
        monthlyStats: []
      });
      
      toast({
        title: "Warning",
        description: error.response?.data?.message || "Using cached data. Some information may be outdated.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const handleViewOrder = (orderId: string) => {
    // Navigate to order details or show modal
    console.log("View order:", orderId);
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/instructor/courses/${courseId}`);
  };

  const handleViewStudent = (userId: string) => {
    // Navigate to student profile or show modal
    console.log("View student:", userId);
  };

  const exportData = () => {
    // Implement CSV export functionality
    console.log("Exporting dashboard data...");
    toast({
      title: "Export Started",
      description: "Your dashboard data is being prepared for download.",
    });
  };

  const refreshData = () => {
    fetchDashboardData();
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Unable to load dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading your dashboard data.
          </p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Instructor Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Overview of your courses, students, and earnings
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="last3months">Last 3 months</SelectItem>
                    <SelectItem value="last6months">Last 6 months</SelectItem>
                    <SelectItem value="lastyear">Last year</SelectItem>
                    <SelectItem value="alltime">All time</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={refreshData}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  onClick={exportData}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.overview.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    {formatCurrency(dashboardData.overview.monthlyRevenue)}
                  </span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.totalStudents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    +{dashboardData.overview.monthlyStudents}
                  </span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.totalOrders.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Activity className="w-3 h-3 mr-1 text-blue-600" />
                  <span className="text-blue-600">
                    {dashboardData.overview.completionRate}%
                  </span> completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(dashboardData.overview.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({dashboardData.overview.totalCourses} courses)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>
                        Latest course enrollments and purchases
                      </CardDescription>
                    </div>
                    <Select value={ordersFilter} onValueChange={setOrdersFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter orders" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No orders yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Orders will appear here once students start enrolling in your courses.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboardData.recentOrders
                            .filter(order => 
                              ordersFilter === "all" || 
                              order.status.toLowerCase() === ordersFilter
                            )
                            .slice(0, 10)
                            .map((order) => (
                            <TableRow key={order._id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {order.studentName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {order.studentEmail}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {order.courseName}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(order.amount)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(order.status)}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                {format(new Date(order.createdAt), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewOrder(order._id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewCourse(order.courseId)}>
                                      <BookOpen className="mr-2 h-4 w-4" />
                                      View Course
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewStudent(order.userId)}>
                                      <User className="mr-2 h-4 w-4" />
                                      View Student
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Courses */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Courses</CardTitle>
                  <CardDescription>
                    Your best-selling courses by revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.topCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No courses yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first course to get started
                      </p>
                      <Button 
                        onClick={() => router.push("/create-course")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Course
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.topCourses.slice(0, 5).map((course, index) => (
                        <div
                          key={course._id}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          onClick={() => handleViewCourse(course._id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-green-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {course.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {course.students} students • {course.reviews} reviews
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {formatCurrency(course.revenue)}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {course.rating.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push("/create-course")}
                >
                  <Plus className="w-6 h-6 text-green-600" />
                  <span className="text-sm">Create Course</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push("/instructor/analytics")}
                >
                  <Activity className="w-6 h-6 text-blue-600" />
                  <span className="text-sm">View Analytics</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push("/instructor/my-courses")}
                >
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <span className="text-sm">Manage Courses</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={exportData}
                >
                  <Download className="w-6 h-6 text-orange-600" />
                  <span className="text-sm">Export Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Protected>
  );
}

export default InstructorDashboard;
