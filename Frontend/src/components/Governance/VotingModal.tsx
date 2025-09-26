"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Vote, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Gavel,
  TrendingUp
} from 'lucide-react';

import { useBlockchain } from '@/contexts/BlockchainProvider';
import { blockchainService } from '@/services/blockchainService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'react-hot-toast';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
}

const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  proposal
}) => {
  const { publicKey } = useWallet();
  const { executeTransaction, tokenBalance } = useBlockchain();

  const [voteChoice, setVoteChoice] = useState<'for' | 'against' | null>(null);
  const [votingPower, setVotingPower] = useState([tokenBalance]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'vote' | 'processing' | 'success' | 'error'>('vote');

  // Calculate percentages if proposal exists
  const forPercentage = proposal ? 
    (proposal.votesFor / proposal.totalVotes) * 100 : 0;
  const againstPercentage = proposal ? 
    (proposal.votesAgainst / proposal.totalVotes) * 100 : 0;

  // Handle vote submission
  const handleVote = async () => {
    if (!publicKey || !voteChoice || !proposal) {
      setError('Please select a vote choice');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      // This would call the actual blockchain service
      // For demo purposes, we'll simulate the vote
      const response = await blockchainService.vote({
        proposalId: proposal.id,
        vote: voteChoice,
        votingPower: votingPower[0],
        voterPublicKey: publicKey.toString(),
      });

      // Simulate successful response
      const mockResponse = {
        success: true,
        data: {
          txHash: 'mock_transaction_hash_' + Date.now(),
        }
      };

      if (mockResponse.success) {
        setSuccess(mockResponse.data.txHash);
        setStep('success');
        toast.success('Vote cast successfully!');
      } else {
        throw new Error('Vote failed');
      }
    } catch (err: any) {
      console.error('Voting error:', err);
      setError(err.message || 'Failed to cast vote');
      setStep('error');
      toast.error(err.message || 'Vote failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setVoteChoice(null);
    setVotingPower([tokenBalance]);
    setError(null);
    setSuccess(null);
    setStep('vote');
    setIsLoading(false);
  };

  // Handle close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!proposal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Cast Vote
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'vote' && (
            <motion.div
              key="vote"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Proposal Summary */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{proposal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {proposal.description}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {proposal.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={proposal.status === 'active' ? 'default' : 'secondary'}>
                      {proposal.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Current Results */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">Current Results</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>For</span>
                      </div>
                      <div>
                        <span className="font-medium">{proposal.votesFor.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">
                          ({Math.round(forPercentage)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Against</span>
                      </div>
                      <div>
                        <span className="font-medium">{proposal.votesAgainst.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">
                          ({Math.round(againstPercentage)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vote Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Your Vote</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      voteChoice === 'for' 
                        ? 'ring-2 ring-green-500 bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setVoteChoice('for')}
                  >
                    <CardContent className="pt-6 text-center">
                      <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${
                        voteChoice === 'for' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <h4 className="font-semibold">Vote For</h4>
                      <p className="text-sm text-muted-foreground">
                        Support this proposal
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${
                      voteChoice === 'against' 
                        ? 'ring-2 ring-red-500 bg-red-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setVoteChoice('against')}
                  >
                    <CardContent className="pt-6 text-center">
                      <XCircle className={`h-8 w-8 mx-auto mb-2 ${
                        voteChoice === 'against' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <h4 className="font-semibold">Vote Against</h4>
                      <p className="text-sm text-muted-foreground">
                        Oppose this proposal
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Voting Power */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Voting Power: {votingPower[0].toLocaleString()} MINTYN
                </Label>
                <Slider
                  value={votingPower}
                  onValueChange={setVotingPower}
                  max={tokenBalance}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>Max: {tokenBalance.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can use any amount of your tokens to vote. Your voting power affects the weight of your vote.
                </p>
              </div>

              {/* Vote Impact */}
              {voteChoice && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Vote Impact</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your vote of {votingPower[0].toLocaleString()} tokens {voteChoice === 'for' ? 'for' : 'against'} 
                      {' '}this proposal will move the total to approximately{' '}
                      {voteChoice === 'for' 
                        ? Math.round(((proposal.votesFor + votingPower[0]) / (proposal.totalVotes + votingPower[0])) * 100)
                        : Math.round((proposal.votesFor / (proposal.totalVotes + votingPower[0])) * 100)
                      }% in favor.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleVote}
                  disabled={!voteChoice || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Gavel className="h-4 w-4 mr-2" />
                  )}
                  Cast Vote
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8 space-y-4"
            >
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">Processing Vote</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while your vote is being recorded on the blockchain...
                </p>
              </div>
            </motion.div>
          )}

          {step === 'success' && success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8 space-y-4"
            >
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <div>
                <h3 className="text-lg font-semibold">Vote Cast Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your vote has been recorded on the blockchain.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Vote:</span>
                      <span className="font-semibold capitalize">
                        {voteChoice} ({votingPower[0].toLocaleString()} tokens)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Proposal:</span>
                      <span className="font-semibold">{proposal.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction:</span>
                      <a
                        href={`https://explorer.solana.com/tx/${success}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        View on Explorer
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8 space-y-4"
            >
              <X className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold">Vote Failed</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error processing your vote.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setError(null);
                    setStep('vote');
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VotingModal;
