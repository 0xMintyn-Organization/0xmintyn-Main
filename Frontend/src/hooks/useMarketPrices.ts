'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type RawPrice = {
  symbol: string;
  data: Record<string, string> | null;
};

type MarketPrice = {
  symbol: string;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  change: number | null;
};

const backendRoot = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const POLL_INTERVAL = 5000;

export default function useMarketPrices(symbols: string[] = ['OXMUSDT', 'BTCUSDT', 'ETHUSDT']) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${backendRoot}/api/market/prices`);
      if (!res.ok) throw new Error('Failed to load prices');
      const payload = await res.json();
      if (payload?.ok && Array.isArray(payload.data)) {
        const mapped = payload.data
          .filter((item: RawPrice) => symbols.includes(item.symbol))
          .map((item: RawPrice) => {
            const ticker = item.data ?? {};
            const price = ticker.last ?? ticker.close ?? null;
            const open = ticker.open24h ?? ticker.open ?? null;
            const volume = ticker.vol24h ?? ticker.volume ?? null;
            const high = ticker.high24h ?? ticker.high ?? null;
            const low = ticker.low24h ?? ticker.low ?? null;
            const numericPrice = price != null ? Number(price) : null;
            const numericOpen = open != null ? Number(open) : null;
            const change = numericPrice != null && numericOpen != null ? numericPrice - numericOpen : null;
            return {
              symbol: item.symbol,
              price: numericPrice,
              open: numericOpen,
              high: high != null ? Number(high) : null,
              low: low != null ? Number(low) : null,
              volume: volume != null ? Number(volume) : null,
              change,
            };
          });
        setPrices(mapped);
        setLoading(false);
      }
    } catch (error) {
      console.error('useMarketPrices error', error);
    }
  };

  useEffect(() => {
    // DISABLED: Polling stopped - was calling every 5 seconds
    // fetchPrices();
    // intervalRef.current = setInterval(fetchPrices, POLL_INTERVAL);
    // return () => {
    //   if (intervalRef.current) {
    //     clearInterval(intervalRef.current);
    //   }
    // };
    
    // Only fetch once on mount (no polling)
    fetchPrices();
  }, []);

  const indexLookup = useMemo(() => {
    const lookup: Record<string, MarketPrice> = {};
    prices.forEach((entry) => {
      lookup[entry.symbol] = entry;
    });
    return lookup;
  }, [prices]);

  return {
    prices: indexLookup,
    loading,
  };
}
