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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Briefcase, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Star,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Protected from '@/hooks/useProtected';
import { toast } from 'sonner';
import { marketplaceAPI } from '@/lib/api';
import ErrorBoundary from '@/components/ErrorBoundary';

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  sellerId: {
    _id: string;
    sellerName: string;
    storeName: string;
    storeLogo?: string;
  };
  packages: Array<{
    name: string;
    price: number;
    deliveryTime: string;
    revisions: string;
    features: string[];
  }>;
  images: string[];
  thumbnailImage: string;
  rating: number;
  reviewCount: number;
  orderCount: number;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Fetch real services from backend
      const data = await marketplaceAPI.getServices();
      setServices(data.services || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error(error.message || 'Failed to load services');
      
      // Fallback to empty array if API fails
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await marketplaceAPI.deleteService(serviceToDelete);
      toast.success('Service deleted successfully');
      setServices(prev => prev.filter(s => s._id !== serviceToDelete));
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.sellerId.sellerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || service.approvalStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-high':
        return Math.max(...b.packages.map(p => p.price)) - Math.max(...a.packages.map(p => p.price));
      case 'price-low':
        return Math.max(...a.packages.map(p => p.price)) - Math.max(...b.packages.map(p => p.price));
      case 'rating':
        return b.rating - a.rating;
      case 'orders':
        return b.orderCount - a.orderCount;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', icon: '✓' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      rejected: { color: 'bg-red-100 text-red-800', icon: '✗' },
      'under review': { color: 'bg-blue-100 text-blue-800', icon: '👁' }
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.color} border-0`}>
        {config.icon} {status}
      </Badge>
    );
  };

  const getMinPrice = (packages: any[]) => {
    return Math.min(...packages.map(p => p.price));
  };

  const getMaxPrice = (packages: any[]) => {
    return Math.max(...packages.map(p => p.price));
  };

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-service.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Handle environment variable with trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'https://appbackend.0xmintyn.com';
    
    // Remove trailing slash if present
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Helper function to get service image (thumbnail or first image)
  const getServiceImage = (service: Service) => {
    if (service.thumbnailImage) return service.thumbnailImage;
    if (service.images && service.images.length > 0) return service.images[0];
    return null;
  };

  if (loading) {
    return (
      <Protected>
        <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading services...</p>
          </div>
        </div>
        </ErrorBoundary>
      </Protected>
    );
  }

  return (
    <Protected>
      <ErrorBoundary>
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
                <Button onClick={fetchServices} variant="outline" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Services</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{services.length}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {services.filter(s => s.isApproved).length}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {services.filter(s => s.approvalStatus === 'Pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {services.reduce((sum, s) => sum + s.orderCount, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="under review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Design & Creative">Design & Creative</SelectItem>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                    <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                    <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                    <SelectItem value="Music & Audio">Music & Audio</SelectItem>
                    <SelectItem value="Programming & Tech">Programming & Tech</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-high">Price High</SelectItem>
                    <SelectItem value="price-low">Price Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="orders">Most Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                All Services ({sortedServices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedServices.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No services found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedServices.map((service) => (
                        <TableRow key={service._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getServiceImage(service) ? (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  <Image
                                    src={getFullImageUrl(getServiceImage(service)!)}
                                    alt={service.title}
                                    fill
                                    className="rounded-lg object-cover"
                                    onError={(e) => {
                                      // Hide the image and show fallback
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        const fallback = parent.querySelector('.image-fallback') as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                        e.currentTarget.style.display = 'none';
                                      }
                                    }}
                                  />
                                  <div className="image-fallback w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center hidden">
                                    <Briefcase className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Briefcase className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{service.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {service.description}
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
                            <div className="font-medium">{service.category}</div>
                            {service.subcategory && (
                              <div className="text-sm text-gray-500">{service.subcategory}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${getMinPrice(service.packages)} - ${getMaxPrice(service.packages)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{service.rating}</span>
                              <span className="text-sm text-gray-500">({service.reviewCount})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{service.orderCount}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(service.approvalStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(service.createdAt).toLocaleDateString()}</div>
                              <div className="text-gray-500">
                                {new Date(service.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/marketplace/service/${service._id}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(service._id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Service
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this service? This action cannot be undone.
                All associated data including orders, reviews, and files will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </ErrorBoundary>
    </Protected>
  );
}