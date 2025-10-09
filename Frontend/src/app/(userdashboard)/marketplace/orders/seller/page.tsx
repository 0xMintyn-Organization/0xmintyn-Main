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
      // TODO: Replace with actual API call
      // Mock data
      setOrders([
        {
          id: 'ORD-2024-001',
          serviceTitle: 'Logo Design Package',
          serviceType: 'Graphic Design',
          buyerName: 'John Doe',
          buyerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          price: 150,
          status: 'in_progress',
          createdAt: '2024-01-20T10:00:00Z',
          deadline: '2024-01-25T10:00:00Z',
          deliveryTime: '3 Days',
          revisions: 3,
          revisionsUsed: 0,
          thumbnailImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=150&fit=crop'
        },
        {
          id: 'ORD-2024-002',
          serviceTitle: 'Website Development',
          serviceType: 'Web Development',
          buyerName: 'Jane Smith',
          buyerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
          price: 500,
          status: 'in_progress',
          createdAt: '2024-01-18T14:30:00Z',
          deadline: '2024-01-28T14:30:00Z',
          deliveryTime: '1 Week',
          revisions: 2,
          revisionsUsed: 0,
          thumbnailImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop'
        },
        {
          id: 'ORD-2024-003',
          serviceTitle: 'Social Media Content',
          serviceType: 'Content Writing',
          buyerName: 'Mike Johnson',
          buyerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
          price: 75,
          status: 'delivered',
          createdAt: '2024-01-15T09:15:00Z',
          deadline: '2024-01-20T09:15:00Z',
          deliveredAt: '2024-01-19T15:30:00Z',
          deliveryTime: '2 Days',
          revisions: 1,
          revisionsUsed: 0,
          thumbnailImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop'
        },
        {
          id: 'ORD-2024-004',
          serviceTitle: 'SEO Optimization',
          serviceType: 'Digital Marketing',
          buyerName: 'Sarah Wilson',
          buyerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
          price: 200,
          status: 'revision_requested',
          createdAt: '2024-01-12T11:00:00Z',
          deadline: '2024-01-22T11:00:00Z',
          deliveryTime: '5 Days',
          revisions: 3,
          revisionsUsed: 1,
          thumbnailImage: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=200&h=150&fit=crop'
        },
        {
          id: 'ORD-2024-005',
          serviceTitle: 'Brand Identity Design',
          serviceType: 'Graphic Design',
          buyerName: 'Tom Brown',
          buyerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          price: 300,
          status: 'completed',
          createdAt: '2024-01-10T08:00:00Z',
          completedAt: '2024-01-14T08:00:00Z',
          deadline: '2024-01-15T08:00:00Z',
          deliveryTime: '5 Days',
          revisions: 2,
          revisionsUsed: 0,
          rating: 5,
          thumbnailImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=150&fit=crop'
        }
      ]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'delivered': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'revision_requested': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || colors['in_progress'];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'revision_requested': return <RefreshCw className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
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
    const matchesSearch = order.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const stats = {
    all: orders.length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revision_requested: orders.filter(o => o.status === 'revision_requested').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalEarnings: orders.reduce((sum, o) => sum + o.price, 0)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Delivered</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.delivered}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Revisions</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.revision_requested}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-600" />
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

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
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
        <TabsList className="grid w-full grid-cols-5 bg-gray-200 dark:bg-gray-800">
          <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.in_progress})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
          <TabsTrigger value="revision_requested">Revisions ({stats.revision_requested})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
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
                          {order.thumbnailImage && (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={order.thumbnailImage}
                                alt={order.serviceTitle}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

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
                              <Image
                                src={order.buyerAvatar}
                                alt={order.buyerName}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
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
                              {(order.status === 'in_progress' || order.status === 'revision_requested') && (
                                <Link href={`/marketplace/orders/${order.id}`}>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <Upload className="h-4 w-4 mr-1" />
                                    Deliver Order
                                  </Button>
                                </Link>
                              )}
                              {order.status === 'delivered' && (
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md text-sm">
                                  <AlertCircle className="h-4 w-4 text-purple-600" />
                                  <span className="text-purple-600 dark:text-purple-400">Awaiting buyer review</span>
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

