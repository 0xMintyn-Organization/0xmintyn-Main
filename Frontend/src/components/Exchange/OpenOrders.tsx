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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface OpenOrder {
  date: string;
  pair: string;
  type: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  status: string;
}

// Dummy data - will be replaced with Bitget API
const openOrders: OpenOrder[] = [
  {
    date: '2024-01-15 10:30',
    pair: 'OXM/USD',
    type: 'Limit',
    side: 'buy',
    price: 1.04,
    amount: 100,
    total: 104,
    status: 'pending'
  },
  {
    date: '2024-01-15 09:15',
    pair: 'OXM/USD',
    type: 'Market',
    side: 'sell',
    price: 1.06,
    amount: 50,
    total: 53,
    status: 'partial'
  },
  {
    date: '2024-01-15 08:45',
    pair: 'OXM/USD',
    type: 'Stop',
    side: 'buy',
    price: 1.03,
    amount: 200,
    total: 206,
    status: 'pending'
  },
];

export default function OpenOrders() {
  const handleCancel = (order: OpenOrder) => {
    // TODO: Connect to Bitget API for order cancellation
    console.log('Cancel order:', order);
  };

  if (openOrders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No open orders
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
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Side</TableHead>
            <TableHead className="text-xs">Price</TableHead>
            <TableHead className="text-xs">Amount</TableHead>
            <TableHead className="text-xs">Total</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openOrders.map((order, index) => (
            <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
              <TableCell className="text-xs">{order.date}</TableCell>
              <TableCell className="font-medium">{order.pair}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {order.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={`text-xs ${
                    order.side === 'buy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {order.side.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>${order.price.toFixed(2)}</TableCell>
              <TableCell>{order.amount}</TableCell>
              <TableCell>${order.total.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    order.status === 'pending'
                      ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                      : 'border-blue-500 text-blue-700 dark:text-blue-400'
                  }
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(order)}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

