'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';

interface CoinRate {
  pair: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

// Dummy data - will be replaced with Bitget API
const coinRates: CoinRate[] = [
  {
    pair: 'OXM/USD',
    price: 1.05,
    change24h: 0.03,
    changePercent: 2.94,
    volume24h: 1234567,
    high24h: 1.08,
    low24h: 1.02
  },
  {
    pair: 'OXM/USDT',
    price: 1.05,
    change24h: 0.02,
    changePercent: 1.94,
    volume24h: 987654,
    high24h: 1.07,
    low24h: 1.03
  },
  {
    pair: 'OXM/BTC',
    price: 0.000025,
    change24h: 0.000001,
    changePercent: 4.17,
    volume24h: 567890,
    high24h: 0.000027,
    low24h: 0.000024
  },
  {
    pair: 'OXM/ETH',
    price: 0.00042,
    change24h: -0.000003,
    changePercent: -0.71,
    volume24h: 456789,
    high24h: 0.00045,
    low24h: 0.00040
  },
  {
    pair: 'BTC/USD',
    price: 42000,
    change24h: 500,
    changePercent: 1.21,
    volume24h: 50000000,
    high24h: 42500,
    low24h: 41800
  },
  {
    pair: 'ETH/USD',
    price: 2500,
    change24h: -25,
    changePercent: -0.99,
    volume24h: 30000000,
    high24h: 2550,
    low24h: 2480
  },
];

export default function CoinRates() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRates = coinRates.filter((coin) =>
    coin.pair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Coin Rates</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Pair</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold text-right">24h Change</TableHead>
                <TableHead className="font-semibold text-right">24h Volume</TableHead>
                <TableHead className="font-semibold text-right">24h High</TableHead>
                <TableHead className="font-semibold text-right">24h Low</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.map((coin, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <TableCell className="font-medium">{coin.pair}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {coin.pair.includes('BTC') && !coin.pair.includes('OXM')
                      ? `$${coin.price.toLocaleString()}`
                      : coin.pair.includes('ETH') && !coin.pair.includes('OXM')
                      ? `$${coin.price.toLocaleString()}`
                      : coin.pair.includes('BTC')
                      ? coin.price.toFixed(8)
                      : coin.pair.includes('ETH')
                      ? coin.price.toFixed(6)
                      : `$${coin.price.toFixed(4)}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {coin.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <Badge
                        variant="outline"
                        className={
                          coin.changePercent >= 0
                            ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        }
                      >
                        {coin.changePercent >= 0 ? '+' : ''}
                        {coin.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-gray-600 dark:text-gray-400">
                    ${coin.volume24h.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">
                    {coin.pair.includes('BTC') && !coin.pair.includes('OXM')
                      ? `$${coin.high24h.toLocaleString()}`
                      : coin.pair.includes('ETH') && !coin.pair.includes('OXM')
                      ? `$${coin.high24h.toLocaleString()}`
                      : coin.pair.includes('BTC')
                      ? coin.high24h.toFixed(8)
                      : coin.pair.includes('ETH')
                      ? coin.high24h.toFixed(6)
                      : `$${coin.high24h.toFixed(4)}`}
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    {coin.pair.includes('BTC') && !coin.pair.includes('OXM')
                      ? `$${coin.low24h.toLocaleString()}`
                      : coin.pair.includes('ETH') && !coin.pair.includes('OXM')
                      ? `$${coin.low24h.toLocaleString()}`
                      : coin.pair.includes('BTC')
                      ? coin.low24h.toFixed(8)
                      : coin.pair.includes('ETH')
                      ? coin.low24h.toFixed(6)
                      : `$${coin.low24h.toFixed(4)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

