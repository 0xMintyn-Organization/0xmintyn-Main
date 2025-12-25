import { useState, useEffect, useCallback } from 'react';
import { p2pAPI } from '@/lib/api';

interface TokenBalance {
  coin: string;
  available: string;
  frozen: string;
  locked: string;
}

interface BitgetAccountData {
  balances: TokenBalance[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch user's Bitget account balances
 * Note: Requires Bitget API keys and user must have funds on Bitget
 */
export function useBitgetBalance(): BitgetAccountData {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await p2pAPI.getBitgetAccount();
      
      if (res.success && res.account) {
        // Extract spot account assets
        const spotAssets = res.account?.data?.find((acc: any) => acc.accountType === 'spot');
        if (spotAssets?.assets) {
          setBalances(spotAssets.assets);
        } else {
          setBalances([]);
        }
      } else {
        setError(res.message || 'Failed to fetch account');
        setBalances([]);
      }
    } catch (err: any) {
      console.error('Error fetching Bitget balance:', err);
      setError(err.message || 'Failed to fetch Bitget account');
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
  };
}

