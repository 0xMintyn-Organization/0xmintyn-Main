'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MarketOverview from '@/components/Exchange/MarketOverview';
import TradingVolume from '@/components/Exchange/TradingVolume';
import QuickSwap from '@/components/Exchange/QuickSwap';
import OrderBook from '@/components/Exchange/OrderBook';
import PlaceOrder from '@/components/Exchange/PlaceOrder';
import OpenOrders from '@/components/Exchange/OpenOrders';
import TradeHistory from '@/components/Exchange/TradeHistory';
import TradingChart from '@/components/Exchange/TradingChart';
import CoinRates from '@/components/Exchange/CoinRates';
import KycStatusCard from '@/components/Exchange/KycStatusCard';
import Protected from '@/hooks/useProtected';
import { TrendingUp, Wallet, Activity, BarChart3, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExchangePage() {
  return (
    <Protected>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Enhanced Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-700 to-green-600 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                      0xMintyn Exchange
                      <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                        Live
                      </Badge>
                    </h1>
                    <p className="text-green-100 mt-1 text-lg">
                      Trade 0xMintyn tokens with USD, USDT, BTC, and ETH
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Balance Card */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="w-5 h-5 text-white" />
                      <p className="text-sm text-green-100 font-medium">Total Balance</p>
                    </div>
                    <p className="text-3xl font-bold text-white">1,000 OXM</p>
                    <p className="text-sm text-green-100 mt-1">≈ $1,050.00 USD</p>
                  </CardContent>
                </Card>
                
                {/* Stats Card */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-white" />
                      <p className="text-sm text-green-100 font-medium">24h Volume</p>
                    </div>
                    <p className="text-3xl font-bold text-white">$1.2M</p>
                    <p className="text-sm text-green-100 mt-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +12.5%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* KYC Status */}
          <KycStatusCard />

          {/* Top Row: Market Overview & Quick Swap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Overview */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <MarketOverview />
                <TradingVolume />
              </CardContent>
            </Card>

            {/* Quick Swap */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Quick Swap
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <QuickSwap />
              </CardContent>
            </Card>
          </div>

          {/* Middle Row: Order Book & Place Order */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Book */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardTitle className="text-xl font-bold">Order Book</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <OrderBook />
              </CardContent>
            </Card>

            {/* Place Order */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                <CardTitle className="text-xl font-bold">Place Order</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <PlaceOrder />
              </CardContent>
            </Card>
          </div>

          {/* Trading Chart - Full Width */}
          <div className="grid grid-cols-1 gap-6">
            <TradingChart />
          </div>

          {/* Coin Rates Table - Full Width */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CoinRates />
            </Card>
          </div>

          {/* Bottom Row: Open Orders & Trade History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Open Orders */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
                <CardTitle className="text-xl font-bold">Open Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <OpenOrders />
              </CardContent>
            </Card>

            {/* Trade History */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <CardTitle className="text-xl font-bold">Trade History</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TradeHistory />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Protected>
  );
}
