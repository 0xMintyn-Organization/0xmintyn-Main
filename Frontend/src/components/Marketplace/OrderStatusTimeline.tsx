'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  TrendingUp, 
  Truck,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface StatusHistoryItem {
  status: string;
  timestamp: Date | string;
  note?: string;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  statusHistory?: StatusHistoryItem[];
  createdAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  cancelledAt?: Date | string;
}

export default function OrderStatusTimeline({ 
  currentStatus, 
  statusHistory,
  createdAt,
  startedAt,
  completedAt,
  cancelledAt
}: OrderStatusTimelineProps) {
  
  const getStatusIcon = (status: string, isActive: boolean) => {
    const iconClass = `h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`;
    
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className={iconClass} />;
      case 'confirmed':
        return <CheckCircle className={iconClass} />;
      case 'processing':
        return <TrendingUp className={iconClass} />;
      case 'completed':
        return <CheckCircle className={iconClass} />;
      case 'cancelled':
        return <XCircle className={iconClass} />;
      case 'refunded':
        return <AlertCircle className={iconClass} />;
      default:
        return <Package className={iconClass} />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean, isPast: boolean) => {
    if (!isActive && !isPast) {
      return 'bg-gray-200 dark:bg-gray-700';
    }
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'refunded':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Define the standard order flow
  const standardFlow = [
    { status: 'pending', label: 'Order Placed', icon: 'clock' },
    { status: 'confirmed', label: 'Order Confirmed', icon: 'check' },
    { status: 'processing', label: 'In Progress', icon: 'trending' },
    { status: 'completed', label: 'Completed', icon: 'check-circle' }
  ];

  // If order is cancelled, show different flow
  if (currentStatus === 'cancelled') {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            Order Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                This order was cancelled on {cancelledAt ? format(new Date(cancelledAt), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
              </p>
            </div>
            
            {statusHistory && statusHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Order History</h4>
                {statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(history.timestamp), 'MMM dd, hh:mm a')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{formatStatus(history.status)}</p>
                      {history.note && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine current step
  const getCurrentStepIndex = () => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'completed'];
    return statusOrder.indexOf(currentStatus.toLowerCase());
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Order Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visual Timeline */}
          <div className="relative">
            {standardFlow.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isPast = index < currentStepIndex;
              const isLast = index === standardFlow.length - 1;
              
              return (
                <div key={step.status} className="relative">
                  <div className="flex items-start gap-4 mb-8 last:mb-0">
                    {/* Timeline Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${getStatusColor(step.status, isActive, isPast)}
                        ${isActive ? 'ring-4 ring-offset-2 ring-offset-background' : ''}
                        ${isActive ? 'ring-green-200 dark:ring-green-900/30' : ''}
                        transition-all duration-300
                      `}>
                        {getStatusIcon(step.status, isActive || isPast)}
                      </div>
                      
                      {/* Connecting Line */}
                      {!isLast && (
                        <div className={`
                          absolute left-1/2 top-full w-0.5 h-8 -translate-x-1/2
                          ${isPast || isActive ? 'bg-gradient-to-b from-green-500 to-gray-300 dark:to-gray-600' : 'bg-gray-200 dark:bg-gray-700'}
                          transition-all duration-300
                        `} />
                      )}
                    </div>
                    
                    {/* Status Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${
                          isActive 
                            ? 'text-green-600 dark:text-green-400' 
                            : isPast 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {step.label}
                        </h4>
                        {isActive && (
                          <Badge className="bg-green-500 text-white">
                            Current
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            ✓ Done
                          </Badge>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      {statusHistory && statusHistory.length > 0 && (
                        <>
                          {statusHistory.find(h => h.status.toLowerCase() === step.status.toLowerCase()) && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">
                                {format(
                                  new Date(statusHistory.find(h => h.status.toLowerCase() === step.status.toLowerCase())!.timestamp), 
                                  'MMM dd, yyyy • hh:mm a'
                                )}
                              </p>
                              {statusHistory.find(h => h.status.toLowerCase() === step.status.toLowerCase())!.note && (
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {statusHistory.find(h => h.status.toLowerCase() === step.status.toLowerCase())!.note}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Show approximate time for current/future steps */}
                      {!isPast && !isActive && (
                        <p className="text-xs text-gray-400 mt-1">
                          Pending
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Status History (non-standard statuses) */}
          {statusHistory && statusHistory.some(h => 
            !standardFlow.some(s => s.status.toLowerCase() === h.status.toLowerCase())
          ) && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Additional Events</h4>
              <div className="space-y-2">
                {statusHistory
                  .filter(h => !standardFlow.some(s => s.status.toLowerCase() === h.status.toLowerCase()))
                  .map((history, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatStatus(history.status)}
                          </p>
                          <span className="text-xs text-gray-500">
                            {format(new Date(history.timestamp), 'MMM dd, hh:mm a')}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

