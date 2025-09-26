"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Timer,
  Gavel
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow, format } from 'date-fns';

interface EnhancedProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'pending' | 'executed' | 'defeated';
    type: string;
    proposer: string;
    created: number;
    endTime: number;
    votesFor: number;
    votesAgainst: number;
    totalVotes: number;
    quorumRequired: number;
    participationRate: number;
    tags: string[];
  };
  onVote: () => void;
  userVotingPower: number;
}

const EnhancedProposalCard: React.FC<EnhancedProposalCardProps> = ({
  proposal,
  onVote,
  userVotingPower
}) => {
  // Calculate percentages
  const forPercentage = proposal.totalVotes > 0 
    ? (proposal.votesFor / proposal.totalVotes) * 100 
    : 0;
  const againstPercentage = proposal.totalVotes > 0 
    ? (proposal.votesAgainst / proposal.totalVotes) * 100 
    : 0;
  const quorumPercentage = (proposal.totalVotes / proposal.quorumRequired) * 100;

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
      case 'executed':
        return { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' };
      case 'defeated':
        return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
      default:
        return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusStyle = getStatusStyle(proposal.status);

  // Check if proposal is still active
  const isActive = proposal.status === 'active' && proposal.endTime > Date.now();
  const timeLeft = formatDistanceToNow(proposal.endTime, { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
              <p className="text-muted-foreground text-sm mb-3">
                {proposal.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={statusStyle.color}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
                {proposal.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Proposal Meta Info */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Proposer</p>
                <p className="text-muted-foreground">{proposal.proposer}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {format(proposal.created, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Ends</p>
                <p className="text-muted-foreground">
                  {isActive ? timeLeft : 'Ended'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Participation</p>
                <p className="text-muted-foreground">
                  {Math.round(proposal.participationRate * 100)}%
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Voting Results */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Voting Results</span>
              <span className="text-sm text-muted-foreground">
                {proposal.totalVotes.toLocaleString()} votes cast
              </span>
            </div>

            {/* For Votes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>For</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{proposal.votesFor.toLocaleString()}</span>
                  <span className="text-muted-foreground">
                    ({Math.round(forPercentage)}%)
                  </span>
                </div>
              </div>
              <Progress value={forPercentage} className="h-2 bg-gray-200">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${forPercentage}%` }}
                />
              </Progress>
            </div>

            {/* Against Votes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Against</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{proposal.votesAgainst.toLocaleString()}</span>
                  <span className="text-muted-foreground">
                    ({Math.round(againstPercentage)}%)
                  </span>
                </div>
              </div>
              <Progress value={againstPercentage} className="h-2 bg-gray-200">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${againstPercentage}%` }}
                />
              </Progress>
            </div>

            {/* Quorum Progress */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center text-sm mb-2">
                <span>Quorum Progress</span>
                <span className="text-muted-foreground">
                  {proposal.totalVotes.toLocaleString()} / {proposal.quorumRequired.toLocaleString()}
                </span>
              </div>
              <Progress value={Math.min(quorumPercentage, 100)} className="h-2">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    quorumPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(quorumPercentage, 100)}%` }}
                />
              </Progress>
              <p className="text-xs text-muted-foreground mt-1">
                {quorumPercentage >= 100 ? '✓ Quorum met' : `${Math.round(quorumPercentage)}% of required quorum`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {isActive && userVotingPower > 0 && (
              <Button onClick={onVote} className="flex-1">
                <Gavel className="h-4 w-4 mr-2" />
                Vote
              </Button>
            )}
            
            <Button variant="outline" className="flex-1">
              View Details
            </Button>
            
            {!isActive && (
              <Button variant="outline" disabled className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Voting Ended
              </Button>
            )}
          </div>

          {/* Voting Power Notice */}
          {userVotingPower === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                You need MINTYN tokens to participate in voting. 
                Your voting power is based on your token balance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedProposalCard;
