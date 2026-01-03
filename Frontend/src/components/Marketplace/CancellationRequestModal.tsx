'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface CancellationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export default function CancellationRequestModal({
  isOpen,
  onClose,
  orderId,
  onSuccess
}: CancellationRequestModalProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/cancel`,
        { cancellationReason: cancellationReason.trim() },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Cancellation Request Sent",
          description: "Your cancellation request has been sent to the seller. They will respond soon.",
        });
        setCancellationReason('');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error requesting cancellation:', error);
      setError(error.response?.data?.message || 'Failed to request cancellation. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || 'Failed to request cancellation',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setCancellationReason('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Request Order Cancellation
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling this order. The seller will review your request and respond.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you want to cancel this order..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              disabled={submitting}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {cancellationReason.length}/500 characters
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Note:</strong> The seller will review your request and can either accept or reject it. 
              If accepted, the order will be cancelled and any payments will be refunded according to the refund policy.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Request Cancellation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

