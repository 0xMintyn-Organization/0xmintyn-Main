'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, CheckCircle, X, Clock, User, 
  MessageSquare, Calendar, TrendingUp
} from 'lucide-react';
import RevisionResponseModal from './RevisionResponseModal';

interface RevisionStatusProps {
  orderId: string;
  revisionRequest: any;
  isSeller: boolean;
  onResponseSuccess: () => void;
}

export default function RevisionStatus({ 
  orderId, 
  revisionRequest, 
  isSeller, 
  onResponseSuccess 
}: RevisionStatusProps) {
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  if (!revisionRequest) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <TrendingUp className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Seller Response';
      case 'in_progress': return 'Seller Working on Revision';
      case 'completed': return 'Revision Completed';
      case 'rejected': return 'Revision Rejected';
      default: return 'Unknown Status';
    }
  };

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Revision Request
            <Badge className={`ml-auto ${getStatusColor(revisionRequest.status)}`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(revisionRequest.status)}
                {getStatusText(revisionRequest.status)}
              </span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revision Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reason:</p>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {revisionRequest.revisionReason}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Details:</p>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {revisionRequest.revisionDetails}
              </p>
            </div>
            
            {revisionRequest.requestedChanges && revisionRequest.requestedChanges.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Requested Changes:</p>
                <ul className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded space-y-1">
                  {revisionRequest.requestedChanges.map((change: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>Requested on {formatDate(revisionRequest.requestedAt)}</span>
            </div>
            
            {revisionRequest.respondedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>Responded on {formatDate(revisionRequest.respondedAt)}</span>
              </div>
            )}
          </div>

          {/* Seller Response */}
          {revisionRequest.responseMessage && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {isSeller ? 'Your Response:' : 'Seller Response:'}
              </p>
              <p className="text-sm text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                {revisionRequest.responseMessage}
              </p>
            </div>
          )}

          {/* Seller Action Button */}
          {isSeller && revisionRequest.status === 'pending' && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => setResponseModalOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Respond to Revision Request
              </Button>
            </div>
          )}

          {/* Buyer Status Message */}
          {!isSeller && (
            <div className="pt-4 border-t">
              {revisionRequest.status === 'pending' && (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Waiting for seller to respond to your revision request...
                  </p>
                </div>
              )}
              
              {revisionRequest.status === 'in_progress' && (
                <div className="text-center py-4">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seller is working on your revision request...
                  </p>
                </div>
              )}
              
              {revisionRequest.status === 'completed' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your revision has been completed! Check the delivery files.
                  </p>
                </div>
              )}
              
              {revisionRequest.status === 'rejected' && (
                <div className="text-center py-4">
                  <X className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your revision request was rejected by the seller.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revision Response Modal */}
      <RevisionResponseModal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        orderId={orderId}
        revisionRequest={revisionRequest}
        onResponseSuccess={onResponseSuccess}
      />
    </>
  );
}

