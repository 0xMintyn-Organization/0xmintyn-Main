'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Star, 
  Clock, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Info,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { P2POffer, UserBalance } from './P2PTrade';
import { toast } from 'sonner';
import {
  getAvailableBalance,
  calculateMaxTradeable,
  validateTradeAmount,
} from '@/utils/p2pValidation';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: P2POffer;
  side: 'buy' | 'sell';
  userBalance: UserBalance;
  onConfirm: (amount: number, paymentMethod: string) => Promise<void>;
  isProcessing: boolean;
}

export default function TradeModal({
  isOpen,
  onClose,
  offer,
  side,
  userBalance,
  onConfirm,
  isProcessing,
}: TradeModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; payment?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedPaymentMethod('');
      setErrors({});
    }
  }, [isOpen, offer]);

  const amountNum = parseFloat(amount) || 0;
  const totalPrice = amountNum * offer.price;
  const isBuy = side === 'buy';
  const assetLabel = offer.asset ?? 'Asset';

  // Calculate available balance and max tradeable amount
  const availableBalance = getAvailableBalance(side, assetLabel, userBalance);
  const maxTradeableAmount = calculateMaxTradeable(side, offer, availableBalance);

  // Validate amount using centralized validation
  const validateAmount = () => {
    const validation = validateTradeAmount({
      amount: amountNum,
      offer,
      userBalance,
      side,
      paymentMethod: selectedPaymentMethod,
    });

    const newErrors: { amount?: string; payment?: string } = {};

    if (!validation.isValid) {
      // Check if it's a payment method error
      if (validation.error?.includes('payment method')) {
        newErrors.payment = validation.error;
      } else {
        newErrors.amount = validation.error;
      }
    }

    return newErrors;
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    
    // Clear errors when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
    
    // Real-time validation for better UX (optional - can be disabled if too aggressive)
    // Only validate if amount is entered and not empty
    if (cleaned && parseFloat(cleaned) > 0) {
      const quickValidation = validateTradeAmount({
        amount: parseFloat(cleaned) || 0,
        offer,
        userBalance,
        side,
        paymentMethod: 'skip', // Skip payment method for real-time validation
      });
      
      if (!quickValidation.isValid && quickValidation.error) {
        // Only show error if it's not a payment method error
        if (!quickValidation.error.includes('payment method')) {
          setErrors(prev => ({ ...prev, amount: quickValidation.error }));
        }
      }
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (maxTradeableAmount * percentage / 100).toFixed(2);
    setAmount(quickAmount);
    setErrors({});
  };

  const handleConfirm = async () => {
    const validationErrors = validateAmount();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedPaymentMethod) {
      setErrors({ ...errors, payment: 'Please select a payment method' });
      return;
    }
    await onConfirm(amountNum, selectedPaymentMethod);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto p-0">
        {/* Header with Buy/Sell Badge */}
        <div className={`${isBuy ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'} text-white p-6`}>
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                {isBuy ? (
                  <>
                    <ArrowUp className="w-6 h-6" />
                    Buy {assetLabel}
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-6 h-6" />
                    Sell {assetLabel}
                  </>
                )}
              </DialogTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                {offer.price.toFixed(2)} USD
              </Badge>
            </div>
            <DialogDescription className="text-white/90 text-base">
              {isBuy 
                ? `You will pay ${totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : 'USD'} to receive ${amountNum > 0 ? amountNum.toFixed(4) : '0'} ${assetLabel}`
                : `You will receive ${totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : 'USD'} for selling ${amountNum > 0 ? amountNum.toFixed(4) : '0'} ${assetLabel}`
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Trader Information Card */}
          <div className="border border-gray-200 dark:border-zinc-800 rounded-lg p-4 bg-gray-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-gray-300 dark:border-zinc-700">
                <AvatarImage src={offer.traderAvatar} />
                <AvatarFallback className="text-lg bg-gray-200 dark:bg-zinc-800">
                  {offer.traderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-lg">{offer.traderName}</p>
                  {offer.isVerified && (
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  {offer.isOnline && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      Online
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{offer.traderRating}</span>
                  </div>
                  <span>•</span>
                  <span>{offer.completedTrades.toLocaleString()} orders</span>
                  <span>•</span>
                  <span>{offer.completionRate}% completion</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Response time: {offer.responseTime} min</span>
                  <span>•</span>
                  <span>{offer.responseRate}% response rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Available: <span className="font-semibold text-gray-900 dark:text-gray-100">{offer.available.toLocaleString()} {assetLabel}</span>
              </div>
            </div>

            {/* Amount Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-base font-medium">
                  {isBuy ? `Amount to Buy (${assetLabel})` : `Amount to Sell (${assetLabel})`}
                </Label>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Balance: <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {isBuy 
                      ? `$${availableBalance.toFixed(2)}`
                      : `${availableBalance.toLocaleString()} ${assetLabel}`
                    }
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`text-2xl font-bold h-16 pr-24 ${errors.amount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="outline" className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-zinc-800">
                    {assetLabel}
                  </Badge>
                </div>
              </div>

              {errors.amount && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.amount}</span>
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((percentage) => {
                  const quickAmount = (maxTradeableAmount * percentage / 100);
                  return (
                    <Button
                      key={percentage}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(percentage)}
                      className="flex-1 text-sm"
                      disabled={maxTradeableAmount <= 0}
                    >
                      {percentage}% ({quickAmount.toFixed(2)})
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Total Price Display */}
            {amountNum > 0 && (
              <div className={`p-5 rounded-lg border-2 ${isBuy ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isBuy ? 'Total to Pay' : 'Total to Receive'}
                  </span>
                  <div className="flex items-center gap-2">
                    {isBuy ? (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-3xl font-bold ${isBuy ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {amountNum.toFixed(4)} {assetLabel} × ${offer.price.toFixed(2)} = ${totalPrice.toFixed(2)} USD
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {isBuy ? 'Select Payment Method' : 'Select Receiving Method'}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {offer.paymentMethods.map((method) => (
                  <Button
                    key={method}
                    variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedPaymentMethod(method);
                      setErrors(prev => ({ ...prev, payment: undefined }));
                    }}
                    className={`h-14 text-base font-medium transition-all ${
                      selectedPaymentMethod === method
                        ? isBuy
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                        : 'hover:border-gray-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    {method}
                    {selectedPaymentMethod === method && (
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                    )}
                  </Button>
                ))}
              </div>
              {errors.payment && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.payment}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Trade Limits & Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Trade Limits & Terms</p>
                  <div className="space-y-1 text-blue-800 dark:text-blue-300">
                    <p>• Min order: <span className="font-semibold">{offer.minLimit} {assetLabel}</span> (${(offer.minLimit * offer.price).toFixed(2)})</p>
                    <p>• Max order: <span className="font-semibold">{offer.maxLimit.toLocaleString()} {assetLabel}</span> (${(offer.maxLimit * offer.price).toFixed(2)})</p>
                    <p>• Payment time limit: <span className="font-semibold">{offer.timeLimit} minutes</span></p>
                  </div>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800">
                <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Your Balance</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{assetLabel}:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">
                        {(userBalance[assetLabel] ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">USD:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">
                        ${(userBalance.USD ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">USDT:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">
                        {(userBalance.USDT ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || !amount || amountNum <= 0 || !selectedPaymentMethod}
              className={`flex-1 h-12 text-base font-semibold ${
                isBuy
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
              } text-white`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isBuy ? (
                    <>
                      <ArrowUp className="w-5 h-5 mr-2" />
                      Place Buy Order
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-5 h-5 mr-2" />
                      Place Sell Order
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
