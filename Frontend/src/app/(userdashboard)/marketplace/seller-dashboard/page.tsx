'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Plus, 
  Package, 
  Users, 
  TrendingUp, 
  Eye, 
  Edit, 
  Trash2,
  BarChart3,
  Coins,
  Star,
  Clock,
  MessageSquare,
  Mail,
  Send,
  Menu,
  ChevronDown,
  ShoppingBag,
  FileText,
  Settings,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import DeleteConfirmationModal from '@/components/Marketplace/DeleteConfirmationModal';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalServices: 0,
    totalSales: 0,
    totalEarnings: 0,
    rating: 0,
    reviewCount: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentServices, setRecentServices] = useState([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSellerProfile, setHasSellerProfile] = useState(false);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: '',
    itemName: '',
    itemType: 'product' as 'product' | 'service',
    isLoading: false
  });

  useEffect(() => {
    // Check if user is a seller
    if (user && !user.isSeller) {
      window.location.href = '/marketplace';
      return;
    }
    
    // Fetch seller data
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch seller products, services, and orders in parallel (removed non-existent stats endpoint)
      const [productsResponse, servicesResponse, ordersResponse] = await Promise.all([
        // Fetch seller products
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/products/seller/my-products?limit=5`, {
          withCredentials: true
        }).catch((error) => {
          console.error('Error fetching seller products:', error);
          return { data: { success: false } };
        }),
        
        // Fetch seller services
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/services/seller/my-services?limit=5`, {
          withCredentials: true
        }).catch((error) => {
          console.error('Error fetching seller services:', error);
          return { data: { success: false } };
        }),
        
        // Fetch seller orders for sales calculation
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/orders/seller`, {
          withCredentials: true
        }).catch((error) => {
          console.error('Error fetching seller orders:', error);
          return { data: { success: false } };
        })
      ]);

      // Calculate stats from products, services, and orders
      const products = productsResponse.data.success ? productsResponse.data.products || [] : [];
      const services = servicesResponse.data.success ? servicesResponse.data.services || [] : [];
      const orders = ordersResponse.data.success ? ordersResponse.data.orders || [] : [];
      
      // Calculate total earnings from completed orders
      const totalEarnings = orders
        .filter((order: any) => order.orderStatus === 'completed')
        .reduce((sum: number, order: any) => sum + (order.orderTotal || 0), 0);
      
      // Calculate total sales count
      const totalSales = orders.filter((order: any) => order.orderStatus === 'completed').length;
      
      setStats({
        totalProducts: products.length,
        totalServices: services.length,
        totalSales,
        totalEarnings,
        rating: 0, // Will be updated when we fetch seller info
        reviewCount: 0
      });
      
      // Update recent products
      if (productsResponse.data.success && productsResponse.data.products) {
        console.log('Products fetched successfully:', productsResponse.data.products.length);
        setRecentProducts(productsResponse.data.products.map((product: any) => ({
          id: product._id,
          name: product.title,
          price: product.price,
          status: product.isActive ? 'Active' : 'Inactive',
          sales: product.salesCount || 0, // Use actual sales count from product data
          image: product.thumbnailImage || product.images?.[0]
        })));
      } else {
        console.log('Products response:', productsResponse.data);
      }
      
      // Update recent services
      if (servicesResponse.data.success && servicesResponse.data.services) {
        console.log('Services fetched successfully:', servicesResponse.data.services.length);
        setRecentServices(servicesResponse.data.services.map((service: any) => ({
          id: service._id,
          name: service.title,
          price: service.packages?.[0]?.price || service.startingPrice || 0,
          status: service.isActive ? 'Active' : 'Inactive',
          orders: service.orderCount || 0, // Use actual order count from service data
          image: service.thumbnailImage || service.images?.[0]
        })));
      } else {
        console.log('Services response:', servicesResponse.data);
      }

      // Fetch recent messages and seller rating
      await Promise.all([
        fetchRecentMessages(),
        fetchSellerRating()
      ]);
      
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      // Fetch inbox messages
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/messages/inbox?limit=5`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setRecentMessages(response.data.messages || []);
      }

      // Fetch unread count
      const unreadResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/messages/unread-count`,
        { withCredentials: true }
      );

      if (unreadResponse.data.success) {
        setUnreadCount(unreadResponse.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Delete functions
  const handleDeleteClick = (itemId: string, itemName: string, itemType: 'product' | 'service') => {
    setDeleteModal({
      isOpen: true,
      itemId,
      itemName,
      itemType,
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const endpoint = deleteModal.itemType === 'product' 
        ? `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/products/${deleteModal.itemId}`
        : `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/services/${deleteModal.itemId}`;
      
      await axios.delete(endpoint, { withCredentials: true });
      
      // Refresh the data
      await fetchSellerData();
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        itemId: '',
        itemName: '',
        itemType: 'product',
        isLoading: false
      });
      
      console.log(`${deleteModal.itemType} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${deleteModal.itemType}:`, error);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      itemId: '',
      itemName: '',
      itemType: 'product',
      isLoading: false
    });
  };

  // Fetch seller rating and reviews
  const fetchSellerRating = async () => {
    try {
      // First check if user has a seller profile
      const statusResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/sellers/profile/status`,
        { withCredentials: true }
      );

      if (statusResponse.data.success) {
        console.log('Seller profile status:', statusResponse.data);
        setHasSellerProfile(statusResponse.data.hasProfile);
        
        if (statusResponse.data.hasProfile) {
          // If user has profile, fetch the full profile data
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/sellers/profile/me`,
            { withCredentials: true }
          );

          if (response.data.success && response.data.seller) {
            console.log('Seller profile data:', response.data.seller);
            console.log('Rating and Review Count:', {
              rating: response.data.seller.rating,
              reviewCount: response.data.seller.reviewCount
            });
            setStats(prevStats => ({
              ...prevStats,
              rating: response.data.seller.rating || 0,
              reviewCount: response.data.seller.reviewCount || 0,
              // Use stored values from seller profile if available
              totalEarnings: response.data.seller.totalEarnings || prevStats.totalEarnings,
              totalSales: response.data.seller.totalSales || prevStats.totalSales
            }));
          }
        } else {
          console.log('User does not have a seller profile yet');
        }
      }
    } catch (error) {
      console.error('Error fetching seller rating:', error);
      setHasSellerProfile(false);
    }
  };

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
        <div className="flex flex-col gap-4 mb-8">
          {/* Navigation Menu Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
            {/* Quick Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Menu className="h-4 w-4" />
                  Quick Navigation
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Orders</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/marketplace/orders/seller')}>
                  <Truck className="h-4 w-4 mr-2" />
                  All Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/orders/seller?status=in_progress')}>
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  Active Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/orders/seller?status=delivered')}>
                  <Package className="h-4 w-4 mr-2 text-purple-600" />
                  Delivered Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/orders/seller?status=completed')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Completed Orders
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Services</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/marketplace/my-services')}>
                  <Users className="h-4 w-4 mr-2" />
                  My Services
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/create-service')}>
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  Create Service
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Products</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/marketplace/my-products')}>
                  <Package className="h-4 w-4 mr-2" />
                  My Products
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/create-product')}>
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  Create Product
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Other</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/marketplace/messages')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/marketplace/seller-settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Seller Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <Link href="/marketplace/messages">
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Button>
              </Link>
              <Link href="/marketplace/create-product">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Create Product
                </Button>
              </Link>
              <Link href="/marketplace/create-service">
                <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Service
                </Button>
              </Link>
            </div>
          </div>

          {/* Title Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your products, services, and track your performance
              </p>
            </div>
            <Button 
              onClick={fetchSellerData} 
              disabled={loading}
              variant="outline" 
              size="sm" 
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <Button 
                onClick={() => setError(null)} 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Seller Profile Warning */}
        {!hasSellerProfile && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">Seller Profile Required</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  You need to create a seller profile to manage products and services. 
                  <Link href="/marketplace/create-seller-profile" className="underline ml-1">
                    Create your seller profile now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalServices}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalSales}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalEarnings.toLocaleString()} 0XM</p>
                </div>
                <Coins className="h-8 w-8 text-orange-600" />
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

        {/* Rating and Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Seller Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{stats.rating}</div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(stats.rating)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {stats.reviewCount} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Response Rate</span>
                  <span className="font-semibold">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-semibold">2 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Messages from Buyers */}
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
                  Buyers will be able to contact you about your services
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
                            src={message.senderId.avatar}
                            alt={message.senderId.firstName || 'User'}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {message.senderId?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        {!message.isRead && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
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

        {/* Recent Products and Services */}
        {hasSellerProfile ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Products
                  </span>
                  <Link href="/marketplace/create-product">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No products yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Create your first product to get started
                      </p>
                    </div>
                  ) : (
                    recentProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {product.image ? (
                            <img
                              src={getFullImageUrl(product.image)}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.price} 0XM</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{product.sales} sales</span>
                          <div className="flex gap-1">
                            <Link href={`/marketplace/product/${product.id}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/marketplace/edit-product/${product.id}`}>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteClick(product.id, product.name, 'product')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Services
                  </span>
                  <Link href="/marketplace/create-service">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentServices.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No services yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Create your first service to get started
                      </p>
                    </div>
                  ) : (
                    recentServices.map((service: any) => (
                      <div key={service.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {service.image ? (
                            <img
                              src={getFullImageUrl(service.image)}
                              alt={service.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-service.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">{service.price} 0XM</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={service.status === 'Active' ? 'default' : 'secondary'}>
                            {service.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{service.orders} orders</span>
                          <div className="flex gap-1">
                            <Link href={`/marketplace/service/${service.id}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/marketplace/edit-service/${service.id}`}>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteClick(service.id, service.name, 'service')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Complete Your Seller Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to create a seller profile to start selling products and services on our marketplace.
              </p>
              <Link href="/marketplace/create-seller-profile">
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Store className="h-4 w-4" />
                  Create Seller Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteModal.itemType === 'product' ? 'Product' : 'Service'}`}
        description={`Are you sure you want to delete this ${deleteModal.itemType}? This action cannot be undone.`}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
