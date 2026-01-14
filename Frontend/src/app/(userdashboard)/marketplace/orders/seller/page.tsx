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
  TrendingUp, DollarSign, Truck, RefreshCw, XCircle,
  ChevronLeft, ChevronRight, Upload, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow, differenceInMilliseconds } from 'date-fns';

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders from real API
      const response = await import('axios').then(axios => 
        axios.default.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/seller`,
          {
            withCredentials: true,
            params: {
              page: currentPage,
              limit: ordersPerPage,
              status: activeTab !== 'all' ? activeTab : undefined
            }
          }
        )
      );

      if (response.data.success) {
        const apiOrders = response.data.orders || [];
        
        // Transform API data to match component expectations
        const transformedOrders = apiOrders.map((order: any) => {
          const firstItem = order.items?.[0] || {};
          return {
            id: order._id,
            orderNumber: order.orderNumber,
            serviceTitle: firstItem.itemTitle || 'Order',
            serviceType: firstItem.packageDetails?.packageName || firstItem.itemType || 'Service',
            buyerName: `${order.buyerId?.firstName || ''} ${order.buyerId?.lastName || ''}`.trim() || 'Buyer',
            buyerAvatar: order.buyerId?.avatar || '',
            price: order.orderTotal,
            status: order.orderStatus,
            createdAt: order.createdAt,
            deadline: order.estimatedDeliveryDate,
            deliveredAt: order.deliveryDate,
            completedAt: order.completedAt,
            deliveryTime: firstItem.packageDetails?.deliveryTime || 'N/A',
            revisions: firstItem.packageDetails?.revisions || 0,
            revisionsUsed: 0, // TODO: Track this
            thumbnailImage: firstItem.itemImage || '',
            rating: null // TODO: Get from reviews
          };
        });
        
        setOrders(transformedOrders);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get full image URL
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'https://appbackend.0xmintyn.com';
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
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRemainingTime = (deadline: string, status: string) => {
    if (status === 'completed' || status === 'cancelled') {
      return { text: 'N/A', color: 'text-gray-500' };
    }
    const now = new Date();
    const due = new Date(deadline);
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
    if (days < 1) color = 'text-red-500';

    return { text: text.trim(), color };
  };

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.serviceTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order._id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const stats = {
    all: orders.length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revision_requested: orders.filter(o => o.status === 'revision_requested').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalEarnings: orders.reduce((sum, o) => sum + (o.orderTotal || 0), 0)
  };


  // Paginate
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage and track your service orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
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

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Cancelled</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
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
              placeholder="Search by order ID, service, or buyer name..."
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
              Showing {indexOfFirstOrder + 1} - {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs and Orders */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
          {currentOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Try adjusting your search' : 'Orders will appear here when buyers purchase your services'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {currentOrders.map((order) => {
                  const timeRemaining = getRemainingTime(order.deadline, order.status);
                  return (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            {order.thumbnailImage ? (
                              <Image
                                src={order.thumbnailImage}
                                alt={order.serviceTitle}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center" style={{ display: order.thumbnailImage ? 'none' : 'flex' }}>
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Link 
                                    href={`/marketplace/orders/${order.id}`}
                                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400"
                                  >
                                    {order.serviceTitle}
                                  </Link>
                                  <Badge className={getStatusColor(order.status)}>
                                    <span className="flex items-center gap-1">
                                      {getStatusIcon(order.status)}
                                      {formatStatus(order.status)}
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Order #{order.id} • {order.serviceType}
                                </p>
                              </div>
                              <span className="text-lg font-bold text-green-600">
                                ${order.price}
                              </span>
                            </div>

                            {/* Buyer Info */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 flex-shrink-0">
                                {order.buyerAvatar ? (
                                  <img
                                    src={getFullImageUrl(order.buyerAvatar)}
                                    alt={order.buyerName}
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
                                  className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center"
                                  style={{ display: order.buyerAvatar ? 'none' : 'flex' }}
                                >
                                  <span className="text-xs font-semibold text-white">
                                    {getUserInitials(order.buyerName || 'B')}
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Buyer: <span className="font-medium">{order.buyerName}</span>
                              </span>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Delivery Time</p>
                                <p className="text-sm font-medium">{order.deliveryTime}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Revisions</p>
                                <p className="text-sm font-medium">{order.revisionsUsed}/{order.revisions}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Time Remaining</p>
                                <p className={`text-sm font-medium ${timeRemaining.color}`}>
                                  {timeRemaining.text}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Ordered</p>
                                <p className="text-sm font-medium">
                                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                              <Link href={`/marketplace/orders/${order.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </Link>
                              <Link href={`/marketplace/messages?conversation=${order.id}`}>
                                <Button size="sm" variant="outline">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Message Buyer
                                </Button>
                              </Link>
                              {(order.status === 'processing' || order.status === 'confirmed') && (
                                <Link href={`/marketplace/orders/${order.id}`}>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <Upload className="h-4 w-4 mr-1" />
                                    View Order
                                  </Button>
                                </Link>
                              )}
                              {order.status === 'pending' && (
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm">
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <span className="text-yellow-600 dark:text-yellow-400">Awaiting confirmation</span>
                                </div>
                              )}
                              {order.rating && (
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                  <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                                    ⭐ {order.rating}/5
                                  </span>
                                </div>
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
    </div>
  );
}

