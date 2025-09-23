'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/utils/axiosInstance';
import { formatDistanceToNow } from 'date-fns';
import { 
  Vote, 
  Plus, 
  Eye, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  BarChart3,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import Protected from '@/hooks/useProtected';
import ProposalForm from '@/components/Governance/ProposalForm';
import ProposalDetails from '@/components/Governance/ProposalDetails';
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
  createdAt: string;
  updatedAt: string;
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  rejectedProposals: number;
}

interface UserVote {
    _id: string;
  proposalId: string;
  vote: 'yes' | 'no' | 'abstain';
    createdAt: string;
}

function GovernancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [topProposals, setTopProposals] = useState<Proposal[]>([]);
  const [userProposals, setUserProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<GovernanceStats>({
    totalProposals: 0,
    activeProposals: 0,
    passedProposals: 0,
    rejectedProposals: 0
  });
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    status: 'Active',
    category: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

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
          page: currentPage,
          limit: itemsPerPage
        }
      });

      // Fetch top proposals
      const topProposalsResponse = await axiosInstance.get('/proposal/top', {
        params: { limit: 5 }
      });

      // Fetch governance stats
      const statsResponse = await axiosInstance.get('/proposal/stats');

      // Fetch user proposals if user is logged in
      let userProposalsData: Proposal[] = [];
      if (user?._id) {
        const userProposalsResponse = await axiosInstance.get(`/proposal/user/${user._id}`);
        userProposalsData = userProposalsResponse.data.data.proposals;
      }

      setProposals(proposalsResponse.data.data.proposals);
      setTopProposals(topProposalsResponse.data.data);
      setStats(statsResponse.data.data);
      setUserProposals(userProposalsData);
      setTotalPages(proposalsResponse.data.data.pagination.pages);

      // Fetch user votes for all proposals
      if (user?._id) {
        const votesResponse = await axiosInstance.get(`/vote/user/${user._id}`);
        const votes: UserVote[] = votesResponse.data.data.votes;
        const votesMap: Record<string, string> = {};
        votes.forEach(vote => {
          votesMap[vote.proposalId] = vote.vote;
        });
      setUserVotes(votesMap);
      }

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
  }, [currentPage, filters, user?._id, toast]);

  useEffect(() => {
      fetchGovernanceData();
  }, [fetchGovernanceData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle voting
  const handleVote = async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    try {
      setVoting(proposalId);
      
      // Check if user has already voted on this proposal
      const hasVoted = userVotes[proposalId];
      
      if (hasVoted) {
        // User has already voted, use update endpoint
        await axiosInstance.put(`/vote/${proposalId}`, { vote });
        toast({
          title: 'Success',
          description: 'Your vote has been updated successfully',
        });
      } else {
        // User hasn't voted yet, use create endpoint
        await axiosInstance.post(`/vote/${proposalId}`, { vote });
        toast({
          title: 'Success',
          description: 'Your vote has been cast successfully',
        });
      }
      
      // Update local state
      setUserVotes(prev => ({ ...prev, [proposalId]: vote }));
      
      // Refresh data
      fetchGovernanceData();
    } catch (error: unknown) {
      console.error('Error voting:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cast vote';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setVoting(null);
    }
  };

  // Handle proposal creation
  const handleCreateProposal = async (proposalData: unknown) => {
    try {
      await axiosInstance.post('/proposal/create', proposalData);
      toast({
        title: 'Success',
        description: 'Proposal created successfully and is now active for voting!',
      });
      fetchGovernanceData();
    } catch (error: unknown) {
      console.error('Error creating proposal:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create proposal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Get filtered proposals for display
  const getFilteredProposals = () => {
    return proposals.sort((a, b) => {
      // Prioritize active proposals with most votes
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (b.status === 'Active' && a.status !== 'Active') return 1;
      return b.totalVotes - a.totalVotes;
    });
  };

  // Get paginated proposals
  const getPaginatedProposals = () => {
    const filtered = getFilteredProposals();
    return filtered;
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
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            0xMintyn Governance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participate in decentralized decision-making and shape the future of our platform through community-driven proposals and voting.
          </p>
                    </div>

        {/* Main Tabs */}
        <Tabs defaultValue="proposals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proposals" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              <span>Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="my-proposals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>My Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Proposal</span>
            </TabsTrigger>
          </TabsList>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                      <p className="text-2xl font-bold">{stats.totalProposals}</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Active Proposals</p>
                      <p className="text-2xl font-bold">{stats.activeProposals}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Passed Proposals</p>
                      <p className="text-2xl font-bold">{stats.passedProposals}</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Rejected Proposals</p>
                      <p className="text-2xl font-bold">{stats.rejectedProposals}</p>
                    </div>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Proposals Section */}
            {topProposals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Proposals
                  </CardTitle>
                  <CardDescription>
                    Most voted proposals currently active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topProposals.slice(0, 3).map((proposal) => (
                      <Card key={proposal._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-sm line-clamp-2">{proposal.title}</h3>
                              <Badge className={getStatusColor(proposal.status)}>
                                {proposal.status}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {proposal.summary}
                            </p>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Yes: {getVotePercentage(proposal, 'yes')}%</span>
                                <span>No: {getVotePercentage(proposal, 'no')}%</span>
                              </div>
                              <Progress 
                                value={getVotePercentage(proposal, 'yes')} 
                                className="h-2"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {proposal.totalVotes} votes
                              </span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedProposal(proposal)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{proposal.title}</DialogTitle>
                                    <DialogDescription>
                                      {proposal.summary}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ProposalDetails 
                                    proposal={proposal} 
                                    userVote={userVotes[proposal._id]}
                                    onVote={handleVote}
                                    voting={voting === proposal._id}
                                    isProposer={proposal.proposerId === user?._id}
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  All Proposals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search proposals..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active (Default)</SelectItem>
                      <SelectItem value="Passed">Passed</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="all">All Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>

                {/* Proposals Grid */}
                {getPaginatedProposals().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getPaginatedProposals().map((proposal) => (
                      <Card key={proposal._id} className="hover:shadow-lg transition-all duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">{proposal.title}</CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {proposal.summary}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getCategoryColor(proposal.category)}>
                              {proposal.category}
                            </Badge>
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Voting Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 font-medium">
                                Yes: {getVotePercentage(proposal, 'yes')}%
                              </span>
                              <span className="text-red-600 font-medium">
                                No: {getVotePercentage(proposal, 'no')}%
                              </span>
                            </div>
                            <Progress 
                              value={getVotePercentage(proposal, 'yes')} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{proposal.votingOptions.yes} votes</span>
                              <span>{proposal.votingOptions.no} votes</span>
                            </div>
                          </div>

                          {/* Voting Section */}
                          {proposal.status === 'Active' && proposal.proposerId !== user?._id && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Your Vote:</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={userVotes[proposal._id] === 'yes' ? 'default' : 'outline'}
                                  onClick={() => handleVote(proposal._id, 'yes')}
                                  disabled={voting === proposal._id}
                                  className="flex-1"
                                >
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  Yes
                                </Button>
                                <Button
                                  size="sm"
                                  variant={userVotes[proposal._id] === 'no' ? 'default' : 'outline'}
                                  onClick={() => handleVote(proposal._id, 'no')}
                                  disabled={voting === proposal._id}
                                  className="flex-1"
                                >
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                  No
                                </Button>
                                <Button
                                  size="sm"
                                  variant={userVotes[proposal._id] === 'abstain' ? 'default' : 'outline'}
                                  onClick={() => handleVote(proposal._id, 'abstain')}
                                  disabled={voting === proposal._id}
                                  className="flex-1"
                                >
                                  <Minus className="h-3 w-3 mr-1" />
                                  Abstain
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Proposal Info */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {proposal.proposerName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{proposal.proposerName}</span>
                            </div>
                            <span>{formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setSelectedProposal(proposal)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{proposal.title}</DialogTitle>
                                  <DialogDescription>
                                    {proposal.summary}
                                  </DialogDescription>
                                </DialogHeader>
                                <ProposalDetails 
                                  proposal={proposal} 
                                  userVote={userVotes[proposal._id]}
                                  onVote={handleVote}
                                  voting={voting === proposal._id}
                                  isProposer={proposal.proposerId === user?._id}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No proposals found</h3>
                    <p className="text-muted-foreground">
                      {filters.search || filters.category !== 'all' || filters.status !== 'Active' 
                        ? 'Try adjusting your filters to see more proposals.'
                        : 'Be the first to create a proposal for the community to vote on.'}
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
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                </CardContent>
            </Card>
          </TabsContent>

          {/* My Proposals Tab */}
          <TabsContent value="my-proposals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Proposals</CardTitle>
                <CardDescription>
                  View and manage your submitted proposals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userProposals.length > 0 ? (
                  <div className="space-y-4">
                    {userProposals.map((proposal) => (
                      <Card key={proposal._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{proposal.title}</h3>
                                <p className="text-muted-foreground mt-1">{proposal.summary}</p>
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
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Total Votes</p>
                                <p className="font-semibold">{proposal.totalVotes}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Yes Votes</p>
                                <p className="font-semibold text-green-600">{proposal.votingOptions.yes}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">No Votes</p>
                                <p className="font-semibold text-red-600">{proposal.votingOptions.no}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Abstain</p>
                                <p className="font-semibold text-gray-600">{proposal.votingOptions.abstain}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Created {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                              </span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{proposal.title}</DialogTitle>
                                    <DialogDescription>
                                      {proposal.summary}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ProposalDetails 
                                    proposal={proposal} 
                                    userVote={userVotes[proposal._id]}
                                    onVote={handleVote}
                                    voting={voting === proposal._id}
                                    isProposer={true}
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t created any proposals yet. Start by creating your first proposal.
                    </p>
                    <Button>
                    <Plus className="h-4 w-4 mr-2" />
                      Create Your First Proposal
                  </Button>
                  </div>
                )}
                </CardContent>
            </Card>
          </TabsContent>

          {/* Create Proposal Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Proposal</CardTitle>
                <CardDescription>
                  Submit a proposal for community voting. Your proposal will be immediately active and available for voting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProposalForm onSubmit={handleCreateProposal} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
        </Protected>
  );
}

export default GovernancePage;
