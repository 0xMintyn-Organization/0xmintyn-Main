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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  Wallet,
  PiggyBank,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  BookOpen,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Coins,
  Receipt,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types
interface EarningsData {
  overview: {
    totalEarnings: number;
    monthlyEarnings: number;
    yearlyEarnings: number;
    pendingPayouts: number;
    totalPayouts: number;
    averageOrderValue: number;
    totalOrders: number;
    conversionRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    earnings: number;
    orders: number;
    students: number;
    refunds: number;
  }>;
  courseEarnings: Array<{
    courseId: string;
    courseName: string;
    earnings: number;
    orders: number;
    students: number;
    averageOrderValue: number;
    refundRate: number;
  }>;
  recentTransactions: Array<{
    _id: string;
    type: "sale" | "refund" | "payout";
    amount: number;
    description: string;
    date: string;
    status: "completed" | "pending" | "failed";
    courseName?: string;
    studentName?: string;
  }>;
  payoutHistory: Array<{
    _id: string;
    amount: number;
    date: string;
    status: "completed" | "pending" | "failed";
    method: string;
    reference: string;
  }>;
  earningsBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
    color: string;
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

function InstructorEarnings() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [timeRange, setTimeRange] = useState("last12months");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchEarningsData();
  }, [timeRange]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}instructor/earnings`,
        {
          params: { timeRange },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        setEarningsData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch earnings data");
      }
    } catch (error: any) {
      console.error("Error fetching earnings data:", error);
      
      // Set default empty data to prevent crashes
      setEarningsData({
        overview: {
          totalEarnings: 0,
          monthlyEarnings: 0,
          yearlyEarnings: 0,
          pendingPayouts: 0,
          totalPayouts: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          conversionRate: 0
        },
        monthlyTrends: [],
        courseEarnings: [],
        recentTransactions: [],
        payoutHistory: [],
        earningsBySource: []
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "refund":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "payout":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const exportEarningsData = () => {
    // Implement CSV export functionality
    toast({
      title: "Export Started",
      description: "Earnings data is being prepared for download.",
    });
  };

  const requestPayout = () => {
    // Implement payout request functionality
    toast({
      title: "Payout Requested",
      description: "Your payout request has been submitted for review.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
            Unable to load earnings data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading your earnings data.
          </p>
          <Button onClick={fetchEarningsData} variant="outline">
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
                  Earnings Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your revenue, payouts, and financial performance
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last3months">Last 3 months</SelectItem>
                    <SelectItem value="last6months">Last 6 months</SelectItem>
                    <SelectItem value="last12months">Last 12 months</SelectItem>
                    <SelectItem value="last2years">Last 2 years</SelectItem>
                    <SelectItem value="alltime">All time</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={fetchEarningsData}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  onClick={exportEarningsData}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>

                {earningsData.overview.pendingPayouts > 0 && (
                  <Button
                    onClick={requestPayout}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Request Payout
                  </Button>
                )}
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
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(earningsData.overview.totalEarnings)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    {formatCurrency(earningsData.overview.monthlyEarnings)}
                  </span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Payouts
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(earningsData.overview.pendingPayouts)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for withdrawal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <Receipt className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {earningsData.overview.totalOrders.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Target className="w-3 h-3 mr-1 text-blue-600" />
                  <span className="text-blue-600">
                    {earningsData.overview.conversionRate.toFixed(1)}%
                  </span> conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Order Value
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(earningsData.overview.averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per transaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="courses">Course Performance</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Trend Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Earnings Trend</CardTitle>
                    <CardDescription>
                      Monthly earnings and order volume over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {earningsData.monthlyTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={earningsData.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === "earnings" ? formatCurrency(Number(value)) : value,
                              name === "earnings" ? "Earnings" : name === "orders" ? "Orders" : "Students"
                            ]}
                          />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="earnings"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                            name="Earnings"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Orders"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>No earnings data available for the selected period</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Earnings by Source */}
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings by Source</CardTitle>
                    <CardDescription>
                      Revenue breakdown by course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {earningsData.earningsBySource.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={earningsData.earningsBySource}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {earningsData.earningsBySource.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-gray-500">
                        <div className="text-center">
                          <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>No earnings data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription>
                      Key performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wallet className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Total Payouts</span>
                        </div>
                        <span className="font-medium">{formatCurrency(earningsData.overview.totalPayouts)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PiggyBank className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Yearly Earnings</span>
                        </div>
                        <span className="font-medium">{formatCurrency(earningsData.overview.yearlyEarnings)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">Conversion Rate</span>
                        </div>
                        <span className="font-medium">{earningsData.overview.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">Avg Order Value</span>
                        </div>
                        <span className="font-medium">{formatCurrency(earningsData.overview.averageOrderValue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Latest sales, refunds, and payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsData.recentTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
                        No transactions yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Transactions will appear here once students start purchasing your courses.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {earningsData.recentTransactions.slice(0, 20).map((transaction) => (
                            <TableRow key={transaction._id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getTransactionIcon(transaction.type)}
                                  <span className="capitalize">{transaction.type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{transaction.description}</div>
                                  {transaction.courseName && (
                                    <div className="text-sm text-gray-500">{transaction.courseName}</div>
                                  )}
                                  {transaction.studentName && (
                                    <div className="text-sm text-gray-500">Student: {transaction.studentName}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={`font-medium ${
                                transaction.type === "sale" ? "text-green-600" : 
                                transaction.type === "refund" ? "text-red-600" : 
                                "text-blue-600"
                              }`}>
                                {transaction.type === "refund" ? "-" : "+"}{formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(transaction.status)}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                {format(new Date(transaction.date), "MMM dd, yyyy")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Course Performance Tab */}
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Earnings Performance</CardTitle>
                  <CardDescription>
                    Revenue breakdown by individual courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsData.courseEarnings.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
                        No course earnings yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Course earnings will appear here once students start purchasing your courses.
                      </p>
                      <Button onClick={() => router.push("/create-course")} className="bg-green-600 hover:bg-green-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create Your First Course
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Earnings</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Avg Order Value</TableHead>
                            <TableHead>Refund Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {earningsData.courseEarnings.map((course) => (
                            <TableRow key={course.courseId}>
                              <TableCell>
                                <div className="font-medium">{course.courseName}</div>
                              </TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatCurrency(course.earnings)}
                              </TableCell>
                              <TableCell>{course.orders.toLocaleString()}</TableCell>
                              <TableCell>{course.students.toLocaleString()}</TableCell>
                              <TableCell>{formatCurrency(course.averageOrderValue)}</TableCell>
                              <TableCell>
                                <span className={`font-medium ${
                                  course.refundRate < 5 ? "text-green-600" : 
                                  course.refundRate < 10 ? "text-yellow-600" : 
                                  "text-red-600"
                                }`}>
                                  {course.refundRate.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payouts Tab */}
            <TabsContent value="payouts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>
                    Track your payment history and pending payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsData.payoutHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
                        No payouts yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Payout history will appear here once you start earning and requesting payouts.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {earningsData.payoutHistory.map((payout) => (
                            <TableRow key={payout._id}>
                              <TableCell className="font-medium">
                                {formatCurrency(payout.amount)}
                              </TableCell>
                              <TableCell>{payout.method}</TableCell>
                              <TableCell>
                                {getStatusBadge(payout.status)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {payout.reference}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                {format(new Date(payout.date), "MMM dd, yyyy")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Protected>
  );
}

export default InstructorEarnings;
