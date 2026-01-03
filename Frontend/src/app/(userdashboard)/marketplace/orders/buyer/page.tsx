'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package, Eye, MessageSquare, Search, Clock, CheckCircle, 
  TrendingUp, Coins, Truck, RefreshCw, XCircle,
  ChevronLeft, ChevronRight, ShoppingBag, AlertCircle, Loader2,
  ArrowLeft, Download
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, differenceInMilliseconds, format } from 'date-fns';
import axios from 'axios';

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [ordersPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch orders from real API
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/buyer`,
        {
          withCredentials: true,
          params: {
            page: currentPage,
            limit: ordersPerPage,
            status: activeTab !== 'all' ? activeTab : undefined
          }
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setTotalOrders(response.data.pagination?.totalOrders || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get full image URL
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'processing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'refunded': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <TrendingUp className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRemainingTime = (estimatedDeliveryDate: string, orderStatus: string) => {
    if (orderStatus === 'completed' || orderStatus === 'cancelled') {
      return { text: 'N/A', color: 'text-gray-500' };
    }
    
    if (!estimatedDeliveryDate) {
      return { text: 'Not set', color: 'text-gray-500' };
    }
    
    const now = new Date();
    const due = new Date(estimatedDeliveryDate);
    const diff = differenceInMilliseconds(due, now);

    if (diff <= 0) {
      return { text: 'Overdue', color: 'text-red-500' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let text = '';
    if (days > 0) text += `${days}d `;
    if (hours > 0 || days > 0) text += `${hours}h`;

    let color = 'text-green-500';
    if (days < 2 && days >= 1) color = 'text-yellow-500';
    if (days < 1) color = 'text-orange-500';

    return { text: text.trim(), color };
  };

  // Filter orders by search
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const orderNumber = order.orderNumber?.toLowerCase() || '';
    const itemTitle = order.items?.[0]?.itemTitle?.toLowerCase() || '';
    const sellerName = order.sellerId?.sellerName?.toLowerCase() || order.sellerId?.storeName?.toLowerCase() || '';
    
    return orderNumber.includes(searchLower) || 
           itemTitle.includes(searchLower) || 
           sellerName.includes(searchLower);
  });

  // Calculate stats
  const stats = {
    all: orders.length,
    confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
    processing: orders.filter(o => o.orderStatus === 'processing').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    revision_requested: orders.filter(o => o.orderStatus === 'revision_requested').length,
    completed: orders.filter(o => o.orderStatus === 'completed').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    totalSpent: orders.reduce((sum, o) => sum + (o.orderTotal || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your purchases
          </p>
        </div>
        <Link href="/marketplace">
          <Button className="bg-green-600 hover:bg-green-700">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Processing</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.processing}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Confirmed</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Delivered</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.delivered}</p>
              </div>
              <Truck className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Revision</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.revision_requested}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Total Spent</p>
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.totalSpent.toLocaleString()} 0XM</p>
              </div>
              <Coins className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">All Orders</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.all}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by order number, item name, or seller..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          {filteredOrders.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Showing {filteredOrders.length} of {totalOrders} orders
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchOrders} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs and Orders */}
      {!error && (
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setCurrentPage(1);
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
            <TabsTrigger value="processing">Processing ({stats.processing})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
            <TabsTrigger value="revision_requested">Revision ({stats.revision_requested})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({stats.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {searchQuery ? 'No orders found' : 'No orders yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search query' 
                      : 'Start shopping to see your orders here'}
                  </p>
                  <Link href="/marketplace">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Browse Marketplace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {filteredOrders.map((order) => {
                    const timeRemaining = getRemainingTime(order.estimatedDeliveryDate, order.orderStatus);
                    const firstItem = order.items?.[0] || {};
                    const sellerInfo = order.sellerId || {};
                    
                    return (
                      <Card key={order._id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            {/* Thumbnail */}
                            <div className="relative w-20 md:w-24 h-20 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                              {firstItem.itemImage ? (
                                <Image
                                  src={getFullImageUrl(firstItem.itemImage)}
                                  alt={firstItem.itemTitle || 'Order item'}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-product.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Link 
                                      href={`/marketplace/orders/${order._id}`}
                                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                    >
                                      {firstItem.itemTitle || 'Order Item'}
                                    </Link>
                                    <Badge className={getStatusColor(order.orderStatus)}>
                                      <span className="flex items-center gap-1">
                                        {getStatusIcon(order.orderStatus)}
                                        {formatStatus(order.orderStatus)}
                                      </span>
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Order #{order.orderNumber || order._id.slice(-8)} 
                                    {firstItem.itemType && (
                                      <> • {firstItem.itemType === 'service' ? '🎯 Service' : '📦 Product'}</>
                                    )}
                                  </p>
                                </div>
                                <span className="text-xl font-bold text-green-600">
                                  {order.orderTotal} 0XM
                                </span>
                              </div>

                              {/* Seller Info */}
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 flex-shrink-0">
                                  {sellerInfo.storeLogo ? (
                                    <img
                                      src={getFullImageUrl(sellerInfo.storeLogo)}
                                      alt={sellerInfo.sellerName || 'Seller'}
                                      className="w-full h-full object-cover rounded-full"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center"
                                    style={{ display: sellerInfo.storeLogo ? 'none' : 'flex' }}
                                  >
                                    <span className="text-xs font-semibold text-white">
                                      {getUserInitials(sellerInfo.sellerName || sellerInfo.storeName || 'S')}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Seller: <span className="font-medium">{sellerInfo.sellerName || sellerInfo.storeName || 'Unknown'}</span>
                                </span>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                                {firstItem.packageDetails?.deliveryTime && (
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Delivery Time</p>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {firstItem.packageDetails.deliveryTime}
                                    </p>
                                  </div>
                                )}
                                {firstItem.packageDetails?.revisions !== undefined && (
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Revisions</p>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                      <RefreshCw className="h-3 w-3" />
                                      0/{firstItem.packageDetails.revisions}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {order.orderStatus === 'processing' ? 'Time Remaining' : 'Ordered'}
                                  </p>
                                  {order.orderStatus === 'processing' && order.estimatedDeliveryDate ? (
                                    <p className={`text-sm font-medium ${timeRemaining.color}`}>
                                      {timeRemaining.text}
                                    </p>
                                  ) : (
                                    <p className="text-sm font-medium">
                                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </p>
                                  )}
                                </div>
                                {order.estimatedDeliveryDate && (
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Est. Delivery</p>
                                    <p className="text-sm font-medium">
                                      {format(new Date(order.estimatedDeliveryDate), 'MMM dd')}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2">
                                <Link href={`/marketplace/orders/${order._id}`}>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                </Link>
                                <Link href={`/marketplace/messages`}>
                                  <Button size="sm" variant="outline">
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Message Seller
                                  </Button>
                                </Link>
                                {firstItem.itemType === 'product' && order.orderStatus === 'completed' && (
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

