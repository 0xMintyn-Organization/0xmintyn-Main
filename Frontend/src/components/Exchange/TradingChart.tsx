'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceData {
  time: string;
  price: number;
  volume: number;
}

// Dummy data - will be replaced with Bitget API
const generatePriceData = (interval: string): PriceData[] => {
  const data: PriceData[] = [];
  const basePrice = 1.05;
  let currentPrice = basePrice;
  
  const intervals = {
    '1h': 60,
    '24h': 24,
    '7d': 7,
    '30d': 30
  };
  
  const count = intervals[interval as keyof typeof intervals] || 24;
  
  for (let i = 0; i < count; i++) {
    // Random price fluctuation
    const change = (Math.random() - 0.5) * 0.1;
    currentPrice = Math.max(0.9, Math.min(1.2, currentPrice + change));
    
    data.push({
      time: interval === '1h' 
        ? `${i}:00` 
        : interval === '24h'
        ? `${i}:00`
        : `${i + 1}${interval === '7d' ? 'd' : 'd'}`,
      price: Number(currentPrice.toFixed(4)),
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  return data;
};

const coinPairs = [
  { value: 'OXM/USD', label: 'OXM/USD' },
  { value: 'OXM/USDT', label: 'OXM/USDT' },
  { value: 'OXM/BTC', label: 'OXM/BTC' },
  { value: 'OXM/ETH', label: 'OXM/ETH' },
];

export default function TradingChart() {
  const [selectedPair, setSelectedPair] = useState('OXM/USD');
  const [timeInterval, setTimeInterval] = useState('24h');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  
  const priceData = generatePriceData(timeInterval);
  const currentPrice = priceData[priceData.length - 1]?.price || 1.05;
  const previousPrice = priceData[0]?.price || 1.05;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-zinc-900">
      <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Price Chart
            </CardTitle>
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {coinPairs.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-md border-2 border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${currentPrice.toFixed(4)}
                </span>
                {isPositive ? (
                  <TrendingUp className="w-6 h-6 text-green-500 animate-pulse" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-500 animate-pulse" />
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-sm font-bold ${
                  isPositive
                    ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                    : 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                }`}
              >
                {isPositive ? '+' : ''}{priceChangePercent}%
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Time Interval Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['1h', '24h', '7d', '30d'].map((interval) => (
            <Button
              key={interval}
              variant={timeInterval === interval ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeInterval(interval)}
              className={`font-semibold transition-all duration-200 ${
                timeInterval === interval
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md'
                  : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
              }`}
            >
              {interval}
            </Button>
          ))}
        </div>

        {/* Chart Type Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
            className={`font-semibold transition-all duration-200 ${
              chartType === 'area' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md' 
                : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
            }`}
          >
            Area
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            className={`font-semibold transition-all duration-200 ${
              chartType === 'line' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md' 
                : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
            }`}
          >
            Line
          </Button>
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? '#10b981' : '#ef4444'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? '#10b981' : '#ef4444'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            ) : (
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
            24h Volume
          </h4>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData}>
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

