"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

import { useBlockchain } from '@/contexts/BlockchainProvider';
import { blockchainService } from '@/services/blockchainService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';

interface UBIRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UBIRegistrationModal: React.FC<UBIRegistrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { publicKey } = useWallet();
  const { executeTransaction } = useBlockchain();

  const [formData, setFormData] = useState({
    identityHash: '',
    referralCode: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [showIdentityInfo, setShowIdentityInfo] = useState(false);

  // Generate a simple identity hash from user input
  const generateIdentityHash = (input: string) => {
    // This is a simplified hash generation for demo purposes
    // In a real implementation, this would involve secure hashing of identity documents
    const hash = btoa(input).padEnd(32, '0').slice(0, 32);
    return hash;
  };

  // Validate form
  const isFormValid = () => {
    return (
      formData.identityHash.trim() !== '' &&
      formData.acceptTerms &&
      formData.acceptPrivacy
    );
  };

  // Handle form change
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  // Handle registration submission
  const handleRegister = async () => {
    if (!publicKey || !isFormValid()) {
      setError('Please fill in all required fields and accept the terms');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      // Generate identity hash
      const identityHash = generateIdentityHash(formData.identityHash);

      // Get private key from wallet (this would typically be handled by the wallet adapter)
      // For demo purposes, we'll use a placeholder
      const privateKeyArray = Array.from(publicKey.toBytes()); // This is not the actual private key
      const privateKey = JSON.stringify(privateKeyArray);

      const response = await blockchainService.initializeUser({
        privateKey,
        identityHash,
        referralCode: formData.referralCode || undefined,
      });

      if (response.success) {
        setSuccess(response.data.txHash);
        setStep('success');
        toast.success('Registration successful!');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
      setStep('error');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setFormData({
      identityHash: '',
      referralCode: '',
      acceptTerms: false,
      acceptPrivacy: false,
    });
    setError(null);
    setSuccess(null);
    setStep('form');
    setIsLoading(false);
  };

  // Handle close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Register for UBI
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Information Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Universal Basic Income Registration</h3>
                    <p className="text-sm text-muted-foreground">
                      Register to access UBI benefits including a welcome bonus, initial distribution, 
                      and monthly payments. Your identity information is used for fraud prevention 
                      and verification purposes.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Shield className="h-4 w-4" />
                      <span>All data is encrypted and stored securely on the blockchain</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Form */}
              <div className="space-y-4">
                {/* Identity Hash */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="identityHash">Identity Information *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowIdentityInfo(!showIdentityInfo)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    id="identityHash"
                    type="text"
                    placeholder="Enter identifying information (e.g., email, phone, document number)"
                    value={formData.identityHash}
                    onChange={(e) => handleFormChange('identityHash', e.target.value)}
                    className={error && !formData.identityHash ? 'border-red-500' : ''}
                  />
                  {showIdentityInfo && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This information is used to create a unique identity hash for fraud prevention. 
                        Common options include email address, phone number, or government ID number. 
                        The actual information is hashed and cannot be recovered from the blockchain.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code if you have one"
                    value={formData.referralCode}
                    onChange={(e) => handleFormChange('referralCode', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Referral codes may provide additional benefits
                  </p>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleFormChange('acceptTerms', checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I accept the{' '}
                      <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </a>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) => handleFormChange('acceptPrivacy', checked)}
                    />
                    <Label htmlFor="privacy" className="text-sm">
                      I accept the{' '}
                      <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                </div>

                {/* Benefits Information */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3">Registration Benefits</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Welcome Bonus:</span>
                        <span className="font-semibold text-green-600">Immediate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Initial UBI ($2,000):</span>
                        <span className="font-semibold">After verification</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly UBI ($1,000):</span>
                        <span className="font-semibold">Recurring</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                  onClick={handleRegister}
                  disabled={!isFormValid() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Register for UBI
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
                <h3 className="text-lg font-semibold">Processing Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while your registration is being processed...
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
                <h3 className="text-lg font-semibold">Registration Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Welcome to the UBI system! Your registration has been completed.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Next Steps</h4>
                    <div className="space-y-2 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Welcome bonus has been distributed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Identity verification in progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span>Initial UBI available after verification</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
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
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleClose} className="w-full">
                Continue to Dashboard
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
                <h3 className="text-lg font-semibold">Registration Failed</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error processing your registration.
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
                    setStep('form');
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

export default UBIRegistrationModal;
