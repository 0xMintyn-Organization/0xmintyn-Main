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

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
}

// Dummy data - will be replaced with Bitget API WebSocket
const buyOrders: OrderBookEntry[] = [
  { price: 1.06, amount: 500, total: 530, type: 'buy' },
  { price: 1.05, amount: 1000, total: 1050, type: 'buy' },
  { price: 1.04, amount: 750, total: 780, type: 'buy' },
  { price: 1.03, amount: 1200, total: 1236, type: 'buy' },
  { price: 1.02, amount: 800, total: 816, type: 'buy' },
];

const sellOrders: OrderBookEntry[] = [
  { price: 1.07, amount: 600, total: 642, type: 'sell' },
  { price: 1.08, amount: 900, total: 972, type: 'sell' },
  { price: 1.09, amount: 1100, total: 1199, type: 'sell' },
  { price: 1.10, amount: 700, total: 770, type: 'sell' },
  { price: 1.11, amount: 850, total: 943.5, type: 'sell' },
];

export default function OrderBook() {
  return (
    <div className="space-y-4">
      {/* Sell Orders (Asks) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
            Sell Orders
          </h4>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Price | Amount | Total
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-red-600 dark:text-red-400">Price (USD)</TableHead>
                <TableHead className="text-red-600 dark:text-red-400">Amount (OXM)</TableHead>
                <TableHead className="text-red-600 dark:text-red-400">Total (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellOrders.map((order, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer"
                >
                  <TableCell className="font-medium text-red-600 dark:text-red-400">
                    ${order.price.toFixed(2)}
                  </TableCell>
                  <TableCell>{order.amount.toLocaleString()}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Current Price */}
      <div className="text-center py-2 border-t border-b border-gray-200 dark:border-zinc-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Current Price</span>
        <p className="text-xl font-bold text-green-600 dark:text-green-400">$1.05</p>
      </div>

      {/* Buy Orders (Bids) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">
            Buy Orders
          </h4>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Price | Amount | Total
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-green-600 dark:text-green-400">Price (USD)</TableHead>
                <TableHead className="text-green-600 dark:text-green-400">Amount (OXM)</TableHead>
                <TableHead className="text-green-600 dark:text-green-400">Total (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyOrders.map((order, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer"
                >
                  <TableCell className="font-medium text-green-600 dark:text-green-400">
                    ${order.price.toFixed(2)}
                  </TableCell>
                  <TableCell>{order.amount.toLocaleString()}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

