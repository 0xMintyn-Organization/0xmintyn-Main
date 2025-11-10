'use client';

import React from 'react';
import { Activity, TrendingUp, DollarSign } from 'lucide-react';

// Dummy data - will be replaced with Bitget API
const tradingVolume = {
  '24h': 1234567,
  '7d': 8567890,
  '30d': 34567890
};

export default function TradingVolume() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6 shadow-lg border border-green-400/20">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h6 className="text-base font-bold text-white">
            Trading Volume
          </h6>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3 h-3 text-white/80" />
              <span className="text-xs text-white/80 font-medium">24h</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${(tradingVolume['24h'] / 1000).toFixed(1)}K
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-white/80" />
              <span className="text-xs text-white/80 font-medium">7d</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${(tradingVolume['7d'] / 1000).toFixed(1)}K
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-white/80" />
              <span className="text-xs text-white/80 font-medium">30d</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${(tradingVolume['30d'] / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
