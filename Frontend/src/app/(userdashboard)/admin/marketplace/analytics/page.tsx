'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Star,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Briefcase,
  Package
} from 'lucide-react';
import Protected from '@/hooks/useProtected';
import { marketplaceAPI } from '@/lib/api';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AnalyticsData {
  revenueData: Array<{
    month: string;
    revenue: number;
    orders: number;
    growth: number;
  }>;
  topSellers: Array<{
    sellerName: string;
    earnings: number;
    orders: number;
    rating: number;
  }>;
  topServices: Array<{
    title: string;
    orders: number;
    revenue: number;
    rating: number;
  }>;
  topProducts: Array<{
    title: string;
    purchases: number;
    revenue: number;
    rating: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  monthlyStats: {
    totalRevenue: number;
    totalOrders: number;
    totalSellers: number;
    averageRating: number;
    revenueGrowth: number;
    ordersGrowth: number;
    sellersGrowth: number;
  };
}

export default function AdminMarketplaceAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [chartType, setChartType] = useState('revenue');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from backend APIs
      const [statsData, sellersData, servicesData, productsData, ordersData] = await Promise.all([
        marketplaceAPI.getStats(),
        marketplaceAPI.getSellers({ limit: 1000 }),
        marketplaceAPI.getServices({ limit: 1000 }),
        marketplaceAPI.getProducts({ limit: 1000 }),
        marketplaceAPI.getOrders({ limit: 1000 }).catch(() => ({ orders: [] }))
      ]);

      const sellers = sellersData.sellers || [];
      const services = servicesData.services || [];
      const products = productsData.products || [];
      const orders = ordersData.orders || [];

      // Calculate top sellers by earnings
      const topSellers = sellers
        .sort((a: any, b: any) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
        .slice(0, 5)
        .map((seller: any) => ({
          sellerName: `${seller.sellerName || seller.storeName || 'Unknown'} - ${seller.storeName || 'Store'}`,
          earnings: seller.totalEarnings || 0,
          orders: seller.totalSales || 0,
          rating: seller.rating || 0
        }));

      // Calculate top services by orders
      const topServices = services
        .sort((a: any, b: any) => (b.orderCount || 0) - (a.orderCount || 0))
        .slice(0, 5)
        .map((service: any) => ({
          title: service.title,
          orders: service.orderCount || 0,
          revenue: (service.orderCount || 0) * (service.packages?.[0]?.price || 0),
          rating: service.rating || 0
        }));

      // Calculate top products by purchases
      const topProducts = products
        .sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 5)
        .map((product: any) => ({
          title: product.title,
          purchases: product.salesCount || 0,
          revenue: (product.salesCount || 0) * (product.price || 0),
          rating: product.rating || 0
        }));

      // Calculate category distribution for services
      const categoryColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe', '#00c49f', '#ffbb28'];
      const categoryMap = new Map();
      services.forEach((service: any) => {
        const category = service.category || 'Unknown';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      const totalServices = services.length || 1;
      const categoryDistribution = Array.from(categoryMap.entries())
        .map(([category, count], index) => ({
          category,
          count: count as number,
          percentage: Math.round(((count as number) / totalServices) * 100),
          color: categoryColors[index % categoryColors.length]
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate order status distribution
      const statusColors: any = {
        'completed': '#10b981',
        'processing': '#3b82f6',
        'delivered': '#8b5cf6',
        'cancelled': '#ef4444',
        'refunded': '#6b7280',
        'confirmed': '#f59e0b',
        'pending': '#64748b'
      };
      const statusMap = new Map();
      orders.forEach((order: any) => {
        const status = order.orderStatus || 'pending';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });
      const totalOrders = orders.length || 1;
      const orderStatusDistribution = Array.from(statusMap.entries())
        .map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: count as number,
          percentage: Math.round(((count as number) / totalOrders) * 100),
          color: statusColors[status] || '#6b7280'
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate monthly stats
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.orderTotal || 0), 0
      );
      const averageRating = sellers.reduce((sum: number, seller: any) => 
        sum + (seller.rating || 0), 0
      ) / (sellers.length || 1);

      setAnalyticsData({
        revenueData: [
          { month: 'Current Month', revenue: totalRevenue, orders: orders.length, growth: 0 }
        ],
        topSellers,
        topServices,
        topProducts,
        categoryDistribution,
        orderStatusDistribution,
        monthlyStats: {
          totalRevenue,
          totalOrders: orders.length,
          totalSellers: sellers.length,
          averageRating: parseFloat(averageRating.toFixed(1)),
          revenueGrowth: 0,
          ordersGrowth: 0,
          sellersGrowth: 0
        }
      });
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast.error(error.message || 'Failed to load analytics');
      
      // Fallback to empty data
      setAnalyticsData({
        revenueData: [],
        topSellers: [],
        topServices: [],
        topProducts: [],
        categoryDistribution: [],
        orderStatusDistribution: [],
        monthlyStats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalSellers: 0,
          averageRating: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          sellersGrowth: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportAnalytics = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
            No analytics data available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Analytics data will appear here once the marketplace has activity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Marketplace Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive insights into your marketplace performance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={fetchAnalyticsData}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={exportAnalytics}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.monthlyStats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{analyticsData.monthlyStats.revenueGrowth}%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.monthlyStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{analyticsData.monthlyStats.ordersGrowth}%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.monthlyStats.totalSellers}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{analyticsData.monthlyStats.sellersGrowth}%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.monthlyStats.averageRating}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all services & products
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue & Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === "revenue" ? formatCurrency(Number(value)) : value,
                        name === "revenue" ? "Revenue" : "Orders"
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
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.orderStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.orderStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Sellers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Sellers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topSellers.map((seller, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{seller.sellerName}</div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{seller.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(seller.earnings)}</div>
                        <div className="text-xs text-gray-500">{seller.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Top Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{service.title}</div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{service.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(service.revenue)}</div>
                        <div className="text-xs text-gray-500">{service.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{product.title}</div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(product.revenue)}</div>
                        <div className="text-xs text-gray-500">{product.purchases} purchases</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </ErrorBoundary>
    </Protected>
  );
}

