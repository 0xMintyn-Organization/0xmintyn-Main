'use client';

import React, { useState } from 'react';
import { CreditCard, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface PaymentMethodDetail {
  method: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  IBAN?: string;
  SWIFT?: string;
  routingNumber?: string;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  notes?: string;
}

interface PaymentDetailsCardProps {
  paymentMethod: string;
  totalAmount: number;
  paymentDetails: PaymentMethodDetail | null;
  loading?: boolean;
}

export default function PaymentDetailsCard({
  paymentMethod,
  totalAmount,
  paymentDetails,
  loading = false,
}: PaymentDetailsCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-8 w-8 p-0"
    >
      {copiedField === field ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading payment details...</span>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Payment details for {paymentMethod} are not available. Please contact the seller.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Payment Details - {paymentMethod}
        </h3>
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
        Send <span className="font-bold">${totalAmount.toFixed(2)}</span> to the seller using the details below:
      </p>
      <div className="space-y-2">
        {/* Easypaisa / JazzCash */}
        {(paymentMethod === 'Easypaisa' || paymentMethod === 'JazzCash') && (
          <>
            {paymentDetails.phoneNumber && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.phoneNumber}
                  </p>
                </div>
                <CopyButton text={paymentDetails.phoneNumber} field="phone" />
              </div>
            )}
            {paymentDetails.accountHolderName && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Holder Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.accountHolderName}
                  </p>
                </div>
                <CopyButton text={paymentDetails.accountHolderName} field="name" />
              </div>
            )}
          </>
        )}

        {/* Bank Transfer */}
        {paymentMethod === 'Bank Transfer' && (
          <>
            {paymentDetails.accountNumber && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Number</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.accountNumber}
                  </p>
                </div>
                <CopyButton text={paymentDetails.accountNumber} field="account" />
              </div>
            )}
            {paymentDetails.accountHolderName && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Holder Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.accountHolderName}
                  </p>
                </div>
                <CopyButton text={paymentDetails.accountHolderName} field="name" />
              </div>
            )}
            {paymentDetails.bankName && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bank Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.bankName}
                  </p>
                </div>
                <CopyButton text={paymentDetails.bankName} field="bank" />
              </div>
            )}
            {paymentDetails.IBAN && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">IBAN</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.IBAN}
                  </p>
                </div>
                <CopyButton text={paymentDetails.IBAN} field="iban" />
              </div>
            )}
          </>
        )}

        {/* Wise / PayPal */}
        {(paymentMethod === 'Wise' || paymentMethod === 'PayPal') && (
          <>
            {paymentDetails.email && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.email}
                  </p>
                </div>
                <CopyButton text={paymentDetails.email} field="email" />
              </div>
            )}
            {paymentDetails.accountHolderName && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Holder Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.accountHolderName}
                  </p>
                </div>
                <CopyButton text={paymentDetails.accountHolderName} field="name" />
              </div>
            )}
          </>
        )}

        {/* Revolut */}
        {paymentMethod === 'Revolut' && (
          <>
            {paymentDetails.email && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.email}
                  </p>
                </div>
                <CopyButton text={paymentDetails.email} field="email" />
              </div>
            )}
            {paymentDetails.phoneNumber && (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {paymentDetails.phoneNumber}
                  </p>
                </div>
                <CopyButton text={paymentDetails.phoneNumber} field="phone" />
              </div>
            )}
          </>
        )}

        {/* Notes */}
        {paymentDetails.notes && (
          <div className="p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{paymentDetails.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

