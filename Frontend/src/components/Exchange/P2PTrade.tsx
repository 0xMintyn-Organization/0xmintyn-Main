'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Users,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Grid3x3,
  List,
  X,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import OfferCard from './OfferCard';
import TradeModal from './TradeModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

// Mock data types - Replace with API types later
export interface P2POffer {
  id: string;
  traderName: string;
  traderAvatar?: string;
  traderRating: number;
  completedTrades: number;
  completionRate: number;
  responseRate: number;
  responseTime: number;
  price: number;
  available: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  side: 'buy' | 'sell';
  timeLimit: number;
  isVerified: boolean;
  isOnline: boolean;
  requiresVerification?: boolean;
  traderId?: string;
  asset: string;
}

export type UserBalance = Record<string, number>;

// Mock data - Replace with API calls
const baseBuyOffers: Omit<P2POffer, 'asset'>[] = [
  {
    id: '1',
    traderName: 'CryptoTrader_01',
    traderId: 'trader-1',
    traderRating: 4.9,
    completedTrades: 1247,
    completionRate: 98.5,
    responseRate: 99.1,
    responseTime: 15,
    price: 1.02,
    available: 5000,
    minLimit: 50,
    maxLimit: 5000,
    paymentMethods: ['Bank Transfer', 'PayPal', 'Wise'],
    side: 'buy',
    timeLimit: 15,
    isVerified: true,
    isOnline: true,
    requiresVerification: false,
  },
  {
    id: '2',
    traderName: 'OXM_Exchange',
    traderId: 'trader-2',
    traderRating: 4.8,
    completedTrades: 892,
    completionRate: 97.2,
    responseRate: 98.5,
    responseTime: 15,
    price: 1.03,
    available: 3000,
    minLimit: 100,
    maxLimit: 3000,
    paymentMethods: ['Bank Transfer', 'Revolut'],
    side: 'buy',
    timeLimit: 30,
    isVerified: true,
    isOnline: true,
    requiresVerification: true,
  },
  {
    id: '3',
    traderName: 'TrustedSeller',
    traderId: 'trader-3',
    traderRating: 5.0,
    completedTrades: 2156,
    completionRate: 99.1,
    responseRate: 100,
    responseTime: 15,
    price: 1.01,
    available: 8000,
    minLimit: 25,
    maxLimit: 8000,
    paymentMethods: ['PayPal', 'Wise', 'Bank Transfer'],
    side: 'buy',
    timeLimit: 20,
    isVerified: true,
    isOnline: false,
    requiresVerification: false,
  },
  {
    id: '4',
    traderName: 'QuickTrade_Pro',
    traderId: 'trader-4',
    traderRating: 4.7,
    completedTrades: 634,
    completionRate: 96.8,
    responseRate: 99.4,
    responseTime: 15,
    price: 1.04,
    available: 2000,
    minLimit: 50,
    maxLimit: 2000,
    paymentMethods: ['Bank Transfer'],
    side: 'buy',
    timeLimit: 15,
    isVerified: false,
    isOnline: true,
    requiresVerification: false,
  },
];

const baseSellOffers: Omit<P2POffer, 'asset'>[] = [
  {
    id: '5',
    traderName: 'Buyer_Expert',
    traderId: 'trader-5',
    traderRating: 4.9,
    completedTrades: 1890,
    completionRate: 98.8,
    responseRate: 99.2,
    responseTime: 15,
    price: 1.06,
    available: 6000,
    minLimit: 50,
    maxLimit: 6000,
    paymentMethods: ['Bank Transfer', 'PayPal'],
    side: 'sell',
    timeLimit: 15,
    isVerified: true,
    isOnline: true,
    requiresVerification: false,
  },
  {
    id: '6',
    traderName: 'FastBuyer',
    traderId: 'trader-6',
    traderRating: 4.8,
    completedTrades: 1123,
    completionRate: 97.5,
    responseRate: 98.7,
    responseTime: 20,
    price: 1.07,
    available: 4000,
    minLimit: 100,
    maxLimit: 4000,
    paymentMethods: ['Wise', 'Bank Transfer'],
    side: 'sell',
    timeLimit: 20,
    isVerified: true,
    isOnline: true,
    requiresVerification: true,
  },
  {
    id: '7',
    traderName: 'ReliableBuyer',
    traderId: 'trader-7',
    traderRating: 5.0,
    completedTrades: 2456,
    completionRate: 99.3,
    responseRate: 100,
    responseTime: 15,
    price: 1.05,
    available: 10000,
    minLimit: 25,
    maxLimit: 10000,
    paymentMethods: ['PayPal', 'Wise', 'Bank Transfer', 'Revolut'],
    side: 'sell',
    timeLimit: 30,
    isVerified: true,
    isOnline: false,
    requiresVerification: false,
  },
];

const assetSymbols = [
  'USDT',
  'BTC',
  'USDC',
  'FDUSD',
  'BNB',
  'ETH',
  'ADA',
  'SHIB',
  'DOGE',
  'TRX',
  'SOL',
  'PEPE',
  'TRUMP',
  '1000CHEEMS',
  'TST',
  'DOLO',
] as const;

const generateOffersForAsset = (
  symbol: string,
  index: number,
): { buy: P2POffer[]; sell: P2POffer[] } => {
  const priceFactor = 1 + index * 0.02;
  const availabilityFactor = 1 + index * 0.08;

  const mapOffer = (offer: Omit<P2POffer, 'asset'>, i: number, side: 'buy' | 'sell'): P2POffer => ({
    ...offer,
    id: `${symbol}-${side}-${i}`,
    asset: symbol,
    price: parseFloat((offer.price * priceFactor * (side === 'buy' ? 1 : 1.03)).toFixed(3)),
    available: Math.max(10, Math.round(offer.available * availabilityFactor)),
    minLimit: Math.max(5, Math.round(offer.minLimit * (1 + index * 0.03))),
    maxLimit: Math.max(offer.maxLimit, Math.round(offer.maxLimit * availabilityFactor)),
  });

  return {
    buy: baseBuyOffers.map((offer, i) => mapOffer(offer, i, 'buy')),
    sell: baseSellOffers.map((offer, i) => mapOffer(offer, i, 'sell')),
  };
};

const assetOfferCatalog: Record<string, { buy: P2POffer[]; sell: P2POffer[] }> = assetSymbols.reduce(
  (acc, symbol, index) => {
    acc[symbol] = generateOffersForAsset(symbol, index);
    return acc;
  },
  {} as Record<string, { buy: P2POffer[]; sell: P2POffer[] }>,
);

const fiatCurrencies = [
  { code: 'USD', label: 'USD', symbol: '$', badgeClass: 'bg-amber-500/90 text-white' },
  { code: 'USDT', label: 'USDT', symbol: '₮', badgeClass: 'bg-emerald-500 text-white' },
  { code: 'PKR', label: 'PKR', symbol: 'Rs', badgeClass: 'bg-green-600 text-white' },
  { code: 'NGN', label: 'NGN', symbol: '₦', badgeClass: 'bg-lime-500 text-gray-900' },
  { code: 'EUR', label: 'EUR', symbol: '€', badgeClass: 'bg-blue-600 text-white' },
] as const;

const mockUserBalance: UserBalance = {
  USD: 1500,
  USDT: 800,
  BTC: 0.85,
  ETH: 4.2,
  BNB: 6,
  ADA: 12500,
  SHIB: 2500000,
  DOGE: 50000,
  TRX: 4000,
  SOL: 180,
  PEPE: 150000000,
  TRUMP: 80,
  '1000CHEEMS': 120,
  TST: 1500,
  DOLO: 900,
  FDUSD: 600,
  USDC: 900,
};

export default function P2PTrade() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedAsset, setSelectedAsset] = useState<string>(assetSymbols[0]);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [selectedFiat, setSelectedFiat] = useState<(typeof fiatCurrencies)[number]['code']>(fiatCurrencies[0].code);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table'); // New: View mode toggle
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionAmount, setTransactionAmount] = useState(''); // New: Transaction amount filter
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all'); // New: Payment method filter
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'trades'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMoreFilters, setShowMoreFilters] = useState(false); // New: More filters toggle
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false); // New: Verified only filter
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false); // New: Online only filter
  const [selectedOffer, setSelectedOffer] = useState<P2POffer | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [userBalance] = useState<UserBalance>(mockUserBalance);
  const [isProcessing, setIsProcessing] = useState(false);
  const selectedAssetBalance = userBalance[selectedAsset] ?? 0;
  const usdBalance = userBalance.USD ?? 0;
  const usdtBalance = userBalance.USDT ?? 0;
  const activeFiat = fiatCurrencies.find((c) => c.code === selectedFiat) ?? fiatCurrencies[0];

  const visibleAssetCount = 12;
  const canShowMoreAssets = assetSymbols.length > visibleAssetCount;
  const displayedAssets = showAllAssets ? assetSymbols : assetSymbols.slice(0, visibleAssetCount);
  const offersForAsset = assetOfferCatalog[selectedAsset] ?? assetOfferCatalog[assetSymbols[0]];

  // Get offers based on active tab
  const allOffers = activeTab === 'buy' ? offersForAsset.buy : offersForAsset.sell;

  // Get all unique payment methods
  const allPaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    allOffers.forEach(offer => {
      offer.paymentMethods.forEach(method => methods.add(method));
    });
    return Array.from(methods).sort();
  }, [allOffers]);

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = allOffers.filter(offer => {
      // Search filter
      const matchesSearch = 
        offer.traderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.paymentMethods.some(method => 
          method.toLowerCase().includes(searchQuery.toLowerCase())
        );
      if (!matchesSearch) return false;

      // Transaction amount filter
      if (transactionAmount) {
        const amount = parseFloat(transactionAmount);
        if (!isNaN(amount)) {
          const minUSD = offer.minLimit * offer.price;
          const maxUSD = offer.maxLimit * offer.price;
          if (amount < minUSD || amount > maxUSD) return false;
        }
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'all') {
        if (!offer.paymentMethods.includes(selectedPaymentMethod)) return false;
      }

      // Verified only filter
      if (filterVerifiedOnly && !offer.isVerified) return false;

      // Online only filter
      if (filterOnlineOnly && !offer.isOnline) return false;

      return true;
    });

    // Sort offers
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = a.traderRating - b.traderRating;
          break;
        case 'trades':
          comparison = a.completedTrades - b.completedTrades;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allOffers, searchQuery, transactionAmount, selectedPaymentMethod, filterVerifiedOnly, filterOnlineOnly, sortBy, sortOrder]);

  const handleTradeClick = (offer: P2POffer) => {
    setSelectedOffer(offer);
    setIsTradeModalOpen(true);
  };

  const handleTradeConfirm = async (amount: number) => {
    if (!selectedOffer) return;

    setIsProcessing(true);
    
    // Validate balance
    if (activeTab === 'buy') {
      const requiredFiat = amount * selectedOffer.price;
      if ((userBalance.USD ?? 0) < requiredFiat && (userBalance.USDT ?? 0) < requiredFiat) {
        toast.error('Insufficient USD/USDT balance for this purchase');
        setIsProcessing(false);
        return;
      }
    } else {
      const assetBalance = userBalance[selectedOffer.asset] ?? 0;
      if (assetBalance < amount) {
        toast.error(`Insufficient ${selectedOffer.asset} balance`);
        setIsProcessing(false);
        return;
      }
    }

    // Validate limits
    if (amount < selectedOffer.minLimit || amount > selectedOffer.maxLimit) {
      toast.error(
        `Amount must be between ${selectedOffer.minLimit} and ${selectedOffer.maxLimit} ${selectedOffer.asset}`,
      );
      setIsProcessing(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Replace with actual API call
      // await tradeP2P({
      //   offerId: selectedOffer.id,
      //   amount,
      //   side: activeTab,
      // });

      toast.success(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`, {
        description: `${amount} ${selectedOffer.asset} at $${selectedOffer.price} per unit`,
      });

      setIsTradeModalOpen(false);
      setSelectedOffer(null);
      setTradeAmount('');
    } catch (error) {
      toast.error('Trade failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-3">
      {/* Balance Display - Compact */}
      <Card className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{selectedAsset}:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {selectedAssetBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">USD:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${usdBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">USDT:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {usdtBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Selector */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {displayedAssets.map((symbol) => (
            <button
              key={symbol}
              onClick={() => setSelectedAsset(symbol)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                selectedAsset === symbol
                  ? 'bg-gray-900 text-amber-300 dark:bg-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {symbol}
            </button>
          ))}
          {canShowMoreAssets && (
            <button
              onClick={() => setShowAllAssets((prev) => !prev)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {showAllAssets ? 'Less' : 'More'}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showAllAssets ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Main Trading Section */}
      <Card className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Buy/Sell Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-zinc-800 h-9 rounded-md p-0.5">
                <TabsTrigger 
                  value="buy"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-normal text-xs px-3 py-1.5 h-8"
                >
                  Buy
                </TabsTrigger>
                <TabsTrigger 
                  value="sell"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-normal text-xs px-3 py-1.5 h-8"
                >
                  Sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 space-y-1.5">
                {/* Binance-style Filters - Compact & Small */}
                <div className="space-y-1.5">
                  {/* First Row: Transaction Amount, Payment Method, More Filters, Sort */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {/* Transaction Amount Input */}
                    <div className="relative flex-1 min-w-[160px]">
                      <div className="flex items-center h-7 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-within:ring-1 focus-within:ring-gray-400 dark:focus-within:ring-zinc-500">
                        <Input
                          type="number"
                          placeholder="Transaction amount"
                          value={transactionAmount}
                          onChange={(e) => setTransactionAmount(e.target.value)}
                          className="h-full flex-1 border-0 bg-transparent text-[11px] px-2 py-1 focus-visible:ring-0 focus-visible:outline-none"
                        />
                        <div className="flex items-center gap-1 pl-2 pr-1 border-l border-gray-200 dark:border-zinc-700 h-full">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${activeFiat.badgeClass}`}
                          >
                            {activeFiat.symbol}
                          </span>
                          <Select value={selectedFiat} onValueChange={(value) => setSelectedFiat(value as typeof selectedFiat)}>
                            <SelectTrigger className="h-6 w-[68px] border-0 bg-transparent text-[11px] px-1 py-0 focus:ring-0 focus:ring-offset-0">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              {fiatCurrencies.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Filter */}
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger className="w-[140px] h-7 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-[11px] px-2 py-1">
                        <SelectValue placeholder="All payment methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All payment methods</SelectItem>
                        {allPaymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* More Filters Button */}
                    <Popover open={showMoreFilters} onOpenChange={setShowMoreFilters}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-7 px-2 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-[11px]"
                        >
                          <Filter className="w-3 h-3 mr-1" />
                          More Filters
                          {showMoreFilters && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-3" align="end">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-900 dark:text-gray-100">Advanced Filters</Label>
                            <div className="flex items-center space-x-2 pt-1">
                              <Checkbox
                                id="verified-only"
                                checked={filterVerifiedOnly}
                                onCheckedChange={(checked) => setFilterVerifiedOnly(checked as boolean)}
                                className="h-3.5 w-3.5"
                              />
                              <Label htmlFor="verified-only" className="cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                                Verified traders only
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="online-only"
                                checked={filterOnlineOnly}
                                onCheckedChange={(checked) => setFilterOnlineOnly(checked as boolean)}
                                className="h-3.5 w-3.5"
                              />
                              <Label htmlFor="online-only" className="cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                                Online traders only
                              </Label>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Sort By */}
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger className="w-[110px] h-7 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-[11px] px-2 py-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Sort by Price</SelectItem>
                        <SelectItem value="rating">Sort by Rating</SelectItem>
                        <SelectItem value="trades">Sort by Trades</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Sort Order Toggle */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleSortOrder}
                      className="h-7 w-7 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>

                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 overflow-hidden">
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('table')}
                        className={`h-7 w-7 rounded-none ${viewMode === 'table' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400'}`}
                      >
                        <List className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={viewMode === 'cards' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('cards')}
                        className={`h-7 w-7 rounded-none ${viewMode === 'cards' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400'}`}
                      >
                        <Grid3x3 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <Input
                      placeholder="Search trader name or payment method..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-7 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-[11px]"
                    />
                  </div>
                </div>

                {/* Offers Display - Table or Cards */}
                {filteredAndSortedOffers.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-zinc-800/50 rounded border border-gray-200 dark:border-zinc-700">
                    <Users className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No offers found</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : viewMode === 'table' ? (
                  /* Table View (Binance-style) - Compact & Clean */
                  <div className="border border-gray-200 dark:border-zinc-800 rounded overflow-x-auto">
                    <div className="min-w-full inline-block">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700">
                            <th className="min-w-[260px] text-left text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase py-2 px-2.5">Advertisers</th>
                            <th className="min-w-[90px] text-left text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase py-2 px-2.5">Price</th>
                            <th className="min-w-[170px] text-left text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase py-2 px-2.5">Available/Order Limit</th>
                            <th className="min-w-[150px] text-left text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase py-2 px-2.5">Payment</th>
                            <th className="min-w-[110px] text-right text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase py-2 px-2.5">Trade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedOffers.map((offer) => (
                            <tr key={offer.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-800 transition-colors">
                              <td className="py-2.5 px-2.5 align-top">
                                <div className="flex items-start gap-2 min-w-0">
                                  <div className="relative flex-shrink-0">
                                    <Avatar className="w-7 h-7 border border-gray-200 dark:border-zinc-700">
                                      <AvatarImage src={offer.traderAvatar} />
                                      <AvatarFallback className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                                        {offer.traderName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {offer.isOnline && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
                                      <Link
                                        href={`/exchange?mode=p2p&trader=${encodeURIComponent(offer.traderId || offer.id)}`}
                                        className="font-medium text-xs text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:underline truncate transition-colors"
                                        title={offer.traderName}
                                      >
                                        {offer.traderName}
                                      </Link>
                                    {offer.isVerified && (
                                      <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                    )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                                      <span>{offer.completedTrades.toLocaleString()} orders</span>
                                      <span className="text-gray-400">•</span>
                                      <span>{offer.completionRate}% completion</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400 leading-tight mt-0.5">
                                      <span>{offer.responseRate}%</span>
                                      <span className="text-gray-400">•</span>
                                      <div className="flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                        <span>{offer.responseTime} min</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 align-top">
                                <div className="font-medium text-xs text-gray-900 dark:text-gray-100">
                                  ${offer.price.toFixed(3)}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {offer.asset}/USD
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 align-top">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-xs text-gray-900 dark:text-gray-100">
                                    {offer.available.toLocaleString()} {offer.asset}
                                  </div>
                                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                    ${(offer.minLimit * offer.price).toFixed(2)} - ${(offer.maxLimit * offer.price).toFixed(2)}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 align-top">
                                <div className="flex flex-wrap gap-1">
                                  {offer.paymentMethods.slice(0, 2).map((method, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 h-4.5">
                                      {method}
                                    </Badge>
                                  ))}
                                  {offer.paymentMethods.length > 2 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 h-4.5">
                                      +{offer.paymentMethods.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="text-right py-2.5 px-2.5 align-top">
                                <div className="flex flex-col items-end gap-1">
                                  <Button
                                    onClick={() => handleTradeClick(offer)}
                                    size="sm"
                                    className={`h-7 px-2.5 text-[11px] font-normal ${
                                      activeTab === 'buy'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                  >
                                    {activeTab === 'buy' ? 'Buy' : 'Sell'} {offer.asset}
                                  </Button>
                                  {offer.requiresVerification && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 text-amber-600 dark:text-amber-500 border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                                      Requires Verification
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Card View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        onTradeClick={() => handleTradeClick(offer)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Trade Modal */}
      {selectedOffer && (
        <TradeModal
          isOpen={isTradeModalOpen}
          onClose={() => {
            setIsTradeModalOpen(false);
            setSelectedOffer(null);
            setTradeAmount('');
          }}
          offer={selectedOffer}
          side={activeTab}
          userBalance={userBalance}
          onConfirm={handleTradeConfirm}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

