'use client';

import { useEffect, useRef, useState } from 'react';

type LiveTicker = {
  price: number | null;
  bid: number | null;
  ask: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  timestamp: number | null;
  loading: boolean;
};

const POLL_INTERVAL = 1000; // ms

const backendRoot = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const initialState: LiveTicker = {
  price: null,
  bid: null,
  ask: null,
  high: null,
  low: null,
  open: null,
  timestamp: null,
  loading: true,
};

export default function useLiveTicker(): LiveTicker {
  const [ticker, setTicker] = useState<LiveTicker>(initialState);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchLivePrice = async () => {
    try {
      const response = await fetch(`${backendRoot}/api/market/live-price`);
      if (!response.ok) {
        throw new Error(`Live price unavailable (${response.status})`);
      }
      const payload = await response.json();
      if (payload?.ok && payload.data) {
        setTicker({
          price: payload.data.price != null ? Number(payload.data.price) : null,
          bid: payload.data.bid != null ? Number(payload.data.bid) : null,
          ask: payload.data.ask != null ? Number(payload.data.ask) : null,
          high: payload.data.high != null ? Number(payload.data.high) : null,
          low: payload.data.low != null ? Number(payload.data.low) : null,
          open: payload.data.open != null ? Number(payload.data.open) : null,
          timestamp: payload.data.timestamp != null ? Number(payload.data.timestamp) : null,
          loading: false,
        });
      } else {
        throw new Error('Live price payload missing');
      }
    } catch (error) {
      console.error('Live ticker fetch error', error);
      setTicker((prev) => ({ ...prev, loading: true }));
    } finally {
      retryTimeout.current = setTimeout(fetchLivePrice, POLL_INTERVAL);
    }
  };

  useEffect(() => {
    fetchLivePrice();
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, []);

  return ticker;
}
