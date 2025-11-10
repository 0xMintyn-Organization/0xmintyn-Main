'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Trade {
  date: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
}

// Dummy data - will be replaced with Bitget API
const tradeHistory: Trade[] = [
  {
    date: '2024-01-15 11:20',
    pair: 'OXM/USD',
    side: 'buy',
    price: 1.05,
    amount: 100,
    total: 105
  },
  {
    date: '2024-01-15 10:45',
    pair: 'OXM/USD',
    side: 'sell',
    price: 1.06,
    amount: 50,
    total: 53
  },
  {
    date: '2024-01-15 09:30',
    pair: 'OXM/USD',
    side: 'buy',
    price: 1.04,
    amount: 200,
    total: 208
  },
  {
    date: '2024-01-14 16:15',
    pair: 'OXM/USD',
    side: 'sell',
    price: 1.07,
    amount: 75,
    total: 80.25
  },
  {
    date: '2024-01-14 14:20',
    pair: 'OXM/USD',
    side: 'buy',
    price: 1.03,
    amount: 150,
    total: 154.5
  },
];

export default function TradeHistory() {
  if (tradeHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No trade history
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Pair</TableHead>
            <TableHead className="text-xs">Side</TableHead>
            <TableHead className="text-xs">Price</TableHead>
            <TableHead className="text-xs">Amount</TableHead>
            <TableHead className="text-xs">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tradeHistory.map((trade, index) => (
            <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
              <TableCell className="text-xs">{trade.date}</TableCell>
              <TableCell className="font-medium">{trade.pair}</TableCell>
              <TableCell>
                <Badge
                  className={`text-xs ${
                    trade.side === 'buy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {trade.side.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>${trade.price.toFixed(2)}</TableCell>
              <TableCell>{trade.amount}</TableCell>
              <TableCell className="font-semibold">${trade.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

