"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  FileText,
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose
}) => {
  const { publicKey } = useWallet();
  const { executeTransaction, tokenBalance } = useBlockchain();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    duration: '7',
    category: '',
    implementationDetails: '',
    acceptTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');

  // Proposal types
  const proposalTypes = [
    { value: 'parameter_change', label: 'Parameter Change' },
    { value: 'technical_upgrade', label: 'Technical Upgrade' },
    { value: 'security_update', label: 'Security Update' },
    { value: 'treasury', label: 'Treasury Management' },
    { value: 'governance', label: 'Governance Change' },
    { value: 'other', label: 'Other' },
  ];

  // Proposal categories
  const categories = [
    { value: 'ubi', label: 'UBI System' },
    { value: 'governance', label: 'Governance' },
    { value: 'security', label: 'Security' },
    { value: 'economics', label: 'Economics' },
    { value: 'technical', label: 'Technical' },
    { value: 'community', label: 'Community' },
  ];

  // Duration options (in days)
  const durationOptions = [
    { value: '3', label: '3 Days' },
    { value: '7', label: '7 Days' },
    { value: '14', label: '14 Days' },
    { value: '21', label: '21 Days' },
    { value: '30', label: '30 Days' },
  ];

  // Minimum token requirement for creating proposals
  const MIN_TOKENS_REQUIRED = 10000;

  // Validate form
  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.type !== '' &&
      formData.category !== '' &&
      formData.implementationDetails.trim() !== '' &&
      formData.acceptTerms &&
      tokenBalance >= MIN_TOKENS_REQUIRED
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

  // Handle proposal creation
  const handleCreateProposal = async () => {
    if (!publicKey || !isFormValid()) {
      setError('Please fill in all required fields and ensure you have sufficient tokens');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      // This would call the actual blockchain service
      // For demo purposes, we'll simulate the proposal creation
      const response = await blockchainService.createProposal({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        duration: parseInt(formData.duration),
        implementationDetails: formData.implementationDetails,
        proposerPublicKey: publicKey.toString(),
      });

      // Simulate successful response
      const mockResponse = {
        success: true,
        data: {
          txHash: 'mock_proposal_tx_' + Date.now(),
          proposalId: 'proposal_' + Date.now(),
        }
      };

      if (mockResponse.success) {
        setSuccess(mockResponse.data.txHash);
        setStep('success');
        toast.success('Proposal created successfully!');
      } else {
        throw new Error('Proposal creation failed');
      }
    } catch (err: any) {
      console.error('Proposal creation error:', err);
      setError(err.message || 'Failed to create proposal');
      setStep('error');
      toast.error(err.message || 'Proposal creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      duration: '7',
      category: '',
      implementationDetails: '',
      acceptTerms: false,
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Proposal
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
              {/* Requirements Check */}
              <Card className={tokenBalance >= MIN_TOKENS_REQUIRED ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {tokenBalance >= MIN_TOKENS_REQUIRED ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-semibold ${tokenBalance >= MIN_TOKENS_REQUIRED ? "text-green-800" : "text-red-800"}`}>
                      Token Requirement
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${tokenBalance >= MIN_TOKENS_REQUIRED ? "text-green-700" : "text-red-700"}`}>
                    {tokenBalance >= MIN_TOKENS_REQUIRED 
                      ? `✓ You have ${tokenBalance.toLocaleString()} tokens (${MIN_TOKENS_REQUIRED.toLocaleString()} required)`
                      : `✗ You need ${MIN_TOKENS_REQUIRED.toLocaleString()} tokens to create proposals (you have ${tokenBalance.toLocaleString()})`
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter a clear, descriptive title for your proposal"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of your proposal, including the problem it solves and expected benefits..."
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Type and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Proposal Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleFormChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select proposal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {proposalTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleFormChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Voting Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Voting Duration *</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => handleFormChange('duration', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How long should the voting period last?
                  </p>
                </div>
              </div>

              {/* Implementation Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Implementation Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="implementationDetails">Implementation Plan *</Label>
                  <Textarea
                    id="implementationDetails"
                    placeholder="Describe how this proposal would be implemented, including technical details, timeline, resources needed, and potential risks..."
                    value={formData.implementationDetails}
                    onChange={(e) => handleFormChange('implementationDetails', e.target.value)}
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.implementationDetails.length}/2000 characters
                  </p>
                </div>
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
                    I confirm that this proposal is submitted in good faith and complies with the{' '}
                    <a href="/governance-guidelines" target="_blank" className="text-blue-600 hover:underline">
                      Governance Guidelines
                    </a>
                  </Label>
                </div>
              </div>

              {/* Guidelines */}
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Proposal Guidelines
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>Proposals should benefit the entire community</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>Include clear implementation details and timelines</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>Consider potential risks and mitigation strategies</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>Engage with the community for feedback before submitting</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  onClick={handleCreateProposal}
                  disabled={!isFormValid() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Create Proposal
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
                <h3 className="text-lg font-semibold">Creating Proposal</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while your proposal is being submitted to the blockchain...
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
                <h3 className="text-lg font-semibold">Proposal Created Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your proposal has been submitted and is now open for community voting.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Title:</span>
                      <span className="font-semibold">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-semibold capitalize">
                        {formData.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold">{formData.duration} days</span>
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
                Continue to Governance
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
                <h3 className="text-lg font-semibold">Proposal Creation Failed</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error creating your proposal.
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

export default CreateProposalModal;
