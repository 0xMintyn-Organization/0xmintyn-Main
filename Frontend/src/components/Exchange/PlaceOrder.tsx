'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function PlaceOrder() {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  
  // Calculate total
  const total = amount && price 
    ? (parseFloat(amount) * parseFloat(price)).toFixed(2)
    : amount && orderType === 'market'
    ? (parseFloat(amount) * 1.05).toFixed(2) // Use current market price
    : '0.00';

  const handlePlaceOrder = () => {
    // TODO: Connect to Bitget API for order placement
    console.log('Place Order:', { orderType, side, amount, price });
    // Placeholder for order placement
  };

  return (
    <div className="space-y-4">
      {/* Order Type Tabs */}
      <Tabs value={orderType} onValueChange={(value) => setOrderType(value as typeof orderType)}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
          <TabsTrigger 
            value="market" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-semibold transition-all duration-200"
          >
            Market
          </TabsTrigger>
          <TabsTrigger 
            value="limit"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-semibold transition-all duration-200"
          >
            Limit
          </TabsTrigger>
          <TabsTrigger 
            value="stop"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-semibold transition-all duration-200"
          >
            Stop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="mt-4">
          <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-rose-950/30 p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
            <div className="space-y-4">
              {/* Buy/Sell Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={side === 'buy' ? 'default' : 'outline'}
                  onClick={() => setSide('buy')}
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    side === 'buy'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md'
                      : 'border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button
                  variant={side === 'sell' ? 'default' : 'outline'}
                  onClick={() => setSide('sell')}
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    side === 'sell'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md'
                      : 'border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                  }`}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (OXM)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white dark:bg-zinc-800"
                />
              </div>

              {/* Market Price Display */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Market Price: <span className="font-semibold">$1.05</span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-lg font-bold">${total}</span>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                className={`w-full font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                  side === 'buy'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                } text-white`}
              >
                Place {side === 'buy' ? 'Buy' : 'Sell'} Order
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="limit" className="mt-4">
          <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-rose-950/30 p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
            <div className="space-y-4">
              {/* Buy/Sell Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={side === 'buy' ? 'default' : 'outline'}
                  onClick={() => setSide('buy')}
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    side === 'buy'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md'
                      : 'border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button
                  variant={side === 'sell' ? 'default' : 'outline'}
                  onClick={() => setSide('sell')}
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    side === 'sell'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md'
                      : 'border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                  }`}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (USD)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-white dark:bg-zinc-800"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (OXM)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white dark:bg-zinc-800"
                />
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-lg font-bold">${total}</span>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                className={`w-full font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                  side === 'buy'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                } text-white`}
              >
                Place {side === 'buy' ? 'Buy' : 'Sell'} Order
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="stop" className="mt-4">
          <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-rose-950/30 p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
            <div className="space-y-4">
              {/* Buy/Sell Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={side === 'buy' ? 'default' : 'outline'}
                  onClick={() => setSide('buy')}
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    side === 'buy'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md'
                      : 'border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button
                  variant={side === 'sell' ? 'default' : 'outline'}
                  onClick={() => setSide('sell')}
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    side === 'sell'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md'
                      : 'border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                  }`}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
              </div>

              {/* Stop Price Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stop Price (USD)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-white dark:bg-zinc-800"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (OXM)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white dark:bg-zinc-800"
                />
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-lg font-bold">${total}</span>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                className={`w-full font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                  side === 'buy'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                } text-white`}
              >
                Place {side === 'buy' ? 'Buy' : 'Sell'} Order
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

