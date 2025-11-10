'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MarketPair {
  pair: string;
  price: string;
  change: number;
  changePercent: string;
}

// Dummy data - will be replaced with Bitget API
const marketPairs: MarketPair[] = [
  {
    pair: 'OXM/USD',
    price: '$1.05',
    change: 2.94,
    changePercent: '+2.94%'
  },
  {
    pair: 'OXM/ETH',
    price: '0.00042',
    change: -0.71,
    changePercent: '-0.71%'
  },
  {
    pair: 'OXM/BTC',
    price: '0.000025',
    change: 1.63,
    changePercent: '+1.63%'
  },
  {
    pair: 'OXM/USDT',
    price: '1.05',
    change: 2.12,
    changePercent: '+2.12%'
  }
];

export default function MarketOverview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {marketPairs.map((pair, index) => (
          <Card 
            key={index}
            className="group relative overflow-hidden border-2 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900"
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              pair.change >= 0 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' 
                : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30'
            }`}></div>
            
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${
                    pair.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {pair.pair}
                  </span>
                </div>
                {pair.change >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500 animate-pulse" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500 animate-pulse" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pair.price}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-semibold ${
                      pair.change >= 0
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                    }`}
                  >
                    {pair.changePercent}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    24h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
