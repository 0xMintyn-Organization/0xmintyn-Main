'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Minus,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Download
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

interface ProposalDetailsProps {
  proposal: Proposal;
  userVote?: string;
  onVote: (proposalId: string, vote: 'yes' | 'no' | 'abstain') => void;
  voting?: boolean;
  isProposer?: boolean;
}

const ProposalDetails: React.FC<ProposalDetailsProps> = ({
  proposal,
  userVote,
  onVote,
  voting = false,
  isProposer = false
}) => {
  // Calculate vote percentages
  const getVotePercentage = (voteType: 'yes' | 'no' | 'abstain') => {
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

  // Check if voting is still open
  const isVotingOpen = () => {
    const now = new Date();
    const startDate = new Date(proposal.startDate);
    const endDate = new Date(proposal.endDate);
    return proposal.status === 'Active' && now >= startDate && now <= endDate;
  };

  // Get attachment icon
  const getAttachmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'image': return <FileText className="h-4 w-4" />;
      case 'link': return <ExternalLink className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{proposal.title}</h1>
            <p className="text-muted-foreground text-lg">{proposal.summary}</p>
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

        {/* Proposer Info */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {proposal.proposerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{proposal.proposerName}</p>
            <p className="text-sm text-muted-foreground">
              {proposal.proposerWallet}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Proposed</p>
            <p className="text-sm font-medium">
              {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {proposal.status === 'Active' && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Voting Status
            </CardTitle>
            <CardDescription>
              {isVotingOpen() 
                ? `Voting is open until ${format(new Date(proposal.endDate), 'PPP')}`
                : 'Voting period has ended'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vote Progress */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {proposal.votingOptions.yes}
                  </div>
                  <div className="text-sm text-muted-foreground">Yes ({getVotePercentage('yes')}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {proposal.votingOptions.no}
                  </div>
                  <div className="text-sm text-muted-foreground">No ({getVotePercentage('no')}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {proposal.votingOptions.abstain}
                  </div>
                  <div className="text-sm text-muted-foreground">Abstain ({getVotePercentage('abstain')}%)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yes votes</span>
                  <span>{getVotePercentage('yes')}%</span>
                </div>
                <Progress value={getVotePercentage('yes')} className="h-3" />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Total votes: {proposal.totalVotes} • Required: {proposal.requiredVotes} • Quorum: {proposal.quorum}%
              </div>
            </div>

            {/* Voting Buttons */}
            {isVotingOpen() && !isProposer && (
              <div className="space-y-3">
                <p className="font-medium">Your Vote:</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={userVote === 'yes' ? 'default' : 'outline'}
                    onClick={() => onVote(proposal._id, 'yes')}
                    disabled={voting}
                    className="flex items-center gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant={userVote === 'no' ? 'default' : 'outline'}
                    onClick={() => onVote(proposal._id, 'no')}
                    disabled={voting}
                    className="flex items-center gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </Button>
                  <Button
                    variant={userVote === 'abstain' ? 'default' : 'outline'}
                    onClick={() => onVote(proposal._id, 'abstain')}
                    disabled={voting}
                    className="flex items-center gap-2"
                  >
                    <Minus className="h-4 w-4" />
                    Abstain
                  </Button>
                </div>
                {userVote && (
                  <p className="text-sm text-muted-foreground text-center">
                    You voted: <span className="font-medium capitalize">{userVote}</span>
                  </p>
                )}
              </div>
            )}

            {isProposer && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  You cannot vote on your own proposal
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{proposal.detailedDescription}</p>
          </div>
        </CardContent>
      </Card>

      {/* Expected Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Expected Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{proposal.expectedImpact}</p>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Implementation Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{proposal.implementationPlan}</p>
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Voting Period</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Start:</span> {format(new Date(proposal.startDate), 'PPP')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">End:</span> {format(new Date(proposal.endDate), 'PPP')}
                </p>
              </div>
            </div>

            {proposal.timeline.milestones && proposal.timeline.milestones.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Implementation Milestones:</p>
                <ul className="pl-4 space-y-1">
                  {proposal.timeline.milestones.map((milestone, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Resources Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{proposal.resourcesNeeded}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      {proposal.attachments && proposal.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proposal.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="text-muted-foreground">
                    {getAttachmentIcon(attachment.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{attachment.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{attachment.type}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Metadata */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Proposal Fee</p>
              <p className="font-medium">{proposal.proposalFee} MNT</p>
            </div>
            <div>
              <p className="text-muted-foreground">Required Votes</p>
              <p className="font-medium">{proposal.requiredVotes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quorum</p>
              <p className="font-medium">{proposal.quorum}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {format(new Date(proposal.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalDetails;
