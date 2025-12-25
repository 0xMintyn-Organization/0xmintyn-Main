import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  uiAmount: number; // Human-readable amount
}

export interface UsePhantomBalancesReturn {
  balances: TokenBalance[];
  solBalance: number;
  loading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (mint: string) => TokenBalance | null;
}

// Common token mints (you can add OXM mint address here)
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether', decimals: 6 },
  // Add OXM mint address here when available
  // 'OXM_MINT_ADDRESS': { symbol: 'OXM', name: 'OXM Token', decimals: 9 },
};

export function usePhantomBalances(walletAddress: string | null): UsePhantomBalancesReturn {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) {
      setBalances([]);
      setSolBalance(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      const publicKey = new PublicKey(walletAddress);

      // Fetch SOL balance
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / 1_000_000_000;
      setSolBalance(sol);

      // Fetch SPL token balances
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokenBalances: TokenBalance[] = [];

      // Add SOL to balances
      if (sol > 0) {
        tokenBalances.push({
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          balance: lamports,
          decimals: 9,
          uiAmount: sol,
        });
      }

      // Process token accounts
      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const tokenAmount = parsedInfo.tokenAmount;

        // Get token metadata
        const tokenInfo = KNOWN_TOKENS[mint] || {
          symbol: mint.slice(0, 4) + '...',
          name: 'Unknown Token',
          decimals: tokenAmount.decimals,
        };

        const uiAmount = tokenAmount.uiAmount || 0;

        // Only include tokens with balance > 0
        if (uiAmount > 0) {
          tokenBalances.push({
            mint,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            balance: tokenAmount.amount,
            decimals: tokenAmount.decimals,
            uiAmount,
          });
        }
      }

      // Sort by balance (highest first)
      tokenBalances.sort((a, b) => b.uiAmount - a.uiAmount);

      setBalances(tokenBalances);
    } catch (err: any) {
      console.error('Error fetching Phantom balances:', err);
      setError(err.message || 'Failed to fetch wallet balances');
      setBalances([]);
      setSolBalance(0);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();

    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const getTokenBalance = useCallback(
    (mint: string): TokenBalance | null => {
      return balances.find((b) => b.mint === mint) || null;
    },
    [balances]
  );

  return {
    balances,
    solBalance,
    loading,
    error,
    refreshBalances: fetchBalances,
    getTokenBalance,
  };
}

