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
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

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
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [timeRange, setTimeRange] = useState("last30days");
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Simulating API call
        setTimeout(() => {
          setAnalyticsData(dummyAnalyticsData);
          setLoading(false);
        }, 1000);

        // Actual API call (commented out)
        /*
                const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}instructor/analytics`, {
                    params: { timeRange, courseId: selectedCourse },
                    withCredentials: true
                });
                
                if (res.data.success) {
                    setAnalyticsData(res.data.analytics);
                }
                */
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        // setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, selectedCourse]);

  const calculatePercentageChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
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
    return <Spinner />;
  }

  if (!analyticsData) {
    return <div>Error loading analytics data</div>;
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
                  {formatCurrency(analyticsData.overview.totalRevenue)}
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
                  {analyticsData.overview.totalStudents.toLocaleString()}
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
                  {analyticsData.overview.averageRating}
                </div>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(analyticsData.overview.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({analyticsData.overview.totalCourses} courses)
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
                  {analyticsData.overview.completionRate}%
                </div>
                <Progress
                  value={analyticsData.overview.completionRate}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="revenue" className="space-y-4">
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
                    <div className="text-2xl font-bold">$89.45</div>
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
                    <div className="text-2xl font-bold">$267.89</div>
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
                    <div className="text-2xl font-bold">2.3%</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                      <span className="text-green-600">-0.5%</span> from last
                      month
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
          </Tabs>
        </div>
      </div>
    </Protected>
  );
}

export default InstructorAnalytics;
