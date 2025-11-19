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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import OfferCard from './OfferCard';
import TradeModal from './TradeModal';

// Mock data types - Replace with API types later
export interface P2POffer {
  id: string;
  traderName: string;
  traderAvatar?: string;
  traderRating: number;
  completedTrades: number;
  completionRate: number;
  price: number;
  available: number; // Available amount in OXM
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  side: 'buy' | 'sell';
  timeLimit: number; // Minutes
  isVerified: boolean;
  isOnline: boolean;
}

export interface UserBalance {
  OXM: number;
  USD: number;
  USDT: number;
}

// Mock data - Replace with API calls
const mockBuyOffers: P2POffer[] = [
  {
    id: '1',
    traderName: 'CryptoTrader_01',
    traderRating: 4.9,
    completedTrades: 1247,
    completionRate: 98.5,
    price: 1.02,
    available: 5000,
    minLimit: 50,
    maxLimit: 5000,
    paymentMethods: ['Bank Transfer', 'PayPal', 'Wise'],
    side: 'buy',
    timeLimit: 15,
    isVerified: true,
    isOnline: true,
  },
  {
    id: '2',
    traderName: 'OXM_Exchange',
    traderRating: 4.8,
    completedTrades: 892,
    completionRate: 97.2,
    price: 1.03,
    available: 3000,
    minLimit: 100,
    maxLimit: 3000,
    paymentMethods: ['Bank Transfer', 'Revolut'],
    side: 'buy',
    timeLimit: 30,
    isVerified: true,
    isOnline: true,
  },
  {
    id: '3',
    traderName: 'TrustedSeller',
    traderRating: 5.0,
    completedTrades: 2156,
    completionRate: 99.1,
    price: 1.01,
    available: 8000,
    minLimit: 25,
    maxLimit: 8000,
    paymentMethods: ['PayPal', 'Wise', 'Bank Transfer'],
    side: 'buy',
    timeLimit: 20,
    isVerified: true,
    isOnline: false,
  },
  {
    id: '4',
    traderName: 'QuickTrade_Pro',
    traderRating: 4.7,
    completedTrades: 634,
    completionRate: 96.8,
    price: 1.04,
    available: 2000,
    minLimit: 50,
    maxLimit: 2000,
    paymentMethods: ['Bank Transfer'],
    side: 'buy',
    timeLimit: 15,
    isVerified: false,
    isOnline: true,
  },
];

const mockSellOffers: P2POffer[] = [
  {
    id: '5',
    traderName: 'Buyer_Expert',
    traderRating: 4.9,
    completedTrades: 1890,
    completionRate: 98.8,
    price: 1.06,
    available: 6000,
    minLimit: 50,
    maxLimit: 6000,
    paymentMethods: ['Bank Transfer', 'PayPal'],
    side: 'sell',
    timeLimit: 15,
    isVerified: true,
    isOnline: true,
  },
  {
    id: '6',
    traderName: 'FastBuyer',
    traderRating: 4.8,
    completedTrades: 1123,
    completionRate: 97.5,
    price: 1.07,
    available: 4000,
    minLimit: 100,
    maxLimit: 4000,
    paymentMethods: ['Wise', 'Bank Transfer'],
    side: 'sell',
    timeLimit: 20,
    isVerified: true,
    isOnline: true,
  },
  {
    id: '7',
    traderName: 'ReliableBuyer',
    traderRating: 5.0,
    completedTrades: 2456,
    completionRate: 99.3,
    price: 1.05,
    available: 10000,
    minLimit: 25,
    maxLimit: 10000,
    paymentMethods: ['PayPal', 'Wise', 'Bank Transfer', 'Revolut'],
    side: 'sell',
    timeLimit: 30,
    isVerified: true,
    isOnline: false,
  },
];

const mockUserBalance: UserBalance = {
  OXM: 1000,
  USD: 500,
  USDT: 200,
};

export default function P2PTrade() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'trades'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedOffer, setSelectedOffer] = useState<P2POffer | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [userBalance] = useState<UserBalance>(mockUserBalance);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get offers based on active tab
  const allOffers = activeTab === 'buy' ? mockBuyOffers : mockSellOffers;

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = allOffers.filter(offer => {
      const matchesSearch = 
        offer.traderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.paymentMethods.some(method => 
          method.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesSearch;
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
  }, [allOffers, searchQuery, sortBy, sortOrder]);

  const handleTradeClick = (offer: P2POffer) => {
    setSelectedOffer(offer);
    setIsTradeModalOpen(true);
  };

  const handleTradeConfirm = async (amount: number) => {
    if (!selectedOffer) return;

    setIsProcessing(true);
    
    // Validate balance
    if (activeTab === 'buy') {
      // Buying OXM - need USD/USDT
      const requiredAmount = amount * selectedOffer.price;
      if (userBalance.USD < requiredAmount && userBalance.USDT < requiredAmount) {
        toast.error('Insufficient balance');
        setIsProcessing(false);
        return;
      }
    } else {
      // Selling OXM - need OXM
      if (userBalance.OXM < amount) {
        toast.error('Insufficient OXM balance');
        setIsProcessing(false);
        return;
      }
    }

    // Validate limits
    if (amount < selectedOffer.minLimit || amount > selectedOffer.maxLimit) {
      toast.error(`Amount must be between ${selectedOffer.minLimit} and ${selectedOffer.maxLimit} OXM`);
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

      toast.success(
        `${activeTab === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`,
        {
          description: `${amount} OXM at $${selectedOffer.price} per token`,
        }
      );

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
    <div className="space-y-6">
      {/* Balance Display - Full Width */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Your Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">OXM</p>
              <p className="text-2xl font-bold">{userBalance.OXM.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">USD</p>
              <p className="text-2xl font-bold">${userBalance.USD.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center border-2 border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">USDT</p>
              <p className="text-2xl font-bold">{userBalance.USDT.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Trading Section */}
      <Card className="border-0 shadow-xl bg-white dark:bg-zinc-900">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Buy/Sell Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-zinc-800 h-12">
                <TabsTrigger 
                  value="buy"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-semibold text-base"
                >
                  <ArrowUp className="w-5 h-5 mr-2" />
                  Buy OXM
                </TabsTrigger>
                <TabsTrigger 
                  value="sell"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white font-semibold text-base"
                >
                  <ArrowDown className="w-5 h-5 mr-2" />
                  Sell OXM
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6 space-y-4">
                {/* Search and Filter */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Search trader name or payment method..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-white dark:bg-zinc-800 text-base"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger className="w-40 h-12 bg-white dark:bg-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Sort by Price</SelectItem>
                        <SelectItem value="rating">Sort by Rating</SelectItem>
                        <SelectItem value="trades">Sort by Trades</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleSortOrder}
                      className="h-12 w-12 bg-white dark:bg-zinc-800"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Offers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedOffers.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-gray-50 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No offers found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredAndSortedOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        onTradeClick={() => handleTradeClick(offer)}
                      />
                    ))
                  )}
                </div>
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

