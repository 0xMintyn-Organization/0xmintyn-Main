'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProposalDetails from '@/components/Governance/ProposalDetails';
import RoleProtected from '@/components/RoleProtected';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Protected from '@/hooks/useProtected';
import axiosInstance from '@/utils/axiosInstance';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  Search,
  Settings,
  Trash2,
  Vote,
  XCircle
} from 'lucide-react';
import Spinner from '@/components/Spinner';

interface Proposal {
  _id: string;
  title: string;
  category: string;
  proposerName: string;
  proposerWallet: string;
  proposerId: string;
  summary: string;
  detailedDescription: string;
  expectedImpact: string;
  implementationPlan: string;
  timeline: {
    startDate: string;
    endDate: string;
    milestones: string[];
  };
  resourcesNeeded: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  votingOptions: {
    yes: number;
    no: number;
    abstain: number;
  };
  totalVotes: number;
  status: 'Draft' | 'Active' | 'Passed' | 'Rejected' | 'Expired';
  startDate: string;
  endDate: string;
  proposalFee: number;
  isPaid: boolean;
  requiredVotes: number;
  quorum: number;
  blockchainAddress?: string;
  blockchainTx?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  rejectedProposals: number;
  statusStats: Record<string, number>;
  categoryStats: Record<string, number>;
}

function AdminGovernancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<GovernanceStats>({
    totalProposals: 0,
    activeProposals: 0,
    passedProposals: 0,
    rejectedProposals: 0,
    statusStats: {},
    categoryStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    adminNotes: ''
  });
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    status: 'Active',
    category: 'all',
    search: '',
    sortBy: 'totalVotes',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch governance data
  const fetchGovernanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all proposals with filters
      const proposalsResponse = await axiosInstance.get('/proposal/all', {
        params: {
          status: filters.status === 'all' ? undefined : filters.status,
          category: filters.category === 'all' ? undefined : filters.category,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: currentPage,
          limit: itemsPerPage
        }
      });

      // Fetch governance stats
      const statsResponse = await axiosInstance.get('/proposal/stats');

      const proposalsList = proposalsResponse.data.data.proposals || [];
      console.log('📋 Fetched proposals:', proposalsList.length, 'proposals');
      if (proposalsList.length > 0) {
        console.log('📋 First proposal blockchain fields:', {
          id: proposalsList[0]._id,
          blockchainAddress: proposalsList[0].blockchainAddress,
          blockchainTx: proposalsList[0].blockchainTx
        });
      }
      setProposals(proposalsList);
      setStats(statsResponse.data.data);
      setTotalPages(proposalsResponse.data.data.pagination.pages);

    } catch (error: unknown) {
      console.error('Error fetching governance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load governance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchGovernanceData();
  }, [fetchGovernanceData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle status update - Backend handles blockchain transaction (no wallet needed!)
  const handleStatusUpdate = async () => {
    if (!selectedProposal || !statusUpdate.status) return;

    try {
      // Simple API call - backend handles everything including blockchain transaction
      await axiosInstance.patch(`/proposal/${selectedProposal._id}/status`, {
        status: statusUpdate.status,
        adminNotes: statusUpdate.adminNotes
      });

      if (statusUpdate.status === 'Passed' && selectedProposal.blockchainAddress) {
        toast({
          title: 'Success!',
          description: 'Proposal status updated and creator received 100 Mintyn tokens from treasury!',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Proposal status updated successfully',
        });
      }

      setShowStatusModal(false);
      setStatusUpdate({ status: '', adminNotes: '' });
      setSelectedProposal(null);
      fetchGovernanceData();
    } catch (error: unknown) {
      console.error('Error updating proposal status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update proposal status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Handle proposal deletion
  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      await axiosInstance.delete(`/proposal/${proposalId}`);
      toast({
        title: 'Success',
        description: 'Proposal deleted successfully',
      });
      fetchGovernanceData();
    } catch (error: unknown) {
      console.error('Error deleting proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete proposal',
        variant: 'destructive'
      });
    }
  };

  // Get filtered proposals
  const getFilteredProposals = () => {
    return proposals.sort((a, b) => {
      if (filters.sortBy === 'totalVotes') {
        return filters.sortOrder === 'desc' ? b.totalVotes - a.totalVotes : a.totalVotes - b.totalVotes;
      }
      if (filters.sortBy === 'createdAt') {
        return filters.sortOrder === 'desc' 
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });
  };

  // Calculate vote percentage
  const getVotePercentage = (proposal: Proposal, voteType: 'yes' | 'no' | 'abstain') => {
    if (proposal.totalVotes === 0) return 0;
    return Math.round((proposal.votingOptions[voteType] / proposal.totalVotes) * 100);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Passed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Platform Upgrade': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Policy Change': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Treasury Allocation': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'UBI Distribution': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'AI/Tech Development': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'Community Engagement': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category] || colors['Other'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <Protected>
      <RoleProtected allowedRoles={['admin']}>
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-zinc-600 bg-clip-text text-transparent">
              Governance Management
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage community proposals, monitor voting activity, and oversee the governance process.
            </p>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500 bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">Total Proposals</p>
                    <p className="text-2xl font-bold text-white">{stats.totalProposals}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-900 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">Active Proposals</p>
                    <p className="text-2xl font-bold text-green-400">{stats.activeProposals}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-900 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">Passed Proposals</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.passedProposals}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">Rejected Proposals</p>
                    <p className="text-2xl font-bold text-red-400">{stats.rejectedProposals}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-900 rounded-full flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
              <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="proposals" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                All Proposals
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Proposal Status Distribution</CardTitle>
                    <CardDescription className="text-slate-400">
                      Current status of all proposals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.statusStats).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(status)}>
                              {status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{count}</span>
                            <div className="w-20 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(count / stats.totalProposals) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Category Distribution</CardTitle>
                    <CardDescription className="text-slate-400">
                      Proposals by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.categoryStats).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(category)}>
                              {category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{count}</span>
                            <div className="w-20 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${(count / stats.totalProposals) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Proposals</CardTitle>
                  <CardDescription className="text-slate-400">
                    Latest proposals requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proposals.slice(0, 5).length > 0 ? (
                    <div className="space-y-4">
                      {proposals.slice(0, 5).map((proposal) => (
                        <div key={proposal._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{proposal.title}</h4>
                            <p className="text-sm text-slate-400">{proposal.proposerName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {proposal.totalVotes} votes
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No proposals yet</h3>
                      <p className="text-slate-400">No proposals have been created yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Proposals Tab */}
            <TabsContent value="proposals" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    All Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search proposals..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Active">Active (Default)</SelectItem>
                        <SelectItem value="Passed">Passed</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="all">All Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Platform Upgrade">Platform Upgrade</SelectItem>
                        <SelectItem value="Policy Change">Policy Change</SelectItem>
                        <SelectItem value="Treasury Allocation">Treasury Allocation</SelectItem>
                        <SelectItem value="UBI Distribution">UBI Distribution</SelectItem>
                        <SelectItem value="AI/Tech Development">AI/Tech Development</SelectItem>
                        <SelectItem value="Community Engagement">Community Engagement</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="totalVotes">Most Votes</SelectItem>
                        <SelectItem value="createdAt">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Proposals Table */}
                  {getFilteredProposals().length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredProposals().map((proposal) => (
                        <Card key={proposal._id} className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white text-lg">{proposal.title}</h3>
                                  <p className="text-slate-300 mt-1 line-clamp-2">{proposal.summary}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getCategoryColor(proposal.category)}>
                                    {proposal.category}
                                  </Badge>
                                  <Badge className={getStatusColor(proposal.status)}>
                                    {proposal.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Voting Progress */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-green-400 font-medium">
                                    Yes: {getVotePercentage(proposal, 'yes')}% ({proposal.votingOptions.yes})
                                  </span>
                                  <span className="text-red-400 font-medium">
                                    No: {getVotePercentage(proposal, 'no')}% ({proposal.votingOptions.no})
                                  </span>
                                  <span className="text-gray-400 font-medium">
                                    Abstain: {getVotePercentage(proposal, 'abstain')}% ({proposal.votingOptions.abstain})
                                  </span>
                                </div>
                                <Progress 
                                  value={getVotePercentage(proposal, 'yes')} 
                                  className="h-2"
                                />
                              </div>

                              {/* Proposal Info */}
                              <div className="flex items-center justify-between text-sm text-slate-400">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-xs">
                                        {proposal.proposerName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{proposal.proposerName}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>{proposal.totalVotes} total votes</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedProposal(proposal)}
                                      className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">{proposal.title}</DialogTitle>
                                      <DialogDescription className="text-slate-400">
                                        {proposal.summary}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <ProposalDetails 
                                      proposal={proposal} 
                                      userVote={undefined}
                                      onVote={() => {}}
                                      voting={false}
                                      isProposer={false}
                                    />
                                  </DialogContent>
                                </Dialog>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    // Use proposal from list directly (it should have blockchainAddress from the fetch)
                                    // The proposals list is already fetched with all fields including blockchainAddress
                                    console.log('📋 Using proposal from list:', {
                                      id: proposal._id,
                                      blockchainAddress: proposal.blockchainAddress,
                                      blockchainTx: proposal.blockchainTx,
                                      hasBlockchainAddress: !!proposal.blockchainAddress
                                    });
                                    
                                    setSelectedProposal(proposal);
                                    setStatusUpdate({ status: proposal.status, adminNotes: proposal.adminNotes || '' });
                                    setShowStatusModal(true);
                                  }}
                                  className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Update Status
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProposal(proposal._id)}
                                  className="bg-red-600 border-red-500 text-white hover:bg-red-500"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Vote className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No proposals found</h3>
                      <p className="text-slate-400">
                        {filters.search || filters.category !== 'all' || filters.status !== 'Active' 
                          ? 'Try adjusting your filters to see more proposals.'
                          : 'No proposals have been created yet.'}
                      </p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-slate-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Governance Settings
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure governance parameters and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Default Required Votes</label>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue="100"
                      />
                      <p className="text-xs text-slate-400">Minimum votes required for a proposal to pass</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Default Quorum</label>
                      <Input 
                        type="number" 
                        placeholder="65" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue="65"
                      />
                      <p className="text-xs text-slate-400">Minimum percentage of yes votes required</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Proposal Fee (MNT)</label>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.1" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue="0.1"
                      />
                      <p className="text-xs text-slate-400">Fee required to create a proposal</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Voting Period (Days)</label>
                      <Input 
                        type="number" 
                        placeholder="7" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue="7"
                      />
                      <p className="text-xs text-slate-400">Default voting period duration</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Status Update Modal */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Update Proposal Status</DialogTitle>
              <DialogDescription className="text-slate-400">
                Change the status of this proposal and add admin notes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Status</label>
                <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Admin Notes</label>
                <Textarea
                  placeholder="Add notes about this status change..."
                  value={statusUpdate.adminNotes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </RoleProtected>
    </Protected>
  );
}

export default AdminGovernancePage;
