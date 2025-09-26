"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Coins, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';

import { useBlockchain } from '@/contexts/BlockchainProvider';
import { useBlockchainStore } from '@/stores/blockchainStore';
import { blockchainService } from '@/services/blockchainService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface UBIClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimType: 'initial' | 'monthly';
}

const UBIClaimModal: React.FC<UBIClaimModalProps> = ({
  isOpen,
  onClose,
  claimType
}) => {
  const { publicKey } = useWallet();
  const { executeTransaction } = useBlockchain();
  const { userProfile, ubiConfig } = useBlockchainStore();

  const [tokenAccount, setTokenAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');

  // Get claim amount based on type
  const getClaimAmount = () => {
    if (!ubiConfig) return '0';
    
    switch (claimType) {
      case 'initial':
        return parseInt(ubiConfig.initialUbiAmount).toLocaleString();
      case 'monthly':
        return parseInt(ubiConfig.monthlyUbiAmount).toLocaleString();
      default:
        return '0';
    }
  };

  // Get claim title
  const getClaimTitle = () => {
    switch (claimType) {
      case 'initial':
        return 'Claim Initial UBI';
      case 'monthly':
        return 'Claim Monthly UBI';
      default:
        return 'Claim UBI';
    }
  };

  // Get claim description
  const getClaimDescription = () => {
    switch (claimType) {
      case 'initial':
        return 'One-time $2,000 equivalent distribution for verified users';
      case 'monthly':
        return 'Monthly $1,000 equivalent recurring benefit';
      default:
        return 'Universal Basic Income claim';
    }
  };

  // Validate form
  const isFormValid = () => {
    return tokenAccount.trim() !== '' && PublicKey.isOnCurve(tokenAccount);
  };

  // Handle claim submission
  const handleClaim = async () => {
    if (!publicKey || !isFormValid()) {
      setError('Please provide a valid token account address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      // Get private key from wallet (this would typically be handled by the wallet adapter)
      // For demo purposes, we'll use a placeholder
      const privateKeyArray = Array.from(publicKey.toBytes()); // This is not the actual private key
      const privateKey = JSON.stringify(privateKeyArray);

      let response;
      if (claimType === 'initial') {
        response = await blockchainService.claimInitialUbi({
          privateKey,
          userTokenAccount: tokenAccount,
        });
      } else {
        response = await blockchainService.claimMonthlyUbi({
          privateKey,
          userTokenAccount: tokenAccount,
        });
      }

      if (response.success) {
        setSuccess(response.data.txHash);
        setStep('success');
        toast.success(`${getClaimTitle()} successful!`);
      } else {
        throw new Error(response.message || 'Claim failed');
      }
    } catch (err: any) {
      console.error('Claim error:', err);
      setError(err.message || 'Failed to process claim');
      setStep('error');
      toast.error(err.message || 'Claim failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setTokenAccount('');
    setError(null);
    setSuccess(null);
    setStep('confirm');
    setIsLoading(false);
  };

  // Handle close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Check if user can claim
  const canClaim = () => {
    if (!userProfile) return false;
    if (userProfile.isSuspended) return false;
    if (!userProfile.isVerified) return false;
    
    if (claimType === 'initial') {
      return !userProfile.initialUbiClaimed;
    }
    
    // For monthly claims, check if enough time has passed
    if (claimType === 'monthly') {
      if (!userProfile.initialUbiClaimed) return false;
      
      const lastClaim = parseInt(userProfile.lastMonthlyClaim);
      const now = Math.floor(Date.now() / 1000);
      const monthInSeconds = 30 * 24 * 60 * 60; // 30 days
      
      return (now - lastClaim) >= monthInSeconds;
    }
    
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {getClaimTitle()}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Claim Information */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-600">
                      {getClaimAmount()} MINTYN
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getClaimDescription()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Eligibility Check */}
              {!canClaim() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {!userProfile ? 'User profile not found. Please register first.' :
                     userProfile.isSuspended ? 'Your account is suspended.' :
                     !userProfile.isVerified ? 'Your account is not verified.' :
                     claimType === 'initial' && userProfile.initialUbiClaimed ? 'Initial UBI already claimed.' :
                     claimType === 'monthly' && !userProfile.initialUbiClaimed ? 'Must claim initial UBI first.' :
                     'Not eligible for this claim at this time.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* User Status */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification Status</span>
                  <Badge variant={userProfile?.isVerified ? "default" : "secondary"}>
                    {userProfile?.isVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account Status</span>
                  <Badge variant={userProfile?.isSuspended ? "destructive" : "default"}>
                    {userProfile?.isSuspended ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification Score</span>
                  <span className="text-sm font-bold">
                    {userProfile?.verificationScore || 0}/100
                  </span>
                </div>
              </div>

              {/* Token Account Input */}
              <div className="space-y-2">
                <Label htmlFor="tokenAccount">Token Account Address</Label>
                <Input
                  id="tokenAccount"
                  type="text"
                  placeholder="Enter your token account address"
                  value={tokenAccount}
                  onChange={(e) => setTokenAccount(e.target.value)}
                  className={error && !isFormValid() ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  This is where your UBI tokens will be sent
                </p>
              </div>

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
                  onClick={handleClaim}
                  disabled={!canClaim() || !isFormValid() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Coins className="h-4 w-4 mr-2" />
                  )}
                  Claim UBI
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
                <h3 className="text-lg font-semibold">Processing Claim</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while your UBI claim is being processed...
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
                <h3 className="text-lg font-semibold">Claim Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your UBI claim has been processed successfully.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount Claimed:</span>
                      <span className="font-semibold">{getClaimAmount()} MINTYN</span>
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
                <h3 className="text-lg font-semibold">Claim Failed</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error processing your claim.
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
                    setStep('confirm');
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

export default UBIClaimModal;
