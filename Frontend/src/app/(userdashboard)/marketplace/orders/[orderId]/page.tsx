'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Clock, CheckCircle, MessageSquare, 
  Download, Star, AlertCircle, ArrowLeft, 
  Calendar, DollarSign, Truck, FileText, XCircle, Loader2,
  TrendingUp, Award, Zap
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow, format, differenceInMilliseconds, differenceInDays, differenceInHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import OrderStatusTimeline from '@/components/Marketplace/OrderStatusTimeline';
import DeliveryModal from '@/components/Marketplace/DeliveryModal';
import DeliveryFiles from '@/components/Marketplace/DeliveryFiles';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderId = params?.orderId as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setOrder(response.data.order);
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setError(error.response?.data?.message || 'Failed to load order details');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'processing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'delivered': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'refunded': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5" />;
      case 'processing': return <TrendingUp className="h-5 w-5" />;
      case 'delivered': return <Truck className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'cancelled': return <XCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getDeliveryCountdown = () => {
    if (!order?.estimatedDeliveryDate) {
      return { text: 'Not set', color: 'text-gray-500', progress: 0 };
    }
    
    const now = new Date();
    const deliveryDate = new Date(order.estimatedDeliveryDate);
    const startDate = order.startedAt ? new Date(order.startedAt) : new Date(order.createdAt);
    
    // If already completed or cancelled
    if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') {
      return { text: 'Completed', color: 'text-green-500', progress: 100 };
    }
    
    // If delivered, show delivered status
    if (order.orderStatus === 'delivered') {
      return { text: 'Delivered', color: 'text-orange-500', progress: 90 };
    }
    
    // Calculate time remaining
    const totalTime = differenceInMilliseconds(deliveryDate, startDate);
    const elapsed = differenceInMilliseconds(now, startDate);
    const remaining = differenceInMilliseconds(deliveryDate, now);
    
    // Calculate progress percentage
    const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
    
    // If overdue
    if (remaining <= 0) {
      const overdueHours = Math.abs(differenceInHours(now, deliveryDate));
      return { 
        text: `Overdue by ${overdueHours}h`, 
        color: 'text-red-500', 
        progress: 100 
      };
    }
    
    // Calculate remaining time
    const days = differenceInDays(deliveryDate, now);
    const hours = differenceInHours(deliveryDate, now) % 24;
    
    let text = '';
    if (days > 0) {
      text = `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      text = `${hours}h ${minutes}m remaining`;
    } else {
      const minutes = Math.floor(remaining / (1000 * 60));
      text = `${minutes}m remaining`;
    }
    
    // Determine color based on urgency
    let color = 'text-green-500';
    if (days < 2) color = 'text-yellow-500';
    if (days < 1) color = 'text-orange-500';
    if (hours < 6) color = 'text-red-500';
    
    return { text, color, progress: Math.round(progress) };
  };

  // Determine if current user is seller and owns this order
  const isSellerByOwnership = user?.isSeller && order && (
    user._id === order.sellerId?.userId || 
    user._id === order.sellerId?._id ||
    user._id === order.sellerId
  );
  
  const deliveryCountdown = order ? getDeliveryCountdown() : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Order Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
          {error || "The order you're looking for doesn't exist or you don't have access to it."}
        </p>
        <div className="flex gap-3">
          <Link href="/marketplace/user-dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button onClick={fetchOrderDetails}>
            <Download className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {isSellerByOwnership ? 'Sell Order' : 'Order'} #{order.orderNumber || order._id?.slice(-8)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {isSellerByOwnership ? 'Customer order' : 'Your order'} • Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Badge className={`${getStatusColor(order.orderStatus)} text-base px-4 py-2`}>
          <span className="flex items-center gap-2">
            {getStatusIcon(order.orderStatus)}
            {formatStatus(order.orderStatus)}
          </span>
        </Badge>
      </div>

      {/* Delivery Progress Bar */}
      {deliveryCountdown && !['cancelled', 'completed'].includes(order.orderStatus) && (
        <Card className="mb-6 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Delivery Progress
                </h3>
                <span className={`font-bold ${deliveryCountdown.color}`}>
                  {deliveryCountdown.text}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 rounded-full"
                  style={{ width: `${deliveryCountdown.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Started: {order.startedAt ? format(new Date(order.startedAt), 'MMM dd, hh:mm a') : format(new Date(order.createdAt), 'MMM dd, hh:mm a')}</span>
                <span className="font-medium">{deliveryCountdown.progress}% Complete</span>
                <span>Due: {format(new Date(order.estimatedDeliveryDate), 'MMM dd, hh:mm a')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    {item.itemImage ? (
                      <Image
                        src={getFullImageUrl(item.itemImage)}
                        alt={item.itemTitle}
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
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.itemTitle}</h3>
                        <Badge variant="outline" className="mt-1">
                          {item.itemType === 'service' ? '🎯 Service' : '📦 Product'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${item.itemPrice}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    
                    {/* Package Details for Services */}
                    {item.packageDetails && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {item.packageDetails.deliveryTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {item.packageDetails.revisions} Revisions
                          </div>
                        </div>
                        {item.packageDetails.features && item.packageDetails.features.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Includes:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.packageDetails.features.slice(0, 3).map((feature: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {item.packageDetails.features.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.packageDetails.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Files Section (for buyers when order is delivered) */}
          {!isSellerByOwnership && (order.orderStatus === 'delivered' || order.orderStatus === 'completed') && (
            <div data-delivery-files>
              <DeliveryFiles 
                orderId={orderId}
                orderStatus={order.orderStatus}
              />
            </div>
          )}

          {/* Seller Delivery Section */}
          {isSellerByOwnership && order.orderStatus === 'processing' && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Deliver Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Ready to deliver your work?
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    Upload your completed files and deliver the order to the buyer. The buyer will have 3 days to review and request revisions if needed.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setDeliveryModalOpen(true)}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Deliver Order
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement message functionality
                        toast({
                          title: "Message Buyer",
                          description: "Messaging functionality coming soon!",
                        });
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Buyer
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Upload completed files</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Add delivery message</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark as delivered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline Component */}
          <OrderStatusTimeline 
            currentStatus={order.orderStatus}
            statusHistory={order.statusHistory}
            createdAt={order.createdAt}
            startedAt={order.startedAt}
            completedAt={order.completedAt}
            cancelledAt={order.cancelledAt}
          />

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${order.orderTotal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                  <Badge className={order.paymentStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {formatStatus(order.paymentStatus)}
                  </Badge>
                </div>
              </div>
              
              {order.paymentDetails && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium">${order.paymentDetails.amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Platform Fee (10%)</span>
                      <span className="font-medium">${order.paymentDetails.fees?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                      <span>Seller Receives</span>
                      <span className="text-green-600">${order.paymentDetails.netAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
              
              {order.paymentMethod && order.paymentMethod !== 'pending' && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Information */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.estimatedDeliveryDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Delivery</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {format(new Date(order.estimatedDeliveryDate), 'EEEE, MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(order.estimatedDeliveryDate), { addSuffix: true })}
                  </p>
                </div>
              )}
              
              {order.deliveryDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Actual Delivery</p>
                    <p className="font-semibold text-green-600">
                      {format(new Date(order.deliveryDate), 'EEEE, MMMM dd, yyyy')}
                    </p>
                    <Badge className="mt-2 bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Delivered On Time
                    </Badge>
                  </div>
                </>
              )}
              
              {order.startedAt && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Started</span>
                      <span className="font-medium">{formatDistanceToNow(new Date(order.startedAt), { addSuffix: true })}</span>
                    </div>
                    {order.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Completed</span>
                        <span className="font-medium">{formatDistanceToNow(new Date(order.completedAt), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Seller/Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isSellerByOwnership ? (
                  <>
                    <Package className="h-5 w-5 text-blue-600" />
                    Buyer Information
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5 text-purple-600" />
                    Seller Information
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSellerByOwnership ? (
                // Buyer Info for Seller
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      {order.buyerId?.avatar ? (
                        <Image
                          src={order.buyerId.avatar}
                          alt={order.buyerId.firstName || 'Buyer'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {order.buyerId?.firstName?.charAt(0) || 'B'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.buyerId?.firstName} {order.buyerId?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{order.buyerId?.username}
                      </p>
                    </div>
                  </div>
                  <Link href={`/marketplace/messages`}>
                    <Button variant="outline" className="w-full" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </Link>
                </div>
              ) : (
                // Seller Info for Buyer
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      {order.sellerId?.storeLogo ? (
                        <Image
                          src={getFullImageUrl(order.sellerId.storeLogo)}
                          alt={order.sellerId.sellerName || 'Seller'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {order.sellerId?.sellerName?.charAt(0) || 'S'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.sellerId?.sellerName || order.sellerId?.storeName}
                      </p>
                      {order.sellerId?.sellerLevel && (
                        <Badge className="bg-green-500 text-white text-xs mt-1">
                          {order.sellerId.sellerLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {order.sellerId?.rating && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{order.sellerId.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span>{order.sellerId.totalSales || 0} sales</span>
                      </div>
                    </div>
                  )}
                  
                  <Link href={`/marketplace/messages`}>
                    <Button variant="outline" className="w-full" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Seller
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isSellerByOwnership ? (
                  <>
                    <Truck className="h-5 w-5 text-blue-600" />
                    Seller Actions
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 text-green-600" />
                    Quick Actions
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Common Actions */}
              <Link href="/marketplace/messages">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isSellerByOwnership ? 'Message Buyer' : 'Message Seller'}
                </Button>
              </Link>
              
              {order.offerId && (
                <Link href={`/marketplace/messages`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View Original Offer
                  </Button>
                </Link>
              )}

              {/* Seller-Specific Actions */}
              {isSellerByOwnership && order.orderStatus === 'processing' && (
                <>
                  <Button 
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setDeliveryModalOpen(true)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Deliver Order
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      toast({
                        title: "Request Extension",
                        description: "Extension request functionality coming soon!",
                      });
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Request Extension
                  </Button>
                </>
              )}

              {/* Buyer-Specific Actions */}
              {!isSellerByOwnership && order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this order?')) {
                      toast({
                        title: "Order Cancellation",
                        description: "Please contact the seller to discuss cancellation.",
                      });
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}

              {/* Post-Delivery Actions for Buyers */}
              {!isSellerByOwnership && (order.orderStatus === 'delivered' || order.orderStatus === 'completed') && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      // Scroll to delivery files section
                      const deliverySection = document.querySelector('[data-delivery-files]');
                      deliverySection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Files
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => {
                      toast({
                        title: "Request Revision",
                        description: "Revision request functionality coming soon!",
                      });
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Request Revision
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Security */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Secure Transaction</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your payment is protected until delivery is accepted
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        orderId={orderId}
        orderItems={order?.items || []}
        onDeliverySuccess={() => {
          // Refresh order data after successful delivery
          fetchOrderDetails();
        }}
      />
    </div>
  );
}
