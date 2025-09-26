"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Plus,
  TrendingUp, 
  Clock, 
  Users, 
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Search,
  BarChart3,
  Gavel
} from 'lucide-react';

import { useBlockchain } from '@/contexts/BlockchainProvider';
import { useBlockchainStore } from '@/stores/blockchainStore';
import { blockchainService } from '@/services/blockchainService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import EnhancedProposalCard from './EnhancedProposalCard';
import CreateProposalModal from './CreateProposalModal';
import VotingModal from './VotingModal';
import DelegationModal from './DelegationModal';

interface GovernanceDashboardProps {
  className?: string;
}

// Mock data for proposals - in real app this would come from blockchain
const mockProposals = [
  {
    id: '1',
    title: 'Increase Monthly UBI Distribution',
    description: 'Proposal to increase the monthly UBI distribution from $1000 to $1200 to account for inflation.',
    status: 'active',
    type: 'parameter_change',
    proposer: 'ABC123...',
    created: Date.now() - 86400000 * 2, // 2 days ago
    endTime: Date.now() + 86400000 * 5, // 5 days from now
    votesFor: 12500000,
    votesAgainst: 3200000,
    totalVotes: 15700000,
    quorumRequired: 10000000,
    participationRate: 0.31,
    tags: ['UBI', 'Economics'],
  },
  {
    id: '2',
    title: 'Add Cross-Chain Bridge Support for Ethereum',
    description: 'Enable cross-chain functionality to allow MINTYN token holders to bridge their tokens to Ethereum network.',
    status: 'pending',
    type: 'technical_upgrade',
    proposer: 'DEF456...',
    created: Date.now() - 86400000, // 1 day ago
    endTime: Date.now() + 86400000 * 6, // 6 days from now
    votesFor: 8900000,
    votesAgainst: 1100000,
    totalVotes: 10000000,
    quorumRequired: 10000000,
    participationRate: 0.20,
    tags: ['Bridge', 'Technical'],
  },
  {
    id: '3',
    title: 'Update Fraud Detection Algorithm',
    description: 'Implement enhanced fraud detection mechanisms using machine learning to better identify suspicious activities.',
    status: 'executed',
    type: 'security_update',
    proposer: 'GHI789...',
    created: Date.now() - 86400000 * 10, // 10 days ago
    endTime: Date.now() - 86400000 * 3, // 3 days ago
    votesFor: 18500000,
    votesAgainst: 2300000,
    totalVotes: 20800000,
    quorumRequired: 10000000,
    participationRate: 0.42,
    tags: ['Security', 'AI'],
  },
];

const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({ className }) => {
  const { publicKey, connected } = useWallet();
  const { isConnected, tokenBalance } = useBlockchain();
  const {
    proposals,
    userVotes,
    votingPower,
    setProposals,
    setUserVotes,
    setVotingPower,
  } = useBlockchainStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // For demo purposes, use mock data
  useEffect(() => {
    if (isConnected) {
      setProposals(mockProposals);
      setVotingPower(tokenBalance);
    }
  }, [isConnected, tokenBalance, setProposals, setVotingPower]);

  // Filter proposals based on search and filters
  const filteredProposals = mockProposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesType = typeFilter === 'all' || proposal.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate governance stats
  const stats = {
    totalProposals: mockProposals.length,
    activeProposals: mockProposals.filter(p => p.status === 'active').length,
    executedProposals: mockProposals.filter(p => p.status === 'executed').length,
    averageParticipation: mockProposals.reduce((acc, p) => acc + p.participationRate, 0) / mockProposals.length,
  };

  // Handle voting
  const handleVote = (proposal: any) => {
    setSelectedProposal(proposal);
    setShowVotingModal(true);
  };

  if (!connected) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Vote className="h-6 w-6" />
              Governance Dashboard
            </CardTitle>
            <CardDescription>
              Connect your wallet to participate in governance
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <WalletMultiButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Governance</h1>
          <p className="text-muted-foreground">
            Participate in platform governance and decision-making
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDelegationModal(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Delegation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Voting Power</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{votingPower.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              MINTYN tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProposals}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProposals}</div>
            <p className="text-xs text-muted-foreground">
              Currently voting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Participation</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageParticipation * 100)}%</div>
            <p className="text-xs text-muted-foreground">
              Voter turnout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="defeated">Defeated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="parameter_change">Parameter Change</SelectItem>
                <SelectItem value="technical_upgrade">Technical Upgrade</SelectItem>
                <SelectItem value="security_update">Security Update</SelectItem>
                <SelectItem value="treasury">Treasury</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Proposals */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Proposals</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="my-votes">My Votes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or create a new proposal.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <EnhancedProposalCard
                key={proposal.id}
                proposal={proposal}
                onVote={() => handleVote(proposal)}
                userVotingPower={votingPower}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filteredProposals.filter(p => p.status === 'active').map((proposal) => (
            <EnhancedProposalCard
              key={proposal.id}
              proposal={proposal}
              onVote={() => handleVote(proposal)}
              userVotingPower={votingPower}
            />
          ))}
        </TabsContent>

        <TabsContent value="my-votes" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your Voting History</h3>
              <p className="text-muted-foreground">
                Your voting history will appear here once you participate in governance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <VotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        proposal={selectedProposal}
      />

      <DelegationModal
        isOpen={showDelegationModal}
        onClose={() => setShowDelegationModal(false)}
      />
    </div>
  );
};

export default GovernanceDashboard;
