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

interface OfferCardProps {
  offer: P2POffer;
  onTradeClick: () => void;
}

export default function OfferCard({ offer, onTradeClick }: OfferCardProps) {
  const isBuy = offer.side === 'buy';
  const colorClass = isBuy 
    ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
    : 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20';

  return (
    <Card className={`${colorClass} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer h-full`}>
      <div className="p-4 space-y-3">
        {/* Header: Trader Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-zinc-800">
                <AvatarImage src={offer.traderAvatar} />
                <AvatarFallback>
                  {offer.traderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {offer.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{offer.traderName}</p>
                {offer.isVerified && (
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{offer.traderRating}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({offer.completedTrades.toLocaleString()} trades)
                </span>
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`flex-shrink-0 ${
              isBuy 
                ? 'border-green-600 text-green-700 dark:text-green-400' 
                : 'border-red-600 text-red-700 dark:text-red-400'
            }`}
          >
            {offer.completionRate}%
          </Badge>
        </div>

        {/* Price and Available */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
            <p className="text-2xl font-bold">
              ${offer.price.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
            <p className="text-lg font-semibold">
              {offer.available.toLocaleString()} OXM
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Limit: </span>
            <span className="font-medium">
              {offer.minLimit} - {offer.maxLimit.toLocaleString()} OXM
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">
              {offer.timeLimit} min
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Payment Methods</p>
          <div className="flex flex-wrap gap-2">
            {offer.paymentMethods.slice(0, 3).map((method, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-white dark:bg-zinc-800"
              >
                {method}
              </Badge>
            ))}
            {offer.paymentMethods.length > 3 && (
              <Badge variant="secondary" className="bg-white dark:bg-zinc-800">
                +{offer.paymentMethods.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Trade Button */}
        <Button
          onClick={onTradeClick}
          className={`w-full font-semibold h-11 transition-all duration-200 ${
            isBuy
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
          } shadow-md hover:shadow-lg`}
        >
          {isBuy ? (
            <>
              <ArrowUp className="w-5 h-5 mr-2" />
              Buy OXM
            </>
          ) : (
            <>
              <ArrowDown className="w-5 h-5 mr-2" />
              Sell OXM
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

