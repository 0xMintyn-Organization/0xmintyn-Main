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
  Briefcase, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Star,
  Clock,
  DollarSign,
  Users,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Protected from '@/hooks/useProtected';

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  thumbnailImage: string;
  sellerId: {
    _id: string;
    sellerName: string;
    storeName: string;
  };
  packages: Array<{
    name: string;
    price: number;
    deliveryTime: string;
  }>;
  deliveryTime: string;
  rating: number;
  reviewCount: number;
  orderCount: number;
  viewCount: number;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      setServices([
        {
          _id: '1',
          title: 'Professional Logo Design',
          description: 'Custom logo design for your business with unlimited revisions',
          category: 'Graphics & Design',
          subcategory: 'Logo Design',
          thumbnailImage: '/placeholder-service.jpg',
          sellerId: {
            _id: 'seller1',
            sellerName: 'John Doe',
            storeName: 'Creative Designs Co.'
          },
          packages: [
            { name: 'Basic', price: 50, deliveryTime: '3 Days' },
            { name: 'Premium', price: 100, deliveryTime: '2 Days' }
          ],
          deliveryTime: '3 Days',
          rating: 4.8,
          reviewCount: 156,
          orderCount: 89,
          viewCount: 1250,
          isActive: true,
          isApproved: true,
          approvalStatus: 'Approved',
          isFeatured: true,
          createdAt: '2024-01-15'
        },
        {
          _id: '2',
          title: 'Website Development',
          description: 'Responsive website development with modern design',
          category: 'Programming & Tech',
          subcategory: 'Web Development',
          thumbnailImage: '/placeholder-service.jpg',
          sellerId: {
            _id: 'seller2',
            sellerName: 'Jane Smith',
            storeName: 'Tech Solutions Pro'
          },
          packages: [
            { name: 'Basic Website', price: 500, deliveryTime: '7 Days' },
            { name: 'Advanced Website', price: 1000, deliveryTime: '14 Days' }
          ],
          deliveryTime: '7 Days',
          rating: 4.6,
          reviewCount: 89,
          orderCount: 67,
          viewCount: 890,
          isActive: true,
          isApproved: true,
          approvalStatus: 'Approved',
          isFeatured: false,
          createdAt: '2024-02-20'
        },
        {
          _id: '3',
          title: 'Social Media Marketing',
          description: 'Complete social media marketing strategy and management',
          category: 'Digital Marketing',
          subcategory: 'Social Media Marketing',
          thumbnailImage: '/placeholder-service.jpg',
          sellerId: {
            _id: 'seller3',
            sellerName: 'Mike Johnson',
            storeName: 'Digital Marketing Hub'
          },
          packages: [
            { name: 'Basic Package', price: 200, deliveryTime: '5 Days' },
            { name: 'Premium Package', price: 500, deliveryTime: '10 Days' }
          ],
          deliveryTime: '5 Days',
          rating: 4.2,
          reviewCount: 23,
          orderCount: 12,
          viewCount: 340,
          isActive: true,
          isApproved: false,
          approvalStatus: 'Pending',
          isFeatured: false,
          createdAt: '2024-03-10'
        },
        {
          _id: '4',
          title: 'Content Writing Services',
          description: 'High-quality content writing for blogs, websites, and marketing',
          category: 'Writing & Translation',
          subcategory: 'Content Writing',
          thumbnailImage: '/placeholder-service.jpg',
          sellerId: {
            _id: 'seller4',
            sellerName: 'Sarah Wilson',
            storeName: 'Content Creation Studio'
          },
          packages: [
            { name: 'Basic Content', price: 25, deliveryTime: '2 Days' },
            { name: 'Premium Content', price: 50, deliveryTime: '3 Days' }
          ],
          deliveryTime: '2 Days',
          rating: 4.9,
          reviewCount: 234,
          orderCount: 145,
          viewCount: 2100,
          isActive: false,
          isApproved: false,
          approvalStatus: 'Rejected',
          rejectionReason: 'Inappropriate content description',
          isFeatured: false,
          createdAt: '2023-11-05'
        }
      ]);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.sellerId.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && service.approvalStatus === 'Pending') ||
      (statusFilter === 'approved' && service.approvalStatus === 'Approved') ||
      (statusFilter === 'rejected' && service.approvalStatus === 'Rejected') ||
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive);
    
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string, isActive: boolean) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return isActive ? (
          <Badge className="bg-green-100 text-green-800">Active</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800">Inactive</Badge>
        );
    }
  };

  const getMinPrice = (packages: any[]) => {
    return Math.min(...packages.map(pkg => pkg.price));
  };

  const handleApproveService = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service._id === serviceId 
        ? { ...service, approvalStatus: 'Approved', isApproved: true, isActive: true }
        : service
    ));
  };

  const handleRejectService = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service._id === serviceId 
        ? { ...service, approvalStatus: 'Rejected', isApproved: false, isActive: false }
        : service
    ));
  };

  const handleToggleActive = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service._id === serviceId 
        ? { ...service, isActive: !service.isActive }
        : service
    ));
  };

  const handleToggleFeatured = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service._id === serviceId 
        ? { ...service, isFeatured: !service.isFeatured }
        : service
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
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
                  Services Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and moderate all marketplace services
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchServices}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
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
                      placeholder="Search services by title, description, or seller..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Graphics & Design">Graphics & Design</SelectItem>
                    <SelectItem value="Programming & Tech">Programming & Tech</SelectItem>
                    <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                    <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="orders">Most Orders</SelectItem>
                    <SelectItem value="views">Most Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Services ({filteredServices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                    No services found
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
                        <TableHead>Service</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                <Image
                                  src={service.thumbnailImage}
                                  alt={service.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{service.title}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">{service.description}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {service.isFeatured && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">Featured</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{service.sellerId.sellerName}</div>
                              <div className="text-sm text-gray-500">{service.sellerId.storeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{service.category}</div>
                            <div className="text-xs text-gray-500">{service.subcategory}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${getMinPrice(service.packages)}</div>
                            <div className="text-xs text-gray-500">Starting from</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{service.rating.toFixed(1)}</span>
                              <span className="text-sm text-gray-500">({service.reviewCount})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{service.orderCount}</div>
                            <div className="text-xs text-gray-500">{service.viewCount} views</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(service.approvalStatus, service.isActive)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(service.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem>
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  View Images
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {service.approvalStatus === 'Pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleApproveService(service._id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRejectService(service._id)}>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => handleToggleActive(service._id)}>
                                  {service.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleFeatured(service._id)}>
                                  {service.isFeatured ? (
                                    <>
                                      <AlertTriangle className="mr-2 h-4 w-4" />
                                      Remove Featured
                                    </>
                                  ) : (
                                    <>
                                      <Star className="mr-2 h-4 w-4" />
                                      Make Featured
                                    </>
                                  )}
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

