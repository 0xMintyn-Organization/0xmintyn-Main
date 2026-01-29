/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
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
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalStudents: number;
    totalCourses: number;
    averageRating: number;
    completionRate: number;
    engagementRate: number;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    students: number;
  }>;
  coursePerformance: Array<{
    id: number;
    title: string;
    students: number;
    revenue: number;
    rating: number;
    completionRate: number;
    engagementRate: number;
  }>;
  studentDemographics: Array<{
    country: string;
    students: number;
    percentage: number;
  }>;
  engagementMetrics: {
    averageWatchTime: number;
    totalWatchHours: number;
    averageCompletionTime: number;
    discussionPosts: number;
    assignmentsSubmitted: number;
  };
}

// Dummy data
const dummyAnalyticsData: AnalyticsData = {
  overview: {
    totalRevenue: 45678,
    totalStudents: 3456,
    totalCourses: 12,
    averageRating: 4.7,
    completionRate: 68,
    engagementRate: 82,
  },
  revenueData: [
    { month: "Jan", revenue: 3200, students: 120 },
    { month: "Feb", revenue: 3800, students: 145 },
    { month: "Mar", revenue: 4200, students: 168 },
    { month: "Apr", revenue: 3900, students: 155 },
    { month: "May", revenue: 4500, students: 189 },
    { month: "Jun", revenue: 5200, students: 210 },
    { month: "Jul", revenue: 4800, students: 198 },
    { month: "Aug", revenue: 5100, students: 205 },
    { month: "Sep", revenue: 5500, students: 225 },
    { month: "Oct", revenue: 5478, students: 220 },
  ],
  coursePerformance: [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      students: 1234,
      revenue: 15678,
      rating: 4.8,
      completionRate: 72,
      engagementRate: 85,
    },
    {
      id: 2,
      title: "Advanced React Patterns",
      students: 856,
      revenue: 12890,
      rating: 4.9,
      completionRate: 78,
      engagementRate: 88,
    },
    {
      id: 3,
      title: "UI/UX Design Fundamentals",
      students: 567,
      revenue: 8901,
      rating: 4.7,
      completionRate: 65,
      engagementRate: 79,
    },
    {
      id: 4,
      title: "Digital Marketing Masterclass",
      students: 432,
      revenue: 6789,
      rating: 4.6,
      completionRate: 62,
      engagementRate: 76,
    },
    {
      id: 5,
      title: "Python for Data Science",
      students: 367,
      revenue: 5420,
      rating: 4.8,
      completionRate: 70,
      engagementRate: 83,
    },
  ],
  studentDemographics: [
    { country: "United States", students: 1234, percentage: 35.7 },
    { country: "India", students: 890, percentage: 25.8 },
    { country: "United Kingdom", students: 456, percentage: 13.2 },
    { country: "Canada", students: 345, percentage: 10.0 },
    { country: "Australia", students: 234, percentage: 6.8 },
    { country: "Others", students: 297, percentage: 8.5 },
  ],
  engagementMetrics: {
    averageWatchTime: 42,
    totalWatchHours: 145234,
    averageCompletionTime: 28,
    discussionPosts: 3456,
    assignmentsSubmitted: 2890,
  },
};

// Chart colors
const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function InstructorAnalytics() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(dummyAnalyticsData);
  const [courses, setCourses] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("last30days");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch analytics data
        const analyticsRes = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}instructor/analytics`, {
          params: { timeRange, courseId: selectedCourse },
          withCredentials: true
        });
        
        // Fetch instructor's courses
        const coursesRes = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}course/instructor/my-courses`, {
          withCredentials: true
        });
        
        if (analyticsRes.data.success && analyticsRes.data.analytics) {
          setAnalyticsData(analyticsRes.data.analytics);
        } else {
          setAnalyticsData(dummyAnalyticsData);
        }
        
        if (coursesRes.data.success) {
          setCourses(coursesRes.data.courses);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        
        // Use dummy data as fallback to prevent crashes
        setAnalyticsData(dummyAnalyticsData);
        
        toast({
          title: "Warning",
          description: err.response?.data?.message || "Using sample data. Some information may be outdated.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, selectedCourse]);

  const calculatePercentageChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  // Course management functions
  const handleViewCourse = (courseId: string) => {
    router.push(`/instructor/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/instructor/courses/${courseId}/edit`);
  };

  const handleDeleteCourse = (course: any) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI}course/${courseToDelete._id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Course deleted successfully!",
        });
        
        // Remove course from local state
        setCourses(courses.filter(course => course._id !== courseToDelete._id));
        
        // Refresh analytics data
          const analyticsRes = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}instructor/analytics`, {
          params: { timeRange, courseId: selectedCourse },
          withCredentials: true
        });
        
        if (analyticsRes.data.success && analyticsRes.data.analytics) {
          setAnalyticsData(analyticsRes.data.analytics);
        }
      } else {
        throw new Error(response.data.message || "Failed to delete course");
      }
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleCreateCourse = () => {
    router.push("/create-course");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportData = () => {
    // Implement CSV export functionality
    console.log("Exporting analytics data...");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
            Unable to load analytics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading your analytics data.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
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
          <div className="w-full px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your course performance and student engagement
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
                  onClick={exportData}
                  className="border-green-900 text-green-900 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 py-6 space-y-6">
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
                  {formatCurrency(analyticsData?.overview?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+12.5%</span> from last month
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
                  {analyticsData?.overview?.totalStudents?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+8.2%</span> from last month
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
                  {analyticsData?.overview?.averageRating || 0}
                </div>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(analyticsData?.overview?.averageRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({analyticsData?.overview?.totalCourses || 0} courses)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.overview?.completionRate || 0}%
                </div>
                <Progress
                  value={analyticsData?.overview?.completionRate || 0}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="revenue" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>
                      Monthly revenue and student enrollment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData?.revenueData && analyticsData.revenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                            name="Revenue ($)"
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="students"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            name="Students"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <div className="text-center">
                          <BarChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>No revenue data available for the selected period</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

               
              </div>

              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Average Order Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analyticsData?.overview?.totalRevenue || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                      <span className="text-green-600">+5.2%</span> from last
                      month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Lifetime Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analyticsData?.overview?.totalRevenue || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                      <span className="text-green-600">+12.8%</span> from last
                      month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Refund Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData?.overview?.refundRate || 0}%</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                      <span className="text-green-600">-0.5%</span> from last
                      month
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="my-courses" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">My Courses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage and view your course performance
                  </p>
                </div>
                <Button onClick={handleCreateCourse} className="bg-green-900 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Course
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>
                    View, edit, and manage your courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
                        No courses yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first course to get started
                      </p>
                      <Button onClick={handleCreateCourse} className="bg-green-900 hover:bg-green-800">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Course
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div
                          key={course._id}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-200 dark:text-white">
                                {course.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {course.categories} • {course.level}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-gray-500">
                                  {course.averageRating} ⭐ ({course.totalReviews} reviews)
                                </span>
                                <span className="text-sm text-gray-500">
                                  ${course.price}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCourse(course._id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCourse(course._id)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Course</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{courseToDelete?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCourse}
              >
                Delete Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Protected>
  );
}

export default InstructorAnalytics;
