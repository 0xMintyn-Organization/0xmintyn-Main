import { useState, useEffect, useCallback } from 'react';
import { p2pAPI } from '@/lib/api';

interface SwapPriceData {
  rate: number | null;
  loading: boolean;
  error: string | null;
  fromToken: string;
  toToken: string;
}

/**
 * Hook to fetch real-time conversion rate between two tokens using Bitget API
 * Handles OXM token in developer mode with fallback
 */
export function useSwapPrice(fromToken: string, toToken: string): SwapPriceData {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    if (!fromToken || !toToken || fromToken === toToken) {
      setRate(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await p2pAPI.getConversionRate(fromToken, toToken);
      
      console.log('Swap price API response:', { fromToken, toToken, res });
      
      if (res.success) {
        if (res.rate !== null && res.rate !== undefined && !isNaN(res.rate) && res.rate > 0) {
          setRate(res.rate);
          setError(null);
        } else if (res.fallbackRate) {
          // OXM in developer mode - use fallback
          setRate(res.fallbackRate);
          setError(null);
          console.warn('Using fallback rate for OXM (developer mode):', res.message);
        } else {
          const errorMsg = res.message || 'Rate not available';
          console.error('Rate not available:', errorMsg, res);
          setError(errorMsg);
          setRate(null);
        }
      } else {
        const errorMsg = res.message || 'Failed to fetch conversion rate';
        console.error('API returned success:false:', errorMsg, res);
        setError(errorMsg);
        setRate(null);
      }
    } catch (err: any) {
      console.error('Error fetching swap price:', {
        fromToken,
        toToken,
        error: err,
        message: err.message,
        response: err.response?.data,
      });
      setError(err.response?.data?.message || err.message || 'Failed to fetch conversion rate');
      setRate(null);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken]);

  useEffect(() => {
    fetchRate();
    
    // Refresh rate every 10 seconds for real-time updates
    const interval = setInterval(fetchRate, 10000);
    
    return () => clearInterval(interval);
  }, [fetchRate]);

  return {
    rate,
    loading,
    error,
    fromToken,
    toToken,
  };
}

