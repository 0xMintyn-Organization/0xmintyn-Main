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
  Calendar,
  Activity,
  Award,
  Target,
  Eye,
  MessageSquare,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
import Spinner from "@/components/Spinner";

// Types
interface AnalyticsData {
  overview: {
    totalCourses: number;
    totalUsers: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    newCoursesThisPeriod: number;
    newUsersThisPeriod: number;
    totalWatchHours: number;
    averageWatchTime: number;
  };
  coursePerformance: Array<{
    id: string;
    name: string;
    category: string;
    level: string;
    price: number;
    rating: number;
    reviews: number;
    instructor: {
      _id: string;
      username: string;
      avatar: string;
    };
    engagementRate: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    courses: number;
    averageRating: string;
    totalReviews: number;
    engagementRate: number;
  }>;
  levelDistribution: Array<{
    level: string;
    courses: number;
    averagePrice: string;
  }>;
  userDemographics: Array<{
    country: string;
    students: number;
    percentage: string;
  }>;
  recentActivity: Array<{
    id: string;
    name: string;
    category: string;
    level: string;
    price: number;
    rating: number;
    reviews: number;
    instructor: {
      _id: string;
      username: string;
      avatar: string;
    };
    createdAt: string;
  }>;
  growthMetrics: {
    userGrowth: Array<{ date: string; users: number }>;
    courseGrowth: Array<{ date: string; courses: number }>;
  };
  engagementMetrics: {
    averageWatchTime: number;
    totalWatchHours: number;
    averageCompletionTime: number;
    discussionPosts: number;
    assignmentsSubmitted: number;
  };
}

// Chart colors
const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("last30days");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}analytics`, {
          params: { timeRange },
          withCredentials: true
        });
        
        if (res.data.success) {
          setAnalyticsData(res.data.analytics);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return { value: "0", isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
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

  if (!analyticsData) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Analytics Data Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Analytics data is being processed. Please try again later.
            </p>
          </div>
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
                  Platform Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive insights into platform performance and user engagement
                </p>
              </div>
              <div className="flex gap-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="last90days">Last 90 days</SelectItem>
                    <SelectItem value="last365days">Last 365 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.overview.newCoursesThisPeriod} this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.overview.newUsersThisPeriod} this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.averageRating}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.totalReviews} total reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Watch Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalWatchHours.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.averageWatchTime.toFixed(1)}h avg per user
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User & Course Growth</CardTitle>
                    <CardDescription>Growth trends over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.growthMetrics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stackId="1"
                          stroke="#10b981"
                          fill="#10b981"
                          name="Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Categories</CardTitle>
                    <CardDescription>Distribution of courses by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.categoryDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, courses }) => `${category}: ${courses}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="courses"
                        >
                          {analyticsData.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Courses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Courses</CardTitle>
                    <CardDescription>Courses with highest ratings and engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.coursePerformance.slice(0, 5).map((course, index) => (
                        <div key={course.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{course.name}</p>
                              <p className="text-sm text-gray-500">{course.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{course.rating} ⭐</p>
                            <p className="text-sm text-gray-500">{course.reviews} reviews</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Level Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Levels</CardTitle>
                    <CardDescription>Distribution by difficulty level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.levelDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="courses" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Demographics</CardTitle>
                    <CardDescription>Users by country</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.userDemographics.slice(0, 8).map((demo, index) => (
                        <div key={demo.country} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{demo.country}</p>
                              <p className="text-sm text-gray-500">{demo.students} users</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{demo.percentage}%</p>
                            <Progress value={parseFloat(demo.percentage)} className="w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.growthMetrics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Watch Time</CardTitle>
                    <CardDescription>Per user session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analyticsData.engagementMetrics.averageWatchTime.toFixed(1)}h</div>
                    <p className="text-sm text-gray-500">per user</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Watch Hours</CardTitle>
                    <CardDescription>All time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analyticsData.engagementMetrics.totalWatchHours.toLocaleString()}</div>
                    <p className="text-sm text-gray-500">hours</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Completion</CardTitle>
                    <CardDescription>Course completion time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analyticsData.engagementMetrics.averageCompletionTime.toFixed(1)}h</div>
                    <p className="text-sm text-gray-500">per course</p>
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

export default Analytics;
