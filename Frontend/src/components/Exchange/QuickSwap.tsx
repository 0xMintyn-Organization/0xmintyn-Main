'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownUp, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Dummy data - will be replaced with Bitget API
const availableTokens = ['OXM', 'USD', 'USDT', 'BTC', 'ETH'];

export default function QuickSwap() {
  const [fromToken, setFromToken] = useState('OXM');
  const [toToken, setToToken] = useState('USD');
  const [amount, setAmount] = useState('');
  
  // Dummy conversion rate - will be replaced with Bitget API
  const conversionRate = 1.05;
  const convertedAmount = amount ? (parseFloat(amount) * conversionRate).toFixed(2) : '0.00';

  const handleSwap = () => {
    // TODO: Connect to Bitget API for swap
    console.log('Swap:', { fromToken, toToken, amount });
    // Placeholder for wallet connection and swap execution
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              From
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
              />
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-32 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapTokens}
              className="rounded-full border-2 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-110 transition-transform duration-200 shadow-md"
            >
              <ArrowDownUp className="w-4 h-4 text-purple-600" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={convertedAmount}
                readOnly
                className="flex-1 bg-gray-100 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600"
              />
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-32 bg-white dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            1 {fromToken} = {conversionRate} {toToken}
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Swap Now
          </Button>
        </div>
      </Card>
    </div>
  );
}

