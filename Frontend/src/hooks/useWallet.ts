"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { walletConnected, walletDisconnected, updateBalance } from '@/redux/features/wallet/walletSlice';
import { walletManager, cryptoUtils } from '@/utils/walletUtils';

export interface UseWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  provider: string | null;
  
  // Wallet info
  publicKey: string | null;
  address: string | null;
  balance: number;
  network: string;
  
  // Available providers
  availableProviders: string[];
  
  // Actions
  connect: (providerName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signMessage: (message: string) => Promise<any>;
  
  // Utilities
  formatAddress: (address?: string) => string;
  formatBalance: (balance?: number) => string;
}

export function useWallet(): UseWalletReturn {
  const dispatch = useDispatch();
  const walletState = useSelector((state: any) => state.wallet);
  const [isConnecting, setIsConnecting] = useState(false);

  // Available providers
  const availableProviders = walletManager.getAvailableProviders();

  // Connect wallet
  const connect = async (providerName: string) => {
    try {
      setIsConnecting(true);
      
      const result = await walletManager.connectProvider(providerName);
      
      // Get initial balance
      const balance = await walletManager.getCurrentProvider()?.getBalance(result.address) || 0;
      
      // Dispatch to Redux
      dispatch(walletConnected({
        provider: providerName,
        publicKey: result.publicKey,
        address: result.address,
        balance: balance,
        network: 'mainnet-beta', // Default network
      }));
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    try {
      await walletManager.disconnectProvider();
      dispatch(walletDisconnected());
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (!walletState.connected || !walletState.address) return;
    
    try {
      const provider = walletManager.getCurrentProvider();
      if (provider) {
        const balance = await provider.getBalance(walletState.address);
        dispatch(updateBalance(balance));
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Sign message
  const signMessage = async (message: string) => {
    if (!walletState.connected) {
      throw new Error('Wallet not connected');
    }
    
    const provider = walletManager.getCurrentProvider();
    if (!provider) {
      throw new Error('No wallet provider available');
    }
    
    return await provider.signMessage(message);
  };

  // Format address for display
  const formatAddress = (address?: string) => {
    const addr = address || walletState.address;
    if (!addr) return '';
    return cryptoUtils.formatAddress(addr);
  };

  // Format balance for display
  const formatBalance = (balance?: number) => {
    const bal = balance !== undefined ? balance : walletState.balance;
    return `${bal.toFixed(4)} SOL`;
  };

  // Auto-refresh balance when connected
  useEffect(() => {
    if (walletState.connected) {
      // Refresh balance immediately
      refreshBalance();
      
      // Set up periodic refresh (every 30 seconds)
      const interval = setInterval(refreshBalance, 30000);
      
      return () => clearInterval(interval);
    }
  }, [walletState.connected]);

  return {
    // Connection state
    isConnected: walletState.connected,
    isConnecting,
    provider: walletState.provider,
    
    // Wallet info
    publicKey: walletState.publicKey,
    address: walletState.address,
    balance: walletState.balance,
    network: walletState.network,
    
    // Available providers
    availableProviders,
    
    // Actions
    connect,
    disconnect,
    refreshBalance,
    signMessage,
    
    // Utilities
    formatAddress,
    formatBalance,
  };
}

// Hook for wallet authentication
export function useWalletAuth() {
  const { isConnected, address, signMessage } = useWallet();
  
  // Authenticate user with wallet signature
  const authenticateWithWallet = async (nonce: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const signature = await signMessage(nonce);
      return {
        address,
        signature,
        nonce,
      };
    } catch (error) {
      console.error('Error authenticating with wallet:', error);
      throw error;
    }
  };
  
  return {
    isConnected,
    address,
    authenticateWithWallet,
  };
}

// Hook for token operations
export function useTokens() {
  const { isConnected, address } = useWallet();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch user's tokens
  const fetchTokens = async () => {
    if (!isConnected || !address) return;
    
    try {
      setLoading(true);
      // This would typically call an API to get user's tokens
      // For now, return empty array as placeholder
      setTokens([]);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isConnected) {
      fetchTokens();
    }
  }, [isConnected, address]);
  
  return {
    tokens,
    loading,
    fetchTokens,
  };
}

// Hook for NFT operations
export function useNFTs() {
  const { isConnected, address } = useWallet();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch user's NFTs
  const fetchNFTs = async () => {
    if (!isConnected || !address) return;
    
    try {
      setLoading(true);
      // This would typically call an API to get user's NFTs
      // For now, return empty array as placeholder
      setNfts([]);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isConnected) {
      fetchNFTs();
    }
  }, [isConnected, address]);
  
  return {
    nfts,
    loading,
    fetchNFTs,
  };
}
