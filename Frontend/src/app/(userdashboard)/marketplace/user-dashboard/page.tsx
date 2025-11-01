'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Package, 
  Heart, 
  TrendingUp, 
  Eye, 
  DollarSign,
  Star,
  Clock,
  MessageSquare,
  Mail,
  CheckCircle,
  Truck,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    favoriteItems: 0,
    reviewsGiven: 0,
    totalProducts: 0,
    totalServices: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<any[]>([]);
  const [purchasedServices, setPurchasedServices] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pagination and Search states for Services
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesStatusFilter, setServicesStatusFilter] = useState('all');
  const [servicesCurrentPage, setServicesCurrentPage] = useState(1);
  const [servicesPerPage] = useState(5);

  // Pagination and Search states for Products
  const [productsSearchQuery, setProductsSearchQuery] = useState('');
  const [productsCurrentPage, setProductsCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);

  useEffect(() => {
    // Fetch user data
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch real order data from API
      const [ordersResponse, statsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'https://appbackend.0xmintyn.com/api/v1/'}marketplace/orders/buyer`, {
          withCredentials: true,
          params: { limit: 50 } // Get more orders for better stats
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'https://appbackend.0xmintyn.com/api/v1/'}marketplace/orders/statistics/overview`, {
          withCredentials: true,
          params: { period: '30d' }
        })
      ]);

      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.orders || [];
        
        // Separate orders into services and products
        const serviceOrders = orders.filter((order: any) => 
          order.items?.some((item: any) => item.itemType === 'service')
        );
        const productOrders = orders.filter((order: any) => 
          order.items?.some((item: any) => item.itemType === 'product')
        );
        
        setPurchasedServices(serviceOrders.map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          serviceTitle: order.items[0]?.itemTitle || 'Service Order',
          serviceType: order.items[0]?.packageDetails?.packageName || 'Service',
          sellerName: order.sellerId?.sellerName || order.sellerId?.storeName || 'Seller',
          price: order.orderTotal,
          status: order.orderStatus,
          isComplete: order.orderStatus === 'completed',
          createdAt: order.createdAt,
          completedAt: order.completedAt,
          deadline: order.estimatedDeliveryDate,
          deliveryTime: order.items[0]?.packageDetails?.deliveryTime || 'N/A',
          revisions: order.items[0]?.packageDetails?.revisions || 0,
          revisionsUsed: 0, // TODO: Track this
          thumbnailImage: order.items[0]?.itemImage || '',
          hasDelivery: order.orderStatus === 'completed' || order.deliveryDate,
          rating: null // TODO: Get from reviews
        })));
        
        setPurchasedProducts(productOrders.map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          productId: order.items[0]?.itemId, // Get the actual product ID
          productTitle: order.items[0]?.itemTitle || 'Product Order',
          productType: 'Digital Product',
          sellerName: order.sellerId?.sellerName || order.sellerId?.storeName || 'Seller',
          price: order.orderTotal,
          purchaseDate: order.createdAt,
          status: order.orderStatus,
          downloadLink: order.orderStatus === 'completed' 
            ? `${process.env.NEXT_PUBLIC_SERVER_URI || 'https://appbackend.0xmintyn.com/api/v1/'}marketplace/purchase/product/${order.items[0]?.itemId}/file`
            : null,
          thumbnailImage: order.items[0]?.itemImage || '',
          rating: null, // TODO: Get from reviews
          hasReview: false
        })));
        
        // Calculate stats from real data
        const completedOrders = orders.filter((o: any) => o.orderStatus === 'completed').length;
        const activeOrders = orders.filter((o: any) => 
          o.orderStatus === 'processing' || o.orderStatus === 'confirmed'
        ).length;
        const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.orderTotal || 0), 0);
        
        setStats({
          totalOrders: orders.length,
          activeOrders,
          completedOrders,
          totalSpent,
          favoriteItems: 0, // TODO: Implement favorites
          reviewsGiven: 0, // TODO: Get from reviews
          totalProducts: productOrders.length,
          totalServices: serviceOrders.length
        });
      }

      
      // Fetch recent messages
      await fetchRecentMessages();
      
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      // Fallback to basic stats on error
      setStats({
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        favoriteItems: 0,
        reviewsGiven: 0,
        totalProducts: 0,
        totalServices: 0
      });
      
      // Still try to fetch messages even if orders fail
      try {
        await fetchRecentMessages();
      } catch (msgError) {
        console.error('Error fetching messages:', msgError);
      }
    } finally {
      setLoading(false);
    }
  };


  const fetchRecentMessages = async () => {
    try {
      // Fetch inbox messages
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'https://appbackend.0xmintyn.com/api/v1/'}marketplace/messages/inbox?limit=5`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setRecentMessages(response.data.messages || []);
      }

      // Fetch unread count
      const unreadResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'https://appbackend.0xmintyn.com/api/v1/'}marketplace/messages/unread-count`,
        { withCredentials: true }
      );

      if (unreadResponse.data.success) {
        setUnreadCount(unreadResponse.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: any = {
      'pending_payment': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'delivered': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'revision_requested': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return statusColors[status] || statusColors['pending_payment'];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1/', '') || 'https://appbackend.0xmintyn.com';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
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

  // Filter and paginate services
  const filteredServices = useMemo(() => {
    let filtered = purchasedServices;

    // Search filter
    if (servicesSearchQuery) {
      filtered = filtered.filter(service =>
        service.serviceTitle.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
        service.sellerName.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
        service.serviceType.toLowerCase().includes(servicesSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (servicesStatusFilter !== 'all') {
      if (servicesStatusFilter === 'completed') {
        filtered = filtered.filter(service => service.isComplete);
      } else if (servicesStatusFilter === 'in_progress') {
        filtered = filtered.filter(service => !service.isComplete);
      }
    }

    return filtered;
  }, [purchasedServices, servicesSearchQuery, servicesStatusFilter]);

  const paginatedServices = useMemo(() => {
    const startIndex = (servicesCurrentPage - 1) * servicesPerPage;
    const endIndex = startIndex + servicesPerPage;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, servicesCurrentPage, servicesPerPage]);

  const servicesTotalPages = Math.ceil(filteredServices.length / servicesPerPage);

  // Filter and paginate products
  const filteredProducts = useMemo(() => {
    let filtered = purchasedProducts;

    // Search filter
    if (productsSearchQuery) {
      filtered = filtered.filter(product =>
        product.productTitle.toLowerCase().includes(productsSearchQuery.toLowerCase()) ||
        product.sellerName.toLowerCase().includes(productsSearchQuery.toLowerCase()) ||
        product.productType.toLowerCase().includes(productsSearchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [purchasedProducts, productsSearchQuery]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (productsCurrentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, productsCurrentPage, productsPerPage]);

  const productsTotalPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your orders, manage favorites, and stay connected
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace/orders/buyer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <ShoppingBag className="h-4 w-4" />
                View All Orders
              </Button>
            </Link>
            <Link href="/marketplace/services">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 gap-2">
                <ShoppingBag className="h-4 w-4" />
                Browse Services
              </Button>
            </Link>
            <Link href="/marketplace/products">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 gap-2">
                <Package className="h-4 w-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-orange-600">${stats.totalSpent.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Link href="/marketplace/messages" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Messages</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {unreadCount > 0 ? unreadCount : recentMessages.length}
                    </p>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white mt-1">New</Badge>
                    )}
                  </div>
                  <MessageSquare className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>


        {/* Recent Messages */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Recent Messages
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">{unreadCount} New</Badge>
                )}
              </span>
              <Link href="/marketplace/messages">
                <Button size="sm" variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  View All Messages
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Contact sellers about services or products
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.slice(0, 5).map((message: any) => (
                  <Link 
                    key={message._id} 
                    href={`/marketplace/messages?conversation=${message._id}`}
                    className="block"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {message.senderId?.avatar ? (
                          <img
                            src={getFullImageUrl(message.senderId.avatar)}
                            alt={message.senderId.firstName || 'User'}
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
                          className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                          style={{ display: message.senderId?.avatar ? 'none' : 'flex' }}
                        >
                          <span className="text-sm font-semibold text-white">
                            {getUserInitials(`${message.senderId?.firstName || ''} ${message.senderId?.lastName || ''}`)}
                          </span>
                        </div>
                        {!message.isRead && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                            {message.senderId?.firstName} {message.senderId?.lastName}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!message.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {message.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                          {message.message}
                        </p>
                        {message.serviceId && (
                          <Badge variant="outline" className="text-xs mt-1">
                            About: {message.serviceId.title}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products and Services Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              My Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="services" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="services" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Services ({stats.totalServices})
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products ({stats.totalProducts})
                </TabsTrigger>
              </TabsList>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-4">
                {/* Search and Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search services by title, seller, or type..."
                      value={servicesSearchQuery}
                      onChange={(e) => {
                        setServicesSearchQuery(e.target.value);
                        setServicesCurrentPage(1); // Reset to first page on search
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Select 
                    value={servicesStatusFilter} 
                    onValueChange={(value) => {
                      setServicesStatusFilter(value);
                      setServicesCurrentPage(1); // Reset to first page on filter
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Info */}
                {filteredServices.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((servicesCurrentPage - 1) * servicesPerPage) + 1} - {Math.min(servicesCurrentPage * servicesPerPage, filteredServices.length)} of {filteredServices.length} services
                  </div>
                )}

                {purchasedServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No services purchased yet</p>
                    <Link href="/marketplace/services">
                      <Button className="mt-4">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Services
                      </Button>
                    </Link>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No services found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setServicesSearchQuery('');
                        setServicesStatusFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <>
                  {paginatedServices.map((service: any) => (
                    <div 
                      key={service.id} 
                      className={`border rounded-lg p-5 hover:shadow-md transition-all relative ${
                        service.isComplete 
                          ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                          : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {/* Completion Indicator Badge */}
                      <div className="absolute top-3 right-3">
                        {service.isComplete ? (
                          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                            <CheckCircle className="h-3.5 w-3.5" />
                            COMPLETED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                            <Clock className="h-3.5 w-3.5 animate-pulse" />
                            IN PROGRESS
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                          service.isComplete ? 'opacity-100' : 'opacity-90'
                        }`}>
                          {service.thumbnailImage ? (
                            <img
                              src={getFullImageUrl(service.thumbnailImage)}
                              alt={service.serviceTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          {service.isComplete && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-28">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className={`font-semibold text-gray-900 dark:text-white ${
                                service.isComplete ? '' : ''
                              }`}>
                                {service.serviceTitle}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                by {service.sellerName}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {service.serviceType}
                              </Badge>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Price</p>
                              <p className={`text-lg font-bold ${
                                service.isComplete ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                ${service.price}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Delivery Time</p>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.deliveryTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Revisions</p>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                {service.revisionsUsed}/{service.revisions}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {service.isComplete ? 'Completed' : 'Ordered'}
                              </p>
                              <p className="text-sm font-medium">
                                {service.isComplete 
                                  ? formatDistanceToNow(new Date(service.completedAt), { addSuffix: true })
                                  : formatDistanceToNow(new Date(service.createdAt), { addSuffix: true })
                                }
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/marketplace/orders/${service.id}`}>
                              <Button size="sm" variant="default">
                                <Eye className="h-4 w-4 mr-1" />
                                View Order
                              </Button>
                            </Link>
                            <Link href={`/marketplace/messages?conversation=${service.id}`}>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message Seller
                              </Button>
                            </Link>
                            {service.hasDelivery && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download Files
                              </Button>
                            )}
                            {service.status === 'delivered' && !service.rating && (
                              <Button size="sm" variant="outline" className="text-yellow-600">
                                <Star className="h-4 w-4 mr-1" />
                                Leave Review
                              </Button>
                            )}
                            {service.rating && (
                              <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{service.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {servicesTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {servicesCurrentPage} of {servicesTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setServicesCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={servicesCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setServicesCurrentPage(prev => Math.min(prev + 1, servicesTotalPages))}
                          disabled={servicesCurrentPage === servicesTotalPages}
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

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products by title, seller, or type..."
                    value={productsSearchQuery}
                    onChange={(e) => {
                      setProductsSearchQuery(e.target.value);
                      setProductsCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Results Info */}
                {filteredProducts.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((productsCurrentPage - 1) * productsPerPage) + 1} - {Math.min(productsCurrentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                )}

                {purchasedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No products purchased yet</p>
                    <Link href="/marketplace/products">
                      <Button className="mt-4">
                        <Package className="h-4 w-4 mr-2" />
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No products found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your search</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setProductsSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <>
                  {paginatedProducts.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          {product.thumbnailImage ? (
                            <img
                              src={getFullImageUrl(product.thumbnailImage)}
                              alt={product.productTitle}
                              className="w-full h-full object-cover"
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {product.productTitle}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                by {product.sellerName}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {product.productType}
                              </Badge>
                            </div>
                            <span className="font-bold text-lg text-green-600">
                              ${product.price}
                            </span>
                          </div>

                          {/* Product Details */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className={getStatusColor(product.status)}>
                                {formatStatus(product.status)}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Purchase Date</p>
                              <p className="text-sm font-medium">
                                {formatDistanceToNow(new Date(product.purchaseDate), { addSuffix: true })}
                              </p>
                            </div>
                            {product.rating && (
                              <div>
                                <p className="text-xs text-muted-foreground">Your Rating</p>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{product.rating}/5</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/marketplace/orders/${product.id}`}>
                              <Button size="sm" variant="default">
                                <Eye className="h-4 w-4 mr-1" />
                                View Order
                              </Button>
                            </Link>
                            <Link href={`/marketplace/messages?conversation=${product.id}`}>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message Seller
                              </Button>
                            </Link>
                            {product.status === 'completed' && product.productId && (
                              <Link href={`/marketplace/product/${product.productId}`}>
                                <Button size="sm" variant="outline" className="text-green-600">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download Product
                                </Button>
                              </Link>
                            )}
                            {!product.hasReview && product.status === 'completed' && (
                              <Button size="sm" variant="outline" className="text-yellow-600">
                                <Star className="h-4 w-4 mr-1" />
                                Write Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {productsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {productsCurrentPage} of {productsTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductsCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={productsCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductsCurrentPage(prev => Math.min(prev + 1, productsTotalPages))}
                          disabled={productsCurrentPage === productsTotalPages}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

