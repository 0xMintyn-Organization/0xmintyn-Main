'use client';

import { useMemo, useState } from 'react';
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
import useMarketPrices from '@/hooks/useMarketPrices';

export default function CoinRates() {
  const [searchQuery, setSearchQuery] = useState('');
  const { prices, loading } = useMarketPrices();

  const normalized = useMemo(() => {
    return Object.values(prices).filter((price) =>
      price.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prices, searchQuery]);

  return (
    <Card className="shadow-xl border border-gray-100 dark:border-zinc-800">
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
        {loading && <p className="text-sm text-gray-500">Loading prices…</p>}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Pair</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold text-right">Change</TableHead>
                <TableHead className="font-semibold text-right">High</TableHead>
                <TableHead className="font-semibold text-right">Low</TableHead>
                <TableHead className="font-semibold text-right">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalized.map((coin) => (
                <TableRow
                  key={coin.symbol}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <TableCell className="font-medium">{coin.symbol}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {coin.price != null
                      ? coin.price >= 1
                        ? `$${coin.price.toLocaleString()}`
                        : coin.price.toFixed(6)
                      : '––'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {coin.change != null && coin.change >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <Badge
                        variant="outline"
                        className={
                          coin.change != null && coin.change >= 0
                            ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        }
                      >
                        {coin.change != null ? `${coin.change >= 0 ? '+' : ''}${coin.change.toFixed(2)}` : '––'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">
                    {coin.high != null ? `$${coin.high.toFixed(4)}` : '––'}
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    {coin.low != null ? `$${coin.low.toFixed(4)}` : '––'}
                  </TableCell>
                  <TableCell className="text-right text-gray-600 dark:text-gray-400">
                    {coin.volume != null ? `${coin.volume.toLocaleString()}` : '––'}
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
