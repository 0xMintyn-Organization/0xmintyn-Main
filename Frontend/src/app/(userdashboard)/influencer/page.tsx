"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { InfluencerProtected } from "@/components/RoleProtected";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users,
  UserCheck,
  TrendingUp,
  Crown,
  GraduationCap,
  User,
  Calendar,
  Eye,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import { Progress } from "@/components/ui/progress";

// Types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: 'user' | 'instructor' | 'admin' | 'influencer';
  isVerified: boolean;
  isSeller: boolean;
  createdAt: string;
  nationality: string;
  age: number;
  avatar?: string;
}

interface InfluencerAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    verifiedUsers: number;
    unverifiedUsers: number;
  };
  usersByRole: {
    users: number;
    instructors: number;
    admins: number;
    influencers: number;
  };
  recentRegistrations: User[];
  userGrowth: Array<{
    month: string;
    users: number;
    total: number;
  }>;
  dailyGrowth: Array<{
    date: string;
    users: number;
  }>;
  userDemographics: Array<{
    country: string;
    users: number;
    percentage: string;
  }>;
  ageGroups: Array<{
    ageRange: string;
    count: number;
    percentage: string;
  }>;
}

// Chart colors
const COLORS = [
  "#10b981", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

function InfluencerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<InfluencerAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI || '';
      const url = baseUrl.endsWith('/') 
        ? `${baseUrl}influencer/analytics`
        : `${baseUrl}/influencer/analytics`;

      const response = await axiosInstance.get(url);

      if (response.data.success) {
        const data = response.data.data;
        // Ensure arrays are always defined and properly formatted
        const formattedData = {
          ...data,
          userGrowth: Array.isArray(data.userGrowth) ? data.userGrowth : [],
          dailyGrowth: Array.isArray(data.dailyGrowth) ? data.dailyGrowth : [],
          userDemographics: Array.isArray(data.userDemographics) ? data.userDemographics : [],
          ageGroups: Array.isArray(data.ageGroups) ? data.ageGroups : [],
          recentRegistrations: Array.isArray(data.recentRegistrations) ? data.recentRegistrations : []
        };
        console.log("Influencer analytics data:", formattedData);
        console.log("User Growth:", formattedData.userGrowth);
        console.log("Daily Growth:", formattedData.dailyGrowth);
        setAnalytics(formattedData);
      } else {
        setError("Failed to load analytics data");
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching influencer analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics data");
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-red-500" />;
      case 'instructor':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'influencer':
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'instructor':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'influencer':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <InfluencerProtected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Spinner />
        </div>
      </InfluencerProtected>
    );
  }

  if (error && !analytics) {
    return (
      <InfluencerProtected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white mb-4">
              Error Loading Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error}
            </p>
            <Button onClick={fetchAnalytics}>
              Try Again
            </Button>
          </div>
        </div>
      </InfluencerProtected>
    );
  }

  if (!analytics) {
    return (
      <InfluencerProtected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 dark:text-white mb-4">
              No Analytics Data Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Analytics data is being processed. Please try again later.
            </p>
          </div>
        </div>
      </InfluencerProtected>
    );
  }

  return (
    <InfluencerProtected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                  Influencer Analytics Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View-only platform statistics and user data
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchAnalytics}>
                  <Eye className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Stats Cards - ONLY User Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.activeUsers.toLocaleString()} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.newUsersToday}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.newUsersThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.verifiedUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.unverifiedUsers.toLocaleString()} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.newUsersThisMonth.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">New registrations</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth (Monthly)</CardTitle>
                <CardDescription>User registrations over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.userGrowth && analytics.userGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="New Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No growth data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily User Growth</CardTitle>
                <CardDescription>New registrations over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.dailyGrowth && analytics.dailyGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.dailyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="New Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No daily growth data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Role Distribution and Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
                <CardDescription>Distribution of users across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Users', value: analytics.usersByRole.users },
                        { name: 'Instructors', value: analytics.usersByRole.instructors },
                        { name: 'Admins', value: analytics.usersByRole.admins },
                        { name: 'Influencers', value: analytics.usersByRole.influencers },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Users', value: analytics.usersByRole.users },
                        { name: 'Instructors', value: analytics.usersByRole.instructors },
                        { name: 'Admins', value: analytics.usersByRole.admins },
                        { name: 'Influencers', value: analytics.usersByRole.influencers },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>Top 10 countries by user count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.userDemographics.map((demo, index) => (
                    <div key={demo.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{demo.country}</p>
                          <p className="text-sm text-gray-500">{demo.users} users</p>
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
          </div>

          {/* Age Distribution */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
              <CardDescription>User age groups</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ageGroups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageRange" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Registrations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
              <CardDescription>Latest 20 user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent registrations</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentRegistrations.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                                {getRoleIcon(user.role)}
                              </div>
                              <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isVerified 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {user.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell>{user.nationality}</TableCell>
                          <TableCell>{user.age}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
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
      </div>
    </InfluencerProtected>
  );
}

export default InfluencerDashboard;

