'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, X, Plus, Loader2, FileText, 
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface RevisionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItems: any[];
  maxRevisions: number;
  currentRevisions: number;
  onRevisionSuccess: () => void;
}

export default function RevisionRequestModal({
  isOpen,
  onClose,
  orderId,
  orderItems,
  maxRevisions,
  currentRevisions,
  onRevisionSuccess
}: RevisionRequestModalProps) {
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionDetails, setRevisionDetails] = useState('');
  const [requestedChanges, setRequestedChanges] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const remainingRevisions = maxRevisions - currentRevisions;

  const addChangeRequest = () => {
    setRequestedChanges(prev => [...prev, '']);
  };

  const removeChangeRequest = (index: number) => {
    setRequestedChanges(prev => prev.filter((_, i) => i !== index));
  };

  const updateChangeRequest = (index: number, value: string) => {
    setRequestedChanges(prev => prev.map((change, i) => i === index ? value : change));
  };

  const handleSubmit = async () => {
    if (!revisionReason.trim()) {
      toast({
        title: "Revision Reason Required",
        description: "Please provide a reason for the revision request.",
        variant: "destructive"
      });
      return;
    }

    if (!revisionDetails.trim()) {
      toast({
        title: "Revision Details Required",
        description: "Please provide detailed information about what needs to be changed.",
        variant: "destructive"
      });
      return;
    }

    const validChanges = requestedChanges.filter(change => change.trim());
    if (validChanges.length === 0) {
      toast({
        title: "Change Requests Required",
        description: "Please specify at least one change you'd like made.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/request-revision`,
        {
          revisionReason: revisionReason.trim(),
          revisionDetails: revisionDetails.trim(),
          requestedChanges: validChanges
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "🎯 Revision Request Sent!",
          description: "Your revision request has been sent to the seller.",
        });
        
        // Reset form
        setRevisionReason('');
        setRevisionDetails('');
        setRequestedChanges(['']);
        
        onRevisionSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Revision request error:', error);
      toast({
        title: "Request Failed",
        description: error.response?.data?.message || "Failed to send revision request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRevisionReason('');
      setRevisionDetails('');
      setRequestedChanges(['']);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Request Revision
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Revision Info */}
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Revision Request Information
                  </h4>
                  <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                    <p>• You have <strong>{remainingRevisions}</strong> revision{remainingRevisions !== 1 ? 's' : ''} remaining</p>
                    <p>• Seller has 3 days to respond to your revision request</p>
                    <p>• Be specific about what changes you need</p>
                    <p>• Include examples or references if helpful</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Order Items for Revision:</h4>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.itemTitle}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.itemType === 'service' ? 'Service' : 'Product'}
                        {item.packageDetails?.packageName && ` • ${item.packageDetails.packageName}`}
                      </p>
                    </div>
                    <Badge variant="outline">${item.itemPrice}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revision Reason */}
          <div className="space-y-2">
            <Label htmlFor="revisionReason">Revision Reason *</Label>
            <Input
              id="revisionReason"
              placeholder="Brief reason for requesting revision (e.g., 'Colors don't match requirements', 'Missing functionality')"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              maxLength={500}
            />
            <p className="text-sm text-gray-500">
              {revisionReason.length}/500 characters
            </p>
          </div>

          {/* Revision Details */}
          <div className="space-y-2">
            <Label htmlFor="revisionDetails">Detailed Description *</Label>
            <Textarea
              id="revisionDetails"
              placeholder="Provide detailed information about what needs to be changed. Be as specific as possible to help the seller understand your requirements..."
              value={revisionDetails}
              onChange={(e) => setRevisionDetails(e.target.value)}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500">
              {revisionDetails.length}/2000 characters
            </p>
          </div>

          {/* Requested Changes */}
          <div className="space-y-3">
            <Label>Specific Changes Requested *</Label>
            <div className="space-y-3">
              {requestedChanges.map((change, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      {index + 1}
                    </span>
                  </div>
                  <Input
                    placeholder={`Change ${index + 1}: What specific change do you need?`}
                    value={change}
                    onChange={(e) => updateChangeRequest(index, e.target.value)}
                    className="flex-1"
                  />
                  {requestedChanges.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChangeRequest(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addChangeRequest}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Change Request
              </Button>
            </div>
          </div>

          {/* Guidelines */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Revision Guidelines
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Be clear and specific about what needs to be changed</li>
                <li>• Provide examples or references when possible</li>
                <li>• Focus on the original requirements and scope</li>
                <li>• Avoid requesting changes outside the original scope</li>
                <li>• Seller has 3 days to respond to your request</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !revisionReason.trim() || !revisionDetails.trim() || requestedChanges.every(c => !c.trim())}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Send Revision Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

