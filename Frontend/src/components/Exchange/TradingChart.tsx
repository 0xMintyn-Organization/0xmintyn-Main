'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import useLiveTicker from '@/hooks/useLiveTicker';

interface PriceData {
  time: string;
  price: number;
  volume: number;
  timestamp: number;
}

const BITGET_BASE_URL = 'https://api.bitget.com';

const intervalConfig: Record<string, { granularityLabel: string; granularitySeconds: number; windowSeconds: number; limit: number }> = {
  '1m': { granularityLabel: '1min', granularitySeconds: 60, windowSeconds: 60 * 60, limit: 60 },
  '5m': { granularityLabel: '5min', granularitySeconds: 300, windowSeconds: 5 * 60 * 60, limit: 60 },
  '15m': { granularityLabel: '15min', granularitySeconds: 900, windowSeconds: 15 * 60 * 60, limit: 60 },
  '1h': { granularityLabel: '1min', granularitySeconds: 60, windowSeconds: 60 * 60, limit: 60 },
  '4h': { granularityLabel: '4h', granularitySeconds: 14400, windowSeconds: 4 * 60 * 60, limit: 36 },
  '24h': { granularityLabel: '1day', granularitySeconds: 86400, windowSeconds: 24 * 60 * 60, limit: 48 },
  '7d': { granularityLabel: '1week', granularitySeconds: 86400 * 7, windowSeconds: 7 * 24 * 60 * 60, limit: 26 },
  '30d': { granularityLabel: '1M', granularitySeconds: 86400 * 30, windowSeconds: 30 * 24 * 60 * 60, limit: 24 },
};

const DEFAULT_PAIR = 'BTCUSDT';

const coinPairs = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'OXMUSDT', label: 'OXM/USDT' },
];

export default function TradingChart() {
  const [selectedPair, setSelectedPair] = useState(DEFAULT_PAIR);
  const [timeInterval, setTimeInterval] = useState('24h');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePairs, setAvailablePairs] = useState<string[]>([]);
  const liveTicker = useLiveTicker();
  const previousLivePrice = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (liveTicker.price == null) return;
    if (previousLivePrice.current != null) {
      if (liveTicker.price > previousLivePrice.current) {
        setDirection('up');
      } else if (liveTicker.price < previousLivePrice.current) {
        setDirection('down');
      }
    }
    previousLivePrice.current = liveTicker.price;
  }, [liveTicker.price]);

  const fetchAvailablePairs = async () => {
    try {
      const url = new URL(`${BITGET_BASE_URL}/api/v2/spot/public/symbols`);
      const response = await fetch(url.toString());
      const payload = await response.json();
      if (response.ok && Array.isArray(payload.data)) {
        const symbols = payload.data.map((symbol: any) => symbol.symbol).filter(Boolean);
        setAvailablePairs(symbols);
        if (!symbols.includes(selectedPair)) {
          setSelectedPair(symbols[0] || DEFAULT_PAIR);
        }
      }
    } catch (fetchError) {
      console.error('Unable to load Bitget symbols:', fetchError);
    }
  };

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { granularityLabel, windowSeconds, limit } = intervalConfig[timeInterval];
      const url = new URL(`${BITGET_BASE_URL}/api/v2/spot/market/history-candles`);
      url.searchParams.set('symbol', selectedPair);
      url.searchParams.set('granularity', granularityLabel);
      url.searchParams.set('limit', String(limit));
      const endTime = Date.now();
      const startTime = endTime - windowSeconds * 1000;
      url.searchParams.set('endTime', String(endTime));
      url.searchParams.set('startTime', String(startTime));

      const response = await fetch(url.toString());
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Bitget API responded with an error');
      }

      const chartData: PriceData[] = (payload.data || []).map((row: string[]) => {
        const timestamp = Number(row[0]);
        const close = Number(row[2]);
        const volume = Number(row[5]);
        const date = new Date(timestamp);
        const formattedTime = timeInterval === '1h'
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString();

        return {
          time: formattedTime,
          price: close,
          volume,
          timestamp,
        };
      });

      chartData.sort((a, b) => a.timestamp - b.timestamp);
      setPriceData(chartData);
    } catch (fetchError: any) {
      setError(fetchError.message || 'Failed to fetch price data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailablePairs();
  }, []);

  useEffect(() => {
    if (selectedPair) {
      fetchPriceData();
    }
  }, [selectedPair, timeInterval]);
  const currentPrice = liveTicker.price ?? priceData[priceData.length - 1]?.price ?? 0;
  const previousPrice = liveTicker.price != null && priceData[0]?.price
    ? priceData[0].price
    : priceData[0]?.price ?? 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice
    ? ((priceChange / previousPrice) * 100).toFixed(2)
    : '0.00';
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
                {(availablePairs.length > 0 ? availablePairs : [DEFAULT_PAIR]).map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-md border-2 border-gray-200 dark:border-zinc-700 space-y-1 transition-all duration-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${currentPrice.toFixed(4)}
                </span>
                {direction === 'up' ? (
                  <TrendingUp className="w-6 h-6 text-green-500 animate-pulse" />
                ) : direction === 'down' ? (
                  <TrendingDown className="w-6 h-6 text-red-500 animate-pulse" />
                ) : null}
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
          {['1m','5m','15m','1h', '24h', '7d', '30d'].map((interval) => (
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

        {liveTicker.loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading live price…</p>
        )}
        {liveTicker.timestamp && (
          <p className="text-xs text-muted-foreground/70">
            Updated at {new Date(liveTicker.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}

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
        {loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Updating chart...</p>
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 mt-3">{error}</p>
        )}

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
