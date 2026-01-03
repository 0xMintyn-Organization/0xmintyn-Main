'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  XCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format } from 'date-fns';

interface CancellationStatusProps {
  orderId: string;
  cancellationRequest: {
    requestedAt: Date | string;
    requestedBy: any;
    cancellationReason: string;
    status: 'pending' | 'accepted' | 'rejected';
    respondedAt?: Date | string;
    responseMessage?: string;
  };
  isSeller: boolean;
  onResponseSuccess: () => void;
}

export default function CancellationStatus({
  orderId,
  cancellationRequest,
  isSeller,
  onResponseSuccess
}: CancellationStatusProps) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [action, setAction] = useState<'accept' | 'reject'>('accept');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'accepted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'rejected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleRespond = async () => {
    try {
      setSubmitting(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/respond-cancellation`,
        {
          action,
          responseMessage: responseMessage.trim() || undefined
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: action === 'accept' ? "Cancellation Accepted" : "Cancellation Rejected",
          description: action === 'accept' 
            ? "The order has been cancelled." 
            : "The cancellation request has been rejected. The order will continue.",
        });
        setResponseMessage('');
        setShowResponseModal(false);
        onResponseSuccess();
      }
    } catch (error: any) {
      console.error('Error responding to cancellation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || 'Failed to respond to cancellation request',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className={`border-2 ${
        cancellationRequest.status === 'pending' 
          ? 'border-yellow-200 dark:border-yellow-800' 
          : cancellationRequest.status === 'accepted'
          ? 'border-red-200 dark:border-red-800'
          : 'border-green-200 dark:border-green-800'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancellation Request
            </div>
            <Badge className={getStatusColor(cancellationRequest.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(cancellationRequest.status)}
                {cancellationRequest.status.charAt(0).toUpperCase() + cancellationRequest.status.slice(1)}
              </span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requested By</p>
            <p className="font-medium">
              {cancellationRequest.requestedBy?.firstName} {cancellationRequest.requestedBy?.lastName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(cancellationRequest.requestedAt), 'MMM dd, yyyy • hh:mm a')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reason</p>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {cancellationRequest.cancellationReason}
            </p>
          </div>

          {cancellationRequest.status !== 'pending' && cancellationRequest.respondedAt && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {cancellationRequest.status === 'accepted' ? 'Accepted' : 'Rejected'} On
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(cancellationRequest.respondedAt), 'MMM dd, yyyy • hh:mm a')}
              </p>
              {cancellationRequest.responseMessage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Seller's Response</p>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {cancellationRequest.responseMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {isSeller && cancellationRequest.status === 'pending' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => {
                  setAction('reject');
                  setShowResponseModal(true);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue Order
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setAction('accept');
                  setShowResponseModal(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Accept Cancellation
              </Button>
            </div>
          )}

          {!isSeller && cancellationRequest.status === 'pending' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏳ Waiting for seller's response to your cancellation request.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Modal for Seller */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {action === 'accept' ? 'Accept Cancellation' : 'Reject Cancellation'}
            </DialogTitle>
            <DialogDescription>
              {action === 'accept' 
                ? 'Are you sure you want to accept this cancellation request? The order will be cancelled and the buyer will be refunded.'
                : 'The order will continue as normal. You can add a message to explain your decision.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responseMessage">Response Message (Optional)</Label>
              <Textarea
                id="responseMessage"
                placeholder={action === 'accept' 
                  ? 'Add a message to the buyer...'
                  : 'Explain why you want to continue the order...'}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                disabled={submitting}
                rows={3}
                maxLength={500}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseMessage('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRespond}
                disabled={submitting}
                className={action === 'accept' 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action === 'accept' ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Accept Cancellation
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Continue Order
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

