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
import { 
  Shield, 
  Star, 
  Clock, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { P2POffer, UserBalance } from './P2PTrade';
import { toast } from 'sonner';

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
  }, [isOpen]);

  const amountNum = parseFloat(amount) || 0;
  const total = amountNum * offer.price;
  const isBuy = side === 'buy';
  const assetLabel = offer.asset ?? 'Asset';

  // Calculate available balance
  const availableBalance = isBuy
    ? Math.max(userBalance.USD ?? 0, userBalance.USDT ?? 0)
    : userBalance[assetLabel] ?? 0;

  // Validate amount
  const validateAmount = () => {
    const newErrors: { amount?: string; payment?: string } = {};

    if (!amount || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
      return newErrors;
    }

    if (amountNum < offer.minLimit) {
      newErrors.amount = `Minimum amount is ${offer.minLimit} ${assetLabel}`;
      return newErrors;
    }

    if (amountNum > offer.maxLimit) {
      newErrors.amount = `Maximum amount is ${offer.maxLimit} ${assetLabel}`;
      return newErrors;
    }

    if (amountNum > offer.available) {
      newErrors.amount = `Available amount is ${offer.available} ${assetLabel}`;
      return newErrors;
    }

    if (isBuy && total > availableBalance) {
      newErrors.amount = `Insufficient balance. Available: $${availableBalance.toFixed(2)}`;
      return newErrors;
    }

    if (!isBuy && amountNum > availableBalance) {
      newErrors.amount = `Insufficient ${assetLabel}. Available: ${availableBalance} ${assetLabel}`;
      return newErrors;
    }

    if (!selectedPaymentMethod) {
      newErrors.payment = 'Please select a payment method';
    }

    return newErrors;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const maxAmount = Math.min(
      offer.available,
      offer.maxLimit,
      isBuy ? availableBalance / offer.price : availableBalance
    );
    const quickAmount = (maxAmount * percentage / 100).toFixed(2);
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBuy ? 'Buy' : 'Sell'} {assetLabel} - {offer.traderName}
          </DialogTitle>
          <DialogDescription>
            Complete your {isBuy ? 'purchase' : 'sale'} of {assetLabel} with this trader
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Trader Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={offer.traderAvatar} />
              <AvatarFallback>
                {offer.traderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{offer.traderName}</p>
                {offer.isVerified && (
                  <Shield className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{offer.traderRating}</span>
                <span className="text-xs text-gray-500">
                  ({offer.completedTrades.toLocaleString()} trades, {offer.completionRate}% completion)
                </span>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
              <p className="text-xl font-bold">${offer.price.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available</p>
              <p className="text-xl font-bold">
                {offer.available.toLocaleString()} {assetLabel}
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({assetLabel})</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={errors.amount ? 'border-red-500' : ''}
              min={offer.minLimit}
              max={Math.min(offer.maxLimit, offer.available)}
              step="0.01"
            />
            {errors.amount && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.amount}
              </p>
            )}
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(percentage)}
                  className="flex-1 text-xs"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          {/* Total Calculation */}
          {amountNum > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {amountNum.toFixed(2)} {assetLabel} × ${offer.price.toFixed(2)} = ${total.toFixed(2)}
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {offer.paymentMethods.map((method) => (
                <Button
                  key={method}
                  variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedPaymentMethod(method);
                    setErrors(prev => ({ ...prev, payment: undefined }));
                  }}
                  className={`${
                    selectedPaymentMethod === method
                      ? isBuy
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                      : ''
                  }`}
                >
                  {method}
                </Button>
              ))}
            </div>
            {errors.payment && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.payment}
              </p>
            )}
          </div>

          {/* Trade Limits */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Trade Limits
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Min: {offer.minLimit} {assetLabel} | Max: {offer.maxLimit} {assetLabel}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Time Limit: {offer.timeLimit} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Balance Info */}
          <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Balance</p>
            <div className="flex justify-between text-sm">
              <span>{assetLabel}:</span>
              <span className="font-semibold">
                {(userBalance[assetLabel] ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>USD:</span>
              <span className="font-semibold">${(userBalance.USD ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>USDT:</span>
              <span className="font-semibold">{(userBalance.USDT ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !amount || amountNum <= 0}
            className={`${
              isBuy
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
            } text-white`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm ${isBuy ? 'Buy' : 'Sell'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

