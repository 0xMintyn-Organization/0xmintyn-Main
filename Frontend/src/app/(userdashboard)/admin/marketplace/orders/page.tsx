'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import Protected from '@/hooks/useProtected';

interface Order {
  _id: string;
  orderNumber: string;
  buyerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sellerId: {
    _id: string;
    sellerName: string;
    storeName: string;
  };
  serviceId?: {
    _id: string;
    title: string;
  };
  productId?: {
    _id: string;
    title: string;
  };
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  totalAmount: number;
  paymentMethod: string;
  paymentId: string;
  deliveryDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      setOrders([
        {
          _id: '1',
          orderNumber: 'ORD-001',
          buyerId: {
            _id: 'buyer1',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice@example.com'
          },
          sellerId: {
            _id: 'seller1',
            sellerName: 'John Doe',
            storeName: 'Creative Designs Co.'
          },
          serviceId: {
            _id: 'service1',
            title: 'Professional Logo Design'
          },
          orderStatus: 'completed',
          paymentStatus: 'completed',
          totalAmount: 100,
          paymentMethod: 'Credit Card',
          paymentId: 'pay_123456789',
          deliveryDate: '2024-03-15',
          completedDate: '2024-03-16',
          createdAt: '2024-03-10',
          updatedAt: '2024-03-16'
        },
        {
          _id: '2',
          orderNumber: 'ORD-002',
          buyerId: {
            _id: 'buyer2',
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'bob@example.com'
          },
          sellerId: {
            _id: 'seller2',
            sellerName: 'Jane Smith',
            storeName: 'Tech Solutions Pro'
          },
          productId: {
            _id: 'product1',
            title: 'Website Template - Business Pro'
          },
          orderStatus: 'processing',
          paymentStatus: 'completed',
          totalAmount: 79,
          paymentMethod: 'PayPal',
          paymentId: 'pay_987654321',
          createdAt: '2024-03-12',
          updatedAt: '2024-03-12'
        },
        {
          _id: '3',
          orderNumber: 'ORD-003',
          buyerId: {
            _id: 'buyer3',
            firstName: 'Carol',
            lastName: 'Williams',
            email: 'carol@example.com'
          },
          sellerId: {
            _id: 'seller3',
            sellerName: 'Mike Johnson',
            storeName: 'Digital Marketing Hub'
          },
          serviceId: {
            _id: 'service3',
            title: 'Social Media Marketing'
          },
          orderStatus: 'delivered',
          paymentStatus: 'completed',
          totalAmount: 500,
          paymentMethod: 'Credit Card',
          paymentId: 'pay_456789123',
          deliveryDate: '2024-03-14',
          createdAt: '2024-03-08',
          updatedAt: '2024-03-14'
        },
        {
          _id: '4',
          orderNumber: 'ORD-004',
          buyerId: {
            _id: 'buyer4',
            firstName: 'David',
            lastName: 'Brown',
            email: 'david@example.com'
          },
          sellerId: {
            _id: 'seller4',
            sellerName: 'Sarah Wilson',
            storeName: 'Content Creation Studio'
          },
          productId: {
            _id: 'product4',
            title: 'Content Writing Templates Pack'
          },
          orderStatus: 'cancelled',
          paymentStatus: 'refunded',
          totalAmount: 29,
          paymentMethod: 'Credit Card',
          paymentId: 'pay_789123456',
          createdAt: '2024-03-05',
          updatedAt: '2024-03-06'
        },
        {
          _id: '5',
          orderNumber: 'ORD-005',
          buyerId: {
            _id: 'buyer5',
            firstName: 'Eva',
            lastName: 'Davis',
            email: 'eva@example.com'
          },
          sellerId: {
            _id: 'seller1',
            sellerName: 'John Doe',
            storeName: 'Creative Designs Co.'
          },
          serviceId: {
            _id: 'service5',
            title: 'Brand Identity Package'
          },
          orderStatus: 'pending',
          paymentStatus: 'pending',
          totalAmount: 250,
          paymentMethod: 'Credit Card',
          paymentId: '',
          createdAt: '2024-03-16',
          updatedAt: '2024-03-16'
        }
      ]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sellerId.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.serviceId?.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.productId?.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-100 text-purple-800">Delivered</Badge>;
      case 'confirmed':
        return <Badge className="bg-cyan-100 text-cyan-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order._id === orderId 
        ? { ...order, orderStatus: newStatus as any, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  const handleUpdatePaymentStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order._id === orderId 
        ? { ...order, paymentStatus: newStatus as any, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
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
                  Orders Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Monitor and manage all marketplace orders
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchOrders}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders by number, buyer, seller, or item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Order Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                    No orders found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Order Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.orderNumber}</div>
                              <div className="text-sm text-gray-500">{order.paymentId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.buyerId.firstName} {order.buyerId.lastName}</div>
                              <div className="text-sm text-gray-500">{order.buyerId.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.sellerId.sellerName}</div>
                              <div className="text-sm text-gray-500">{order.sellerId.storeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {order.serviceId ? (
                                <>
                                  <div className="font-medium">{order.serviceId.title}</div>
                                  <Badge variant="outline" className="text-xs">Service</Badge>
                                </>
                              ) : (
                                <>
                                  <div className="font-medium">{order.productId?.title}</div>
                                  <Badge variant="outline" className="text-xs">Product</Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                            <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                          </TableCell>
                          <TableCell>
                            {getOrderStatusBadge(order.orderStatus)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(order.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirm Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order._id, 'processing')}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Mark Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Mark Delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order._id, 'completed')}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Complete Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdatePaymentStatus(order._id, 'refunded')}>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Process Refund
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Protected>
  );
}

