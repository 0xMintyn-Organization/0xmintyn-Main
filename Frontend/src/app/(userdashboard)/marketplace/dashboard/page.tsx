'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Star, 
  Eye, 
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

// Sample data
const recentOrders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    status: 'Delivered',
    total: 2549,
    items: [
      { name: 'MacBook Pro 16-inch', quantity: 1, price: 2499 },
      { name: 'Logo Design Service', quantity: 1, price: 50 }
    ]
  },
  {
    id: 'ORD-002',
    date: '2024-01-10',
    status: 'Shipped',
    total: 349,
    items: [
      { name: 'Sony WH-1000XM4', quantity: 1, price: 349 }
    ]
  }
];

const favoriteItems = [
  {
    id: 1,
    title: "iPhone 15 Pro Max",
    price: 1199,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=150&fit=crop",
    seller: "TechStore Pro",
    addedDate: "2024-01-12"
  },
  {
    id: 2,
    title: "Website Development Service",
    price: 150,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop",
    seller: "CodeMaster",
    addedDate: "2024-01-08"
  }
];

const sellerStats = {
  totalEarnings: 12500,
  monthlyEarnings: 3200,
  totalOrders: 156,
  pendingOrders: 8,
  averageRating: 4.8,
  totalReviews: 89
};

const sellerListings = [
  {
    id: 1,
    title: "Professional Logo Design",
    type: "service",
    price: 50,
    status: "Active",
    views: 1250,
    orders: 45,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=150&fit=crop"
  },
  {
    id: 2,
    title: "Custom Website Development",
    type: "service",
    price: 200,
    status: "Active",
    views: 890,
    orders: 23,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop"
  }
];

export default function MarketplaceDashboard() {
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');

  const stats = userType === 'buyer' ? [
    { icon: ShoppingBag, label: "Total Orders", value: "12", color: "text-blue-600" },
    { icon: Package, label: "Pending Orders", value: "2", color: "text-orange-600" },
    { icon: DollarSign, label: "Total Spent", value: "$3,250", color: "text-green-600" },
    { icon: Star, label: "Reviews Given", value: "8", color: "text-purple-600" }
  ] : [
    { icon: TrendingUp, label: "Total Earnings", value: `$${sellerStats.totalEarnings.toLocaleString()}`, color: "text-green-600" },
    { icon: Users, label: "Total Orders", value: sellerStats.totalOrders.toString(), color: "text-blue-600" },
    { icon: Star, label: "Average Rating", value: sellerStats.averageRating.toString(), color: "text-yellow-600" },
    { icon: Eye, label: "Profile Views", value: "2,450", color: "text-purple-600" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">Marketplace Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your marketplace activity.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={userType === 'buyer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setUserType('buyer')}
              >
                Buyer
              </Button>
              <Button
                variant={userType === 'seller' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setUserType('seller')}
              >
                Seller
              </Button>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              {userType === 'buyer' ? 'Browse Marketplace' : 'Create Listing'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {userType === 'buyer' ? (
              <>
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Order #{order.id}</h4>
                              <p className="text-sm text-gray-600">{order.date}</p>
                              <p className="text-sm text-gray-600">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${order.total}</div>
                            <Badge 
                              className={
                                order.status === 'Delivered' ? 'bg-green-500' :
                                order.status === 'Shipped' ? 'bg-blue-500' : 'bg-orange-500'
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Favorite Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Favorites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              <p className="text-xs text-gray-600">by {item.seller}</p>
                              <p className="text-sm font-semibold">${item.price}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Heart className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Seller Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium">Logo Design Order</p>
                              <p className="text-sm text-gray-600">Completed • $50</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500">Completed</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">Website Development</p>
                              <p className="text-sm text-gray-600">In Progress • $200</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-500">In Progress</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="font-medium">Brand Identity Package</p>
                              <p className="text-sm text-gray-600">Pending Review • $150</p>
                            </div>
                          </div>
                          <Badge className="bg-orange-500">Pending</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Your Listings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sellerListings.map((listing) => (
                          <div key={listing.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              <Image
                                src={listing.image}
                                alt={listing.title}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{listing.title}</h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <span>{listing.views} views</span>
                                <span>•</span>
                                <span>{listing.orders} orders</span>
                                <span>•</span>
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span>{listing.rating}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${listing.price}</div>
                              <Badge className="bg-green-500 text-xs">{listing.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${order.total}</div>
                          <Badge 
                            className={
                              order.status === 'Delivered' ? 'bg-green-500' :
                              order.status === 'Shipped' ? 'bg-blue-500' : 'bg-orange-500'
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">by {item.seller}</p>
                          <p className="text-sm font-semibold">${item.price}</p>
                          <p className="text-xs text-gray-500">Added {item.addedDate}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm">
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>This Month</span>
                      <span className="font-semibold">${sellerStats.monthlyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings</span>
                      <span className="font-semibold">${sellerStats.totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Orders</span>
                      <span className="font-semibold">{sellerStats.pendingOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold">{sellerStats.averageRating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Reviews</span>
                      <span className="font-semibold">{sellerStats.totalReviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-semibold text-green-600">98%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
