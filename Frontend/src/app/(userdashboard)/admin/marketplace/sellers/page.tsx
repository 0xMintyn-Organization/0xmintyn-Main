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
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  MessageSquare,
  Settings
} from 'lucide-react';
import Protected from '@/hooks/useProtected';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface Seller {
  _id: string;
  sellerName: string;
  storeName: string;
  contactEmail: string;
  businessType: string;
  sellerLevel: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalEarnings: number;
  responseTime: string;
  responseRate: number;
  isActive: boolean;
  joinedDate: string;
  servicesCount: number;
  productsCount: number;
}

export default function AdminSellersManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/sellers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const sellersData = response.data.sellers || [];
        
        // Fetch products and services count for each seller
        const enrichedSellers = await Promise.all(
          sellersData.map(async (seller: any) => {
            try {
              const [productsRes, servicesRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/products`, {
                  params: { sellerId: seller._id },
                  withCredentials: true
                }).catch(() => ({ data: { products: [] } })),
                axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/services`, {
                  params: { sellerId: seller._id },
                  withCredentials: true
                }).catch(() => ({ data: { services: [] } }))
              ]);

              return {
                ...seller,
                servicesCount: servicesRes.data.services?.length || 0,
                productsCount: productsRes.data.products?.length || 0
              };
            } catch {
              return {
                ...seller,
                servicesCount: 0,
                productsCount: 0
              };
            }
          })
        );

        setSellers(enrichedSellers);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = 
      seller.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && seller.isActive) ||
      (statusFilter === 'inactive' && !seller.isActive);
    
    const matchesLevel = levelFilter === 'all' || seller.sellerLevel === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Top Rated':
        return <Badge className="bg-purple-100 text-purple-800">Top Rated</Badge>;
      case 'Pro':
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>;
      case 'Level 1':
        return <Badge className="bg-green-100 text-green-800">Level 1</Badge>;
      case 'New Seller':
        return <Badge className="bg-gray-100 text-gray-800">New Seller</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleToggleStatus = (sellerId: string) => {
    setSellers(prev => prev.map(seller => 
      seller._id === sellerId 
        ? { ...seller, isActive: !seller.isActive }
        : seller
    ));
  };

  const handleVerifySeller = (sellerId: string) => {
    setSellers(prev => prev.map(seller => 
      seller._id === sellerId 
        ? { ...seller, verified: !seller.verified }
        : seller
    ));
  };

  const handleDeleteClick = (sellerId: string) => {
    setSellerToDelete(sellerId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sellerToDelete) return;

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/'}marketplace/sellers/profile/${sellerToDelete}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Seller deleted successfully');
        setSellers(prev => prev.filter(s => s._id !== sellerToDelete));
      }
    } catch (error: any) {
      console.error('Error deleting seller:', error);
      toast.error(error.response?.data?.message || 'Failed to delete seller');
    } finally {
      setDeleteDialogOpen(false);
      setSellerToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sellers...</p>
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
                  Sellers Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and monitor all marketplace sellers
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchSellers}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Users className="w-4 h-4 mr-2" />
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
                      placeholder="Search sellers by name, store, or email..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Top Rated">Top Rated</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Level 1">Level 1</SelectItem>
                    <SelectItem value="New Seller">New Seller</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="sales">Most Sales</SelectItem>
                    <SelectItem value="earnings">Highest Earnings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sellers Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Sellers ({filteredSellers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSellers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                    No sellers found
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
                        <TableHead>Seller</TableHead>
                        <TableHead>Business Type</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSellers.map((seller) => (
                        <TableRow key={seller._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <TableCell>
                            <div>
                              <div className="font-medium">{seller.sellerName}</div>
                              <div className="text-sm text-gray-500">{seller.storeName}</div>
                              <div className="text-xs text-gray-400">{seller.contactEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{seller.businessType}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getLevelBadge(seller.sellerLevel)}
                              {seller.verified && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{seller.rating.toFixed(1)}</span>
                              <span className="text-sm text-gray-500">({seller.reviewCount})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{seller.totalSales}</div>
                            <div className="text-xs text-gray-500">
                              {seller.servicesCount} services, {seller.productsCount} products
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(seller.totalEarnings)}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(seller.isActive)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(seller.joinedDate).toLocaleDateString()}
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
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Package className="mr-2 h-4 w-4" />
                                  View Services
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  View Messages
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleStatus(seller._id)}>
                                  {seller.isActive ? (
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
                                <DropdownMenuItem onClick={() => handleVerifySeller(seller._id)}>
                                  {seller.verified ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Unverify
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Verify
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteClick(seller._id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Seller
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
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the seller profile
                and remove all associated data from our servers.
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
    </Protected>
  );
}

