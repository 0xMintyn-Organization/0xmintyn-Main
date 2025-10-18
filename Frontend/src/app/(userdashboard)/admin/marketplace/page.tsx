'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Briefcase, 
  Star, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import Protected from '@/hooks/useProtected';

interface MarketplaceStats {
  totalSellers: number;
  totalServices: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeSellers: number;
  averageRating: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'seller_registration' | 'service_created' | 'product_created' | 'order_placed' | 'review_submitted';
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminMarketplaceDashboard() {
  const [stats, setStats] = useState<MarketplaceStats>({
    totalSellers: 0,
    totalServices: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeSellers: 0,
    averageRating: 0,
    monthlyRevenue: 0,
    monthlyOrders: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      setStats({
        totalSellers: 245,
        totalServices: 1280,
        totalProducts: 890,
        totalOrders: 3420,
        totalRevenue: 125000,
        pendingApprovals: 23,
        activeSellers: 198,
        averageRating: 4.3,
        monthlyRevenue: 18500,
        monthlyOrders: 420,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3
      });

      setRecentActivity([
        {
          id: '1',
          type: 'seller_registration',
          title: 'New Seller Registration',
          description: 'John Doe submitted seller application',
          timestamp: '2 minutes ago',
          status: 'pending'
        },
        {
          id: '2',
          type: 'service_created',
          title: 'New Service Created',
          description: 'Logo Design Service by Jane Smith',
          timestamp: '15 minutes ago',
          status: 'pending'
        },
        {
          id: '3',
          type: 'order_placed',
          title: 'New Order Placed',
          description: 'Order #ORD-001 for Logo Design Service',
          timestamp: '1 hour ago',
          status: 'approved'
        },
        {
          id: '4',
          type: 'review_submitted',
          title: 'New Review Submitted',
          description: '5-star review for Web Design Service',
          timestamp: '2 hours ago',
          status: 'approved'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'seller_registration':
        return <Users className="w-4 h-4" />;
      case 'service_created':
        return <Briefcase className="w-4 h-4" />;
      case 'product_created':
        return <Package className="w-4 h-4" />;
      case 'order_placed':
        return <ShoppingCart className="w-4 h-4" />;
      case 'review_submitted':
        return <Star className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
                  Marketplace Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your marketplace ecosystem
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchDashboardData}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSellers}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">{stats.activeSellers}</span> active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <Briefcase className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalServices}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1 text-yellow-600" />
                  <span className="text-yellow-600">{stats.pendingApprovals}</span> pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digital products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{stats.revenueGrowth}%</span> this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{stats.ordersGrowth}%</span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all services & products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/marketplace/sellers">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Users className="w-6 h-6 mb-2" />
                    <span>Manage Sellers</span>
                  </Button>
                </Link>
                <Link href="/admin/marketplace/services">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Briefcase className="w-6 h-6 mb-2" />
                    <span>Manage Services</span>
                  </Button>
                </Link>
                <Link href="/admin/marketplace/products">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Package className="w-6 h-6 mb-2" />
                    <span>Manage Products</span>
                  </Button>
                </Link>
                <Link href="/admin/marketplace/orders">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <ShoppingCart className="w-6 h-6 mb-2" />
                    <span>Manage Orders</span>
                  </Button>
                </Link>
                <Link href="/admin/marketplace/reviews">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Star className="w-6 h-6 mb-2" />
                    <span>Manage Reviews</span>
                  </Button>
                </Link>
                <Link href="/admin/marketplace/analytics">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <span>Analytics</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{activity.timestamp}</span>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Protected>
  );
}

