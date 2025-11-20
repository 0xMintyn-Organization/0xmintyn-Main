'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Circle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { P2POffer } from './P2PTrade';
import Link from 'next/link';

interface OfferCardProps {
  offer: P2POffer;
  onTradeClick: () => void;
}

export default function OfferCard({ offer, onTradeClick }: OfferCardProps) {
  const isBuy = offer.side === 'buy';

  return (
    <Card className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-sm transition-all duration-200 h-full">
      <div className="p-3 space-y-2.5">
        {/* Header: Trader Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="w-8 h-8 border border-gray-200 dark:border-zinc-700">
                <AvatarImage src={offer.traderAvatar} />
                <AvatarFallback className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                  {offer.traderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {offer.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/p2p-trading/trader/${offer.traderId || offer.id}`}
                  className="font-medium text-xs text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 truncate hover:underline transition-colors"
                >
                  {offer.traderName}
                </Link>
                {offer.isVerified && (
                  <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                <span>{offer.completedTrades.toLocaleString()} orders</span>
                <span className="text-gray-400">•</span>
                <span>{offer.completionRate}% completion</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] font-medium text-gray-900 dark:text-gray-100">{offer.traderRating}</span>
                {offer.responseRate && (
                  <>
                    <span className="text-[11px] text-gray-400">•</span>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">{offer.responseRate}%</span>
                  </>
                )}
                {offer.responseTime && (
                  <>
                    <span className="text-[11px] text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-gray-500" />
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{offer.responseTime} min</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="flex-shrink-0 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/50 text-[11px] px-1.5 py-0.5 h-5"
          >
            {offer.completionRate}%
          </Badge>
        </div>

        {/* Price and Available */}
        <div className="flex items-center justify-between py-1.5 border-t border-b border-gray-100 dark:border-zinc-800">
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Price</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              ${offer.price.toFixed(3)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Available</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {offer.available.toLocaleString()} OXM
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="flex items-center justify-between text-[11px]">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Limit: </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {offer.minLimit} - {offer.maxLimit.toLocaleString()} OXM
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock className="w-2.5 h-2.5" />
            <span>{offer.timeLimit} min</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">Payment Methods</p>
          <div className="flex flex-wrap gap-1">
            {offer.paymentMethods.slice(0, 3).map((method, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 h-5"
              >
                {method}
              </Badge>
            ))}
            {offer.paymentMethods.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 h-5">
                +{offer.paymentMethods.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Trade Button and Verification Badge */}
        <div className="space-y-1.5">
          <Button
            onClick={onTradeClick}
            className={`w-full font-normal h-8 text-xs transition-all ${
              isBuy
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isBuy ? (
              <>
                <ArrowUp className="w-3 h-3 mr-1.5" />
                Buy OXM
              </>
            ) : (
              <>
                <ArrowDown className="w-3 h-3 mr-1.5" />
                Sell OXM
              </>
            )}
          </Button>
          {offer.requiresVerification && (
            <Badge variant="outline" className="w-full justify-center text-[10px] px-1.5 py-0 h-4 text-amber-600 dark:text-amber-500 border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              Requires Verification
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

