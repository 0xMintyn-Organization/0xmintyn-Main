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
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Star,
  DollarSign,
  Users,
  Download,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import Protected from '@/hooks/useProtected';

interface Product {
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
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  isFeatured: boolean;
  fileSize?: string;
  fileFormat?: string;
  createdAt: string;
}

export default function AdminProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      setProducts([
        {
          _id: '1',
          title: 'Premium UI Kit - Modern Design',
          description: 'Complete UI kit with 50+ components for modern web applications',
          category: 'Design',
          subcategory: 'UI Kits',
          thumbnailImage: '/placeholder-product.jpg',
          sellerId: {
            _id: 'seller1',
            sellerName: 'John Doe',
            storeName: 'Creative Designs Co.'
          },
          price: 49,
          originalPrice: 99,
          discount: 50,
          rating: 4.8,
          reviewCount: 156,
          purchaseCount: 89,
          viewCount: 1250,
          downloadCount: 89,
          isActive: true,
          isApproved: true,
          approvalStatus: 'Approved',
          isFeatured: true,
          fileSize: '25.6 MB',
          fileFormat: 'Figma, Sketch',
          createdAt: '2024-01-15'
        },
        {
          _id: '2',
          title: 'Website Template - Business Pro',
          description: 'Responsive HTML template perfect for business websites',
          category: 'Web Templates',
          subcategory: 'HTML Templates',
          thumbnailImage: '/placeholder-product.jpg',
          sellerId: {
            _id: 'seller2',
            sellerName: 'Jane Smith',
            storeName: 'Tech Solutions Pro'
          },
          price: 79,
          rating: 4.6,
          reviewCount: 89,
          purchaseCount: 67,
          viewCount: 890,
          downloadCount: 67,
          isActive: true,
          isApproved: true,
          approvalStatus: 'Approved',
          isFeatured: false,
          fileSize: '15.2 MB',
          fileFormat: 'HTML, CSS, JS',
          createdAt: '2024-02-20'
        },
        {
          _id: '3',
          title: 'Digital Marketing Checklist',
          description: 'Comprehensive checklist for digital marketing campaigns',
          category: 'Business',
          subcategory: 'Marketing',
          thumbnailImage: '/placeholder-product.jpg',
          sellerId: {
            _id: 'seller3',
            sellerName: 'Mike Johnson',
            storeName: 'Digital Marketing Hub'
          },
          price: 19,
          rating: 4.2,
          reviewCount: 23,
          purchaseCount: 12,
          viewCount: 340,
          downloadCount: 12,
          isActive: true,
          isApproved: false,
          approvalStatus: 'Pending',
          fileSize: '2.1 MB',
          fileFormat: 'PDF',
          createdAt: '2024-03-10'
        },
        {
          _id: '4',
          title: 'Content Writing Templates Pack',
          description: '50+ professional content writing templates for all purposes',
          category: 'Writing',
          subcategory: 'Templates',
          thumbnailImage: '/placeholder-product.jpg',
          sellerId: {
            _id: 'seller4',
            sellerName: 'Sarah Wilson',
            storeName: 'Content Creation Studio'
          },
          price: 29,
          originalPrice: 59,
          discount: 50,
          rating: 4.9,
          reviewCount: 234,
          purchaseCount: 145,
          viewCount: 2100,
          downloadCount: 145,
          isActive: false,
          isApproved: false,
          approvalStatus: 'Rejected',
          rejectionReason: 'Copyright infringement concerns',
          fileSize: '8.7 MB',
          fileFormat: 'Word, PDF',
          createdAt: '2023-11-05'
        }
      ]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sellerId.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && product.approvalStatus === 'Pending') ||
      (statusFilter === 'approved' && product.approvalStatus === 'Approved') ||
      (statusFilter === 'rejected' && product.approvalStatus === 'Rejected') ||
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleApproveProduct = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product._id === productId 
        ? { ...product, approvalStatus: 'Approved', isApproved: true, isActive: true }
        : product
    ));
  };

  const handleRejectProduct = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product._id === productId 
        ? { ...product, approvalStatus: 'Rejected', isApproved: false, isActive: false }
        : product
    ));
  };

  const handleToggleActive = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product._id === productId 
        ? { ...product, isActive: !product.isActive }
        : product
    ));
  };

  const handleToggleFeatured = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product._id === productId 
        ? { ...product, isFeatured: !product.isFeatured }
        : product
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
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
                  Products Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and moderate all marketplace products
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchProducts}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Package className="w-4 h-4 mr-2" />
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
                      placeholder="Search products by title, description, or seller..."
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
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Web Templates">Web Templates</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Writing">Writing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="purchases">Most Purchases</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Products ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                    No products found
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
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Purchases</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                <Image
                                  src={product.thumbnailImage}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{product.title}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {product.isFeatured && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">Featured</Badge>
                                  )}
                                  {product.discount && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">{product.discount}% OFF</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.sellerId.sellerName}</div>
                              <div className="text-sm text-gray-500">{product.sellerId.storeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{product.category}</div>
                            <div className="text-xs text-gray-500">{product.subcategory}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(product.price)}</div>
                            {product.originalPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{product.rating.toFixed(1)}</span>
                              <span className="text-sm text-gray-500">({product.reviewCount})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{product.purchaseCount}</div>
                            <div className="text-xs text-gray-500">{product.viewCount} views</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{product.downloadCount}</div>
                            {product.fileSize && (
                              <div className="text-xs text-gray-500">{product.fileSize}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(product.approvalStatus, product.isActive)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(product.createdAt).toLocaleDateString()}
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
                                  <Download className="mr-2 h-4 w-4" />
                                  Download File
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {product.approvalStatus === 'Pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleApproveProduct(product._id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRejectProduct(product._id)}>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => handleToggleActive(product._id)}>
                                  {product.isActive ? (
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
                                <DropdownMenuItem onClick={() => handleToggleFeatured(product._id)}>
                                  {product.isFeatured ? (
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

