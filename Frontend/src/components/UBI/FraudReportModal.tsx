"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Loader2,
  ExternalLink,
  Flag,
  Info
} from 'lucide-react';

import { useBlockchain } from '@/contexts/BlockchainProvider';
import { blockchainService } from '@/services/blockchainService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface FraudReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FraudReportModal: React.FC<FraudReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { publicKey } = useWallet();
  const { executeTransaction } = useBlockchain();

  const [formData, setFormData] = useState({
    reportedUser: '',
    reason: '',
    reasonType: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');

  // Fraud reason types
  const reasonTypes = [
    { value: 'multiple_accounts', label: 'Multiple Accounts' },
    { value: 'identity_theft', label: 'Identity Theft' },
    { value: 'fake_verification', label: 'Fake Verification Documents' },
    { value: 'bot_activity', label: 'Automated/Bot Activity' },
    { value: 'collusion', label: 'Collusion/Coordination' },
    { value: 'other', label: 'Other' },
  ];

  // Validate form
  const isFormValid = () => {
    return (
      formData.reportedUser.trim() !== '' &&
      PublicKey.isOnCurve(formData.reportedUser) &&
      formData.reasonType !== '' &&
      formData.description.trim() !== ''
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

  // Handle report submission
  const handleSubmitReport = async () => {
    if (!publicKey || !isFormValid()) {
      setError('Please fill in all required fields with valid information');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      // Create detailed reason
      const detailedReason = `${formData.reasonType}: ${formData.description}`;

      // Get private key from wallet (this would typically be handled by the wallet adapter)
      // For demo purposes, we'll use a placeholder
      const privateKeyArray = Array.from(publicKey.toBytes()); // This is not the actual private key
      const privateKey = JSON.stringify(privateKeyArray);

      const response = await blockchainService.reportFraud({
        privateKey,
        reportedUser: formData.reportedUser,
        reason: detailedReason,
      });

      if (response.success) {
        setSuccess(response.data.txHash);
        setStep('success');
        toast.success('Fraud report submitted successfully!');
      } else {
        throw new Error(response.message || 'Failed to submit fraud report');
      }
    } catch (err: any) {
      console.error('Fraud report error:', err);
      setError(err.message || 'Failed to submit fraud report');
      setStep('error');
      toast.error(err.message || 'Failed to submit fraud report');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setFormData({
      reportedUser: '',
      reason: '',
      reasonType: '',
      description: '',
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
            <Flag className="h-5 w-5" />
            Report Fraudulent Activity
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
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-semibold">Important Information</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fraud reporting helps maintain the integrity of the UBI system. Only report 
                      legitimate concerns with evidence. False reports may result in penalties.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Shield className="h-4 w-4" />
                      <span>All reports are investigated and handled confidentially</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Form */}
              <div className="space-y-4">
                {/* Reported User */}
                <div className="space-y-2">
                  <Label htmlFor="reportedUser">User Address *</Label>
                  <Input
                    id="reportedUser"
                    type="text"
                    placeholder="Enter the wallet address of the user to report"
                    value={formData.reportedUser}
                    onChange={(e) => handleFormChange('reportedUser', e.target.value)}
                    className={error && !PublicKey.isOnCurve(formData.reportedUser) ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    The Solana wallet address (public key) of the user you're reporting
                  </p>
                </div>

                {/* Reason Type */}
                <div className="space-y-2">
                  <Label htmlFor="reasonType">Type of Fraud *</Label>
                  <Select
                    value={formData.reasonType}
                    onValueChange={(value) => handleFormChange('reasonType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the type of fraudulent activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the fraudulent activity, including any evidence or observations..."
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={4}
                    className={error && !formData.description ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific and include relevant details that support your report
                  </p>
                </div>

                {/* Guidelines */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Reporting Guidelines
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">DO</Badge>
                        <span>Provide specific evidence or observations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">DO</Badge>
                        <span>Report only genuine concerns about fraud</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5 text-xs">DON'T</Badge>
                        <span>Make false or malicious reports</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5 text-xs">DON'T</Badge>
                        <span>Use this for personal disputes</span>
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
                  onClick={handleSubmitReport}
                  disabled={!isFormValid() || isLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  Submit Report
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
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold">Submitting Report</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while your fraud report is being submitted...
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
                <h3 className="text-lg font-semibold">Report Submitted Successfully</h3>
                <p className="text-sm text-muted-foreground">
                  Your fraud report has been submitted and will be investigated.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">What Happens Next</h4>
                    <div className="space-y-2 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Report recorded on blockchain</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Investigation will be conducted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span>Appropriate action will be taken if verified</span>
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

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>You may be contacted if additional information is needed</span>
              </div>

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
                <h3 className="text-lg font-semibold">Report Submission Failed</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error submitting your fraud report.
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

export default FraudReportModal;
