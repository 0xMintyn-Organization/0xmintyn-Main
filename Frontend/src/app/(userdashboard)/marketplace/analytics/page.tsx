'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, DollarSign, Package, Users, Star, Eye, 
  ShoppingBag, Clock, CheckCircle, Calendar, Download,
  BarChart3, ArrowUp, ArrowDown
} from 'lucide-react';

export default function SellerAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('last30days');

  // Mock data - replace with actual API calls
  const stats = {
    totalRevenue: 5280,
    monthlyRevenue: 1420,
    revenueChange: 12.5,
    totalOrders: 127,
    monthlyOrders: 34,
    ordersChange: 8.3,
    avgOrderValue: 41.58,
    avgOrderChange: 5.2,
    completionRate: 98,
    avgRating: 4.8,
    totalReviews: 89,
    profileViews: 2450,
    viewsChange: 15.7
  };

  const topServices = [
    {
      id: 1,
      title: 'Professional Logo Design',
      orders: 45,
      revenue: 6750,
      rating: 4.9,
      views: 1250
    },
    {
      id: 2,
      title: 'Custom Website Development',
      orders: 23,
      revenue: 11500,
      rating: 4.7,
      views: 890
    },
    {
      id: 3,
      title: 'SEO Optimization Package',
      orders: 15,
      revenue: 3000,
      rating: 4.8,
      views: 650
    }
  ];

  const topProducts = [
    {
      id: 1,
      title: 'React Dashboard Template',
      sales: 127,
      revenue: 6348.73,
      rating: 4.8,
      views: 2340
    },
    {
      id: 2,
      title: 'E-commerce UI Kit',
      sales: 93,
      revenue: 2789.07,
      rating: 4.7,
      views: 1890
    },
    {
      id: 3,
      title: 'Mobile App Template',
      sales: 56,
      revenue: 4479.44,
      rating: 4.9,
      views: 1250
    }
  ];

  const recentOrders = [
    { month: 'Jan', orders: 34, revenue: 1420 },
    { month: 'Dec', orders: 28, revenue: 1180 },
    { month: 'Nov', orders: 31, revenue: 1295 },
    { month: 'Oct', orders: 25, revenue: 1050 },
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your performance and growth metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ${stats.totalRevenue.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.revenueChange}%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalOrders}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.ordersChange}%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Order Value</p>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ${stats.avgOrderValue}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.avgOrderChange}%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Profile Views</p>
              <Eye className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.profileViews.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.viewsChange}%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-green-600">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Orders completed successfully
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-yellow-600">{stats.avgRating}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                From {stats.totalReviews} reviews
              </p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(stats.avgRating)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-blue-600">2h</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Average response time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.month}</span>
                    <span className="text-sm font-semibold text-green-600">
                      ${item.revenue}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(item.revenue / 1500) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.month}</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {item.orders} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.orders / 35) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={service.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {service.title}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{service.orders} orders</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {service.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {service.views}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${service.revenue.toLocaleString()}
                    </p>
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
              <Package className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {product.title}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{product.sales} sales</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {product.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {product.views}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${product.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

