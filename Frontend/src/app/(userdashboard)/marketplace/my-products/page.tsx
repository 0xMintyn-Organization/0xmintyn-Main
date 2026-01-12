'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Eye, Edit, Trash2, Search, Package, Coins, Star, 
  TrendingUp, Download, ChevronLeft, ChevronRight, MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function MyProductsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(9);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data for demonstration
      setProducts([
        {
          id: 1,
          title: 'React Dashboard Template',
          category: 'Web Templates',
          price: 49.99,
          status: 'Active',
          sales: 127,
          views: 2340,
          rating: 4.8,
          reviews: 89,
          thumbnailImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
          downloads: 127,
          fileSize: '15 MB'
        },
        {
          id: 2,
          title: 'E-commerce UI Kit',
          category: 'UI Kits',
          price: 29.99,
          status: 'Active',
          sales: 93,
          views: 1890,
          rating: 4.7,
          reviews: 64,
          thumbnailImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop',
          downloads: 93,
          fileSize: '8 MB'
        },
        {
          id: 3,
          title: 'Mobile App Template',
          category: 'Mobile Templates',
          price: 79.99,
          status: 'Active',
          sales: 56,
          views: 1250,
          rating: 4.9,
          reviews: 43,
          thumbnailImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop',
          downloads: 56,
          fileSize: '25 MB'
        },
        {
          id: 4,
          title: 'Icon Pack - 500 Icons',
          category: 'Graphics',
          price: 19.99,
          status: 'Active',
          sales: 234,
          views: 3450,
          rating: 4.6,
          reviews: 156,
          thumbnailImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=300&h=200&fit=crop',
          downloads: 234,
          fileSize: '5 MB'
        },
        {
          id: 5,
          title: 'WordPress Theme',
          category: 'Web Templates',
          price: 59.99,
          status: 'Paused',
          sales: 45,
          views: 890,
          rating: 4.5,
          reviews: 32,
          thumbnailImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=300&h=200&fit=crop',
          downloads: 45,
          fileSize: '12 MB'
        }
      ]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Paginate products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your digital product listings
          </p>
        </div>
        <Link href="/marketplace/create-product">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.sales, 0)}</p>
              </div>
              <Download className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</p>
                <p className="text-2xl font-bold">
                  {(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.views, 0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by title or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredProducts.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Showing {indexOfFirstProduct + 1} - {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
            </p>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      {currentProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by creating your first product'}
            </p>
            <Link href="/marketplace/create-product">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative w-full h-48">
                    <Image
                      src={product.thumbnailImage}
                      alt={product.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusColor(product.status)}>
                        {product.status}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {product.title}
                    </h3>
                    <Badge variant="outline" className="text-xs mb-3">
                      {product.category}
                    </Badge>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Price</p>
                        <p className="font-semibold text-green-600">{product.price} 0XM</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Sales</p>
                        <p className="font-semibold">{product.sales}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Views</p>
                        <p className="font-semibold">{product.views}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="font-semibold text-sm">{product.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/marketplace/products/${product.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/marketplace/edit-product/${product.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

