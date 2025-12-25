'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { p2pAPI } from '@/lib/api';
import { validateTradeAmount } from '@/utils/p2pValidation';

// Types
export interface P2POffer {
  id: string;
  traderId?: string;
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
  asset: string;
}

export type UserBalance = Record<string, number>;

// Mock data removed - Now using only real merchant ads from backend

const assetSymbols = [
  'OXM',
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

const fiatCurrencies = [
  { code: 'USD', label: 'USD', symbol: '$', badgeClass: 'bg-amber-500/90 text-white' },
  { code: 'USDT', label: 'USDT', symbol: '₮', badgeClass: 'bg-emerald-500 text-white' },
  { code: 'PKR', label: 'PKR', symbol: 'Rs', badgeClass: 'bg-green-600 text-white' },
  { code: 'NGN', label: 'NGN', symbol: '₦', badgeClass: 'bg-lime-500 text-gray-900' },
  { code: 'EUR', label: 'EUR', symbol: '€', badgeClass: 'bg-blue-600 text-white' },
] as const;

const mockUserBalance: UserBalance = {
  OXM: 5000,
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
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedAsset, setSelectedAsset] = useState<string>(assetSymbols[0]);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [selectedFiat, setSelectedFiat] = useState<(typeof fiatCurrencies)[number]['code']>(fiatCurrencies[0].code);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'trades'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<P2POffer | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendOffers, setBackendOffers] = useState<P2POffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Fetch offers from backend
  useEffect(() => {
    const loadOffers = async () => {
      try {
        setIsLoadingOffers(true);
        // Fetch all offers for the selected asset and correct side
        // When user wants to BUY, we show SELL offers (people selling)
        // When user wants to SELL, we show BUY offers (people buying)
        const requestedSide = activeTab === 'buy' ? 'sell' : 'buy';
        
        console.log('🔍 Fetching P2P offers:', {
          activeTab,
          selectedAsset,
          requestedSide,
          explanation: activeTab === 'buy' 
            ? 'User wants to BUY, so showing SELL offers (merchants selling)'
            : 'User wants to SELL, so showing BUY offers (merchants buying)'
        });
        
        const res = await p2pAPI.getAllOffers({
          asset: selectedAsset,
          side: requestedSide,
        });
        
        console.log('📥 P2P offers response:', {
          success: res.success,
          offersCount: res.offers?.length || 0,
          offers: res.offers?.slice(0, 3).map((o: any) => ({
            id: o.id,
            asset: o.asset,
            side: o.side,
            traderName: o.traderName,
            isOnline: o.isOnline,
          })) || []
        });

        if (res.success && res.offers && Array.isArray(res.offers)) {
          // Backend already filters by asset, side, and isOnline, so just transform
          const transformed: P2POffer[] = res.offers
            .filter((offer: any) => {
              // Double-check filtering (backend should handle this, but just in case)
              const matchesAsset = !selectedAsset || offer.asset === selectedAsset;
              const matchesSide = offer.side === requestedSide;
              const isOnline = offer.isOnline !== false;
              return matchesAsset && matchesSide && isOnline;
            })
            .map((offer: any) => ({
              id: offer.id || offer._id,
              traderId: offer.traderId || '',
              traderName: offer.traderName || 'Trader',
              traderRating: offer.traderRating || 0,
              completedTrades: offer.completedTrades || 0,
              completionRate: offer.completionRate || 0,
              responseRate: offer.responseRate || 0,
              responseTime: offer.responseTime || 15,
              price: offer.price,
              available: offer.available,
              minLimit: offer.minLimit,
              maxLimit: offer.maxLimit,
              paymentMethods: offer.paymentMethods || [],
              side: offer.side,
              timeLimit: offer.timeLimit,
              isVerified: offer.isVerified || false,
              isOnline: offer.isOnline !== false,
              asset: offer.asset,
            }));
          
          setBackendOffers(transformed);
        } else {
          setBackendOffers([]);
        }
      } catch (error: any) {
        console.error('Failed to load P2P offers:', error);
        // Fallback to empty array on error
        setBackendOffers([]);
      } finally {
        setIsLoadingOffers(false);
      }
    };

    loadOffers();
    
    // Auto-refresh offers every 30 seconds to show new merchant ads dynamically
    const refreshInterval = setInterval(() => {
      loadOffers();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [selectedAsset, activeTab]);

  // Use only real merchant ads from backend - no mock data
  const allOffers = useMemo(() => {
    // Only show real merchant ads from backend
    return backendOffers;
  }, [backendOffers]);

  const userBalance = mockUserBalance;
  const selectedAssetBalance = userBalance[selectedAsset] ?? 0;
  const usdBalance = userBalance.USD ?? 0;
  const usdtBalance = userBalance.USDT ?? 0;
  const activeFiat = fiatCurrencies.find((c) => c.code === selectedFiat) ?? fiatCurrencies[0];

  const visibleAssetCount = 12;
  const canShowMoreAssets = assetSymbols.length > visibleAssetCount;
  const displayedAssets = showAllAssets ? assetSymbols : assetSymbols.slice(0, visibleAssetCount);

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
    // Backend already filters by asset and side, so we just need to filter by online status
    // Logic: 
    // - User on "Buy" tab wants to BUY → show "sell" offers (merchants selling)
    // - User on "Sell" tab wants to SELL → show "buy" offers (merchants buying)
    let preFiltered = allOffers.filter(offer => {
      // Must match selected asset
      if (offer.asset !== selectedAsset) return false;
      // Must be online
      if (!offer.isOnline) return false;
      // Side is already filtered by backend API, but double-check:
      // When user wants to BUY (activeTab='buy'), show SELL offers
      // When user wants to SELL (activeTab='sell'), show BUY offers
      const expectedSide = activeTab === 'buy' ? 'sell' : 'buy';
      if (offer.side !== expectedSide) return false;
      return true;
    });

    let filtered = preFiltered.filter(offer => {
      // Search filter
      const matchesSearch = 
        !searchQuery.trim() ||
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
      // Prioritize backend offers (real merchant ads) over mock data
      // Backend offers have MongoDB ObjectId format, mock offers have format like "USDT-buy-0"
      const aIsBackend = !a.id.includes('-') || a.id.length > 20;
      const bIsBackend = !b.id.includes('-') || b.id.length > 20;
      
      if (aIsBackend && !bIsBackend) return -1; // Backend offers first
      if (!aIsBackend && bIsBackend) return 1;
      
      // If both are same type, sort by selected criteria
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

    // Truncate to show only top 20 offers (prioritizing backend offers)
    // This ensures new merchant ads are visible and the list is manageable
    return filtered.slice(0, 20);
  }, [allOffers, searchQuery, transactionAmount, selectedPaymentMethod, filterVerifiedOnly, filterOnlineOnly, sortBy, sortOrder]);

  const handleTradeClick = (offer: P2POffer) => {
    setSelectedOffer(offer);
    setIsTradeModalOpen(true);
  };

  const handleTradeConfirm = async (amount: number, paymentMethod: string) => {
    if (!selectedOffer) return;

    // Use centralized validation
    const validation = validateTradeAmount({
      amount,
      offer: selectedOffer,
      userBalance,
      side: activeTab,
      paymentMethod,
    });

    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid trade amount', {
        duration: 5000,
      });
      return;
    }

    // Create trade via backend API
    setIsProcessing(true);
    try {
      // Find the offer ID from the selected offer
      const offerId = selectedOffer.id; // This should be the MongoDB _id

      const res = await p2pAPI.createTrade({
        offerId,
        amount,
        paymentMethod,
      });

      if (res.success && res.trade) {
        toast.success(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`, {
          description: `${amount} ${selectedOffer.asset} at $${selectedOffer.price} per unit`,
        });

        setIsTradeModalOpen(false);
        setSelectedOffer(null);
        setTradeAmount('');
        setIsProcessing(false);

        // Redirect user to the Exchange order-based messenger
        router.push(`/exchange/messages?order=${encodeURIComponent(res.trade.id)}`);
      } else {
        throw new Error(res.message || 'Failed to create trade');
      }
    } catch (error: any) {
      console.error('Failed to create trade:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create trade', {
        duration: 5000,
      });
      setIsProcessing(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-3">
      {/* Merchant / Post Ad Buttons */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Post your own Buy/Sell ads (merchant mode)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={() => router.push('/exchange/p2p/merchant?intent=buy')}
          >
            Post Buy Ad
          </Button>
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={() => router.push('/exchange/p2p/merchant?intent=sell')}
          >
            Post Sell Ad
          </Button>
        </div>
      </div>

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
                {isLoadingOffers ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-zinc-800/50 rounded border border-gray-200 dark:border-zinc-700">
                    <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3 animate-spin" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading offers...</p>
                  </div>
                ) : filteredAndSortedOffers.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-zinc-800/50 rounded border border-gray-200 dark:border-zinc-700">
                    <Users className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No offers found</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {backendOffers.length > 0 
                        ? `Found ${backendOffers.length} backend offer(s) but they don't match current filters. Try adjusting your search or filters.`
                        : 'No offers available for this asset. Try creating an ad in P2P Merchant section.'}
                    </p>
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

