'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Package, Clock, CheckCircle, RefreshCw, MessageSquare, 
  Upload, Download, Star, AlertCircle, ArrowLeft, User,
  Calendar, DollarSign, Truck, FileText, XCircle, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow, format, differenceInMilliseconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data based on order ID
      setOrder({
        id: orderId,
        serviceTitle: 'Professional Logo Design',
        serviceType: 'Graphic Design',
        thumbnailImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop',
        
        // Buyer info
        buyerId: 'buyer123',
        buyerName: 'John Doe',
        buyerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        buyerEmail: 'john@example.com',
        
        // Seller info
        sellerId: 'seller456',
        sellerName: 'DesignPro Studio',
        sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
        
        // Order details
        price: 150,
        status: 'in_progress', // in_progress, delivered, revision_requested, completed, cancelled
        createdAt: '2024-01-20T10:00:00Z',
        deadline: '2024-01-25T10:00:00Z',
        deliveryTime: '3 Days',
        revisions: 3,
        revisionsUsed: 0,
        
        // Requirements
        requirements: 'I need a modern, minimalist logo for my tech startup. The company name is "TechFlow" and we work in AI/ML space. Prefer blue and white colors. Need both light and dark versions.',
        
        // Delivery info
        deliveredAt: null,
        deliveryFiles: [],
        deliveryNotes: '',
        
        // Revision info
        revisionHistory: [],
        
        // Completion info
        completedAt: null,
        rating: null,
        reviewText: null,
        
        // Payment info
        paymentStatus: 'paid',
        transactionId: 'TXN-2024-001'
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDeliveryFiles(Array.from(e.target.files));
    }
  };

  const handleDeliverOrder = async () => {
    if (!deliveryMessage && deliveryFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a delivery message or upload files",
      });
      return;
    }

    setSubmittingDelivery(true);
    try {
      // TODO: API call to deliver order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "✅ Order Delivered!",
        description: "Your delivery has been submitted successfully. The buyer will review it soon.",
      });
      
      // Update order status
      setOrder({
        ...order,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        deliveryNotes: deliveryMessage,
        deliveryFiles: deliveryFiles.map(f => ({
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f)
        }))
      });
      
      setDeliveryMessage('');
      setDeliveryFiles([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delivery Failed",
        description: "Failed to submit delivery. Please try again.",
      });
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionMessage) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide revision details",
      });
      return;
    }

    try {
      // TODO: API call to request revision
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Revision Requested",
        description: "The seller has been notified of your revision request.",
      });
      
      setOrder({
        ...order,
        status: 'revision_requested',
        revisionsUsed: order.revisionsUsed + 1,
        revisionHistory: [
          ...order.revisionHistory,
          {
            message: revisionMessage,
            requestedAt: new Date().toISOString(),
            requestedBy: user?._id
          }
        ]
      });
      
      setRevisionMessage('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Failed to request revision. Please try again.",
      });
    }
  };

  const handleAcceptDelivery = async () => {
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Rating Required",
        description: "Please provide a rating before accepting",
      });
      return;
    }

    try {
      // TODO: API call to accept delivery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "✅ Order Completed!",
        description: "Thank you for your review. The order is now complete.",
      });
      
      setOrder({
        ...order,
        status: 'completed',
        completedAt: new Date().toISOString(),
        rating,
        reviewText: review
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Failed to complete order. Please try again.",
      });
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
      case 'in_progress': return <Clock className="h-5 w-5" />;
      case 'delivered': return <Truck className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'revision_requested': return <RefreshCw className="h-5 w-5" />;
      case 'cancelled': return <XCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRemainingTime = () => {
    if (!order || order.status === 'completed' || order.status === 'cancelled') {
      return { text: 'N/A', color: 'text-gray-500' };
    }
    
    const now = new Date();
    const due = new Date(order.deadline);
    const diff = differenceInMilliseconds(due, now);

    if (diff <= 0) {
      return { text: 'Overdue', color: 'text-red-500' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m`;

    let color = 'text-green-500';
    if (days < 2 && days >= 1) color = 'text-yellow-500';
    if (days < 1) color = 'text-red-500';

    return { text: text.trim(), color };
  };

  // Determine if current user is seller
  const isSeller = user?._id === order?.sellerId;
  const timeRemaining = getRemainingTime();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The order you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href={isSeller ? '/marketplace/orders/seller' : '/marketplace/user-dashboard'}>
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order #{order.id}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {order.serviceTitle}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          <span className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            {formatStatus(order.status)}
          </span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={order.thumbnailImage}
                    alt={order.serviceTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{order.serviceTitle}</h3>
                  <Badge variant="outline" className="mb-2">{order.serviceType}</Badge>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Price</p>
                      <p className="font-semibold text-green-600">${order.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Delivery Time</p>
                      <p className="font-semibold">{order.deliveryTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Revisions</p>
                      <p className="font-semibold">{order.revisionsUsed}/{order.revisions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Time Remaining</p>
                      <p className={`font-semibold ${timeRemaining.color}`}>
                        {timeRemaining.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {order.requirements}
              </p>
            </CardContent>
          </Card>

          {/* Delivery Section - For Sellers */}
          {isSeller && (order.status === 'in_progress' || order.status === 'revision_requested') && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Upload className="h-5 w-5" />
                  Deliver Your Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryMessage">Delivery Message *</Label>
                  <Textarea
                    id="deliveryMessage"
                    placeholder="Describe what you're delivering and any important notes..."
                    value={deliveryMessage}
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryFiles">Attach Files</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="deliveryFiles"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="deliveryFiles" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF, ZIP (max 100MB each)
                      </p>
                    </label>
                  </div>
                  {deliveryFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {deliveryFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleDeliverOrder}
                  disabled={submittingDelivery}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {submittingDelivery ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Submitting Delivery...
                    </>
                  ) : (
                    <>
                      <Truck className="h-5 w-5 mr-2" />
                      Submit Delivery
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delivered Work - For Buyers */}
          {!isSeller && order.status === 'delivered' && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Package className="h-5 w-5" />
                  Delivered Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Delivery Message</Label>
                  <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {order.deliveryNotes || 'No message provided'}
                  </p>
                </div>

                {order.deliveryFiles && order.deliveryFiles.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Delivered Files</Label>
                    <div className="space-y-2">
                      {order.deliveryFiles.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Accept or Request Revision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={order.revisionsUsed >= order.revisions}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request Revision ({order.revisions - order.revisionsUsed} left)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                          Describe what changes you need
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Please explain what needs to be revised..."
                          value={revisionMessage}
                          onChange={(e) => setRevisionMessage(e.target.value)}
                          rows={5}
                        />
                        <Button onClick={handleRequestRevision} className="w-full">
                          Submit Revision Request
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Delivery
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Accept Delivery & Complete Order</DialogTitle>
                        <DialogDescription>
                          Please rate your experience
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">Rating *</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-8 w-8 ${
                                    star <= rating
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="review">Review (Optional)</Label>
                          <Textarea
                            id="review"
                            placeholder="Share your experience with this seller..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleAcceptDelivery} className="w-full bg-green-600 hover:bg-green-700">
                          Complete Order
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Order - Show Review */}
          {order.status === 'completed' && order.rating && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Order Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Rating</Label>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < order.rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {order.reviewText && (
                  <div>
                    <Label className="mb-2 block">Review</Label>
                    <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {order.reviewText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Revision History */}
          {order.revisionHistory && order.revisionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Revision History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.revisionHistory.map((revision: any, index: number) => (
                    <div key={index} className="border-l-2 border-orange-500 pl-4">
                      <p className="text-sm text-gray-500 mb-1">
                        {formatDistanceToNow(new Date(revision.requestedAt), { addSuffix: true })}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">{revision.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                <span className="font-medium">#{order.id}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Price</span>
                <span className="font-bold text-green-600 text-lg">${order.price}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <Badge className={getStatusColor(order.status)}>
                  {formatStatus(order.status)}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-1">Ordered</span>
                <span className="font-medium">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-1">Deadline</span>
                <span className="font-medium">
                  {format(new Date(order.deadline), 'MMM dd, yyyy • hh:mm a')}
                </span>
              </div>
              {order.deliveredAt && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Delivered</span>
                  <span className="font-medium">
                    {format(new Date(order.deliveredAt), 'MMM dd, yyyy • hh:mm a')}
                  </span>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Completed</span>
                  <span className="font-medium">
                    {format(new Date(order.completedAt), 'MMM dd, yyyy • hh:mm a')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>{isSeller ? 'Buyer' : 'Seller'} Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={isSeller ? order.buyerAvatar : order.sellerAvatar}
                    alt={isSeller ? order.buyerName : order.sellerName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">{isSeller ? order.buyerName : order.sellerName}</p>
                  {!isSeller && order.buyerEmail && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.buyerEmail}</p>
                  )}
                </div>
              </div>
              <Link href={`/marketplace/messages?conversation=${order.id}`}>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/marketplace/messages?conversation=${order.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message {isSeller ? 'Buyer' : 'Seller'}
                </Button>
              </Link>
              {order.status !== 'cancelled' && (
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

