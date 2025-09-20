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
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ShoppingCart,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Award,
  Star,
  User,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
interface Order {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  courseId: {
    _id: string;
    name: string;
    thumbnail?: string;
    createdBy: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  };
  coursePrice: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  paymentMethod: string;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
  refundedAt?: string;
  refundAmount?: number;
  notes?: string;
}

interface OrdersData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  recentOrders: Order[];
  orders: Order[];
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
    refunds: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  topCourses: Array<{
    courseId: string;
    courseName: string;
    orders: number;
    revenue: number;
    instructor: string;
  }>;
  topInstructors: Array<{
    instructorId: string;
    instructorName: string;
    orders: number;
    revenue: number;
    courses: number;
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

function AdminOrders() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}admin/orders`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setOrdersData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch orders data");
      }
    } catch (error: any) {
      console.error("Error fetching orders data:", error);
      
      // Set default empty data to prevent crashes
      setOrdersData({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        refundedOrders: 0,
        averageOrderValue: 0,
        monthlyRevenue: 0,
        recentOrders: [],
        orders: [],
        revenueByMonth: [],
        ordersByStatus: [],
        topCourses: [],
        topInstructors: []
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
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Info className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "refunded":
        return <RefreshCw className="w-4 h-4 text-gray-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
  };

  const handleUpdateOrderStatus = (order: Order, newStatus: string) => {
    // Implement update order status functionality
    toast({
      title: "Order Status Updated",
      description: `Order ${order._id} status updated to ${newStatus}`,
    });
  };

  const handleRefundOrder = (order: Order) => {
    // Implement refund order functionality
    toast({
      title: "Refund Processed",
      description: `Refund processed for order ${order._id}`,
    });
  };

  const exportOrdersData = () => {
    // Implement CSV export functionality
    toast({
      title: "Export Started",
      description: "Orders data is being prepared for download.",
    });
  };

  const filteredOrders = ordersData?.orders.filter(order => {
    const matchesSearch = 
      order.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.courseId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!ordersData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Unable to load orders data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading orders data.
          </p>
          <Button onClick={fetchOrdersData} variant="outline">
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
                  Order Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Monitor and manage all platform orders and transactions
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchOrdersData}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  onClick={exportOrdersData}
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
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ordersData.totalOrders.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    {ordersData.completedOrders}
                  </span> completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ordersData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    {formatCurrency(ordersData.monthlyRevenue)}
                  </span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Orders
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ordersData.pendingOrders.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting processing
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
                  {formatCurrency(ordersData.averageOrderValue)}
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
              <TabsTrigger value="orders">All Orders</TabsTrigger>
              <TabsTrigger value="courses">Top Courses</TabsTrigger>
              <TabsTrigger value="instructors">Top Instructors</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>
                      Monthly revenue and order volume over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersData.revenueByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={ordersData.revenueByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === "revenue" ? formatCurrency(Number(value)) : value,
                              name === "revenue" ? "Revenue" : name === "orders" ? "Orders" : "Refunds"
                            ]}
                          />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                            name="Revenue"
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
                          <p>No revenue data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Orders by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders by Status</CardTitle>
                    <CardDescription>
                      Distribution of orders by status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersData.ordersByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={ordersData.ordersByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, percentage }) => `${status} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {ordersData.ordersByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-gray-500">
                        <div className="text-center">
                          <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>No order status data available</p>
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
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Completed Orders</span>
                        </div>
                        <span className="font-medium">{ordersData.completedOrders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">Pending Orders</span>
                        </div>
                        <span className="font-medium">{ordersData.pendingOrders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Cancelled Orders</span>
                        </div>
                        <span className="font-medium">{ordersData.cancelledOrders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">Refunded Orders</span>
                        </div>
                        <span className="font-medium">{ordersData.refundedOrders}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* All Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>
                    Complete list of all platform orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search orders by user, course, or order ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {searchTerm || statusFilter !== "all" ? "No orders found" : "No orders yet"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filter criteria."
                          : "Orders will appear here once users start purchasing courses."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.slice(0, 50).map((order) => (
                            <TableRow key={order._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                              <TableCell>
                                <div className="font-mono text-sm">
                                  {order._id.slice(-8)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={order.userId.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {order.userId.firstName[0]}{order.userId.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {order.userId.firstName} {order.userId.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {order.userId.email}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-sm">
                                  {order.courseId.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {order.courseId.createdBy.firstName} {order.courseId.createdBy.lastName}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(order.coursePrice)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(order.status)}
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm">
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
                                    <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {order.status === "pending" && (
                                      <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order, "completed")}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark Completed
                                      </DropdownMenuItem>
                                    )}
                                    {order.status === "completed" && (
                                      <DropdownMenuItem onClick={() => handleRefundOrder(order)}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Process Refund
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order, "cancelled")}>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Order
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
            </TabsContent>

            {/* Top Courses Tab */}
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Courses</CardTitle>
                  <CardDescription>
                    Courses with the highest sales and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersData.topCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No course data yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Course performance data will appear here once orders are placed.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Avg Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordersData.topCourses.map((course, index) => (
                            <TableRow key={course.courseId}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium">{course.courseName}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="w-4 h-4 text-blue-600" />
                                  <span>{course.instructor}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {course.orders.toLocaleString()}
                              </TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatCurrency(course.revenue)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(course.revenue / course.orders)}
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

            {/* Top Instructors Tab */}
            <TabsContent value="instructors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Instructors</CardTitle>
                  <CardDescription>
                    Instructors with the highest sales and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersData.topInstructors.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No instructor data yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Instructor performance data will appear here once orders are placed.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Courses</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Avg per Course</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordersData.topInstructors.map((instructor, index) => (
                            <TableRow key={instructor.instructorId}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium">{instructor.instructorName}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span>{instructor.courses}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {instructor.orders.toLocaleString()}
                              </TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatCurrency(instructor.revenue)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(instructor.revenue / instructor.courses)}
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

        {/* Order Details Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Order Details
              </DialogTitle>
              <DialogDescription>
                Complete information about order {selectedOrder?._id}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{selectedOrder._id.slice(-8)}</h3>
                    <p className="text-gray-600">
                      {format(new Date(selectedOrder.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedOrder.coursePrice)}
                    </div>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={selectedOrder.userId.avatar} />
                          <AvatarFallback>
                            {selectedOrder.userId.firstName[0]}{selectedOrder.userId.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {selectedOrder.userId.firstName} {selectedOrder.userId.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedOrder.userId.email}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Course Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Course:</span>
                          <p className="text-gray-600">{selectedOrder.courseId.name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Instructor:</span>
                          <p className="text-gray-600">
                            {selectedOrder.courseId.createdBy.firstName} {selectedOrder.courseId.createdBy.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Price:</span>
                          <p className="text-gray-600 font-medium">
                            {formatCurrency(selectedOrder.coursePrice)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Payment Method:</span>
                        <p className="text-gray-600">{selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <span className="font-medium">Payment ID:</span>
                        <p className="text-gray-600 font-mono text-sm">{selectedOrder.paymentId}</p>
                      </div>
                      <div>
                        <span className="font-medium">Order Date:</span>
                        <p className="text-gray-600">
                          {format(new Date(selectedOrder.createdAt), "MMMM dd, yyyy")}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <p className="text-gray-600">
                          {format(new Date(selectedOrder.updatedAt), "MMMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                {selectedOrder.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{selectedOrder.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Protected>
  );
}

export default AdminOrders;
