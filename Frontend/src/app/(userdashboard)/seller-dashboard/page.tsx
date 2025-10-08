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
  DollarSign,
  Star,
  Clock,
  MessageSquare,
  Mail,
  Send
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
      // TODO: Implement API calls to fetch seller data
      // For now, using mock data
      setStats({
        totalProducts: 5,
        totalServices: 3,
        totalSales: 127,
        totalEarnings: 2540.50,
        rating: 4.8,
        reviewCount: 23
      });
      
      setRecentProducts([
        { id: 1, name: 'React Dashboard Template', price: 49.99, status: 'Active', sales: 12 },
        { id: 2, name: 'E-commerce UI Kit', price: 29.99, status: 'Active', sales: 8 },
        { id: 3, name: 'Mobile App Template', price: 79.99, status: 'Pending', sales: 0 }
      ]);
      
      setRecentServices([
        { id: 1, name: 'Web Development', price: 500, status: 'Active', orders: 5 },
        { id: 2, name: 'UI/UX Design', price: 300, status: 'Active', orders: 3 },
        { id: 3, name: 'Consulting', price: 150, status: 'Active', orders: 2 }
      ]);

      // Fetch recent messages
      await fetchRecentMessages();
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      // Fetch inbox messages
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/inbox?limit=5`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setRecentMessages(response.data.messages || []);
      }

      // Fetch unread count
      const unreadResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/unread-count`,
        { withCredentials: true }
      );

      if (unreadResponse.data.success) {
        setUnreadCount(unreadResponse.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Seller Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your products, services, and track your performance
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace/create-product">
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </Link>
            <Link href="/marketplace/create-service">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 gap-2">
                <Plus className="h-4 w-4" />
                Create Service
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
                  <p className="text-2xl font-bold text-orange-600">${stats.totalEarnings.toFixed(2)}</p>
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
                {recentProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">${product.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{product.sales} sales</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
                {recentServices.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">${service.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={service.status === 'Active' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{service.orders} orders</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
