import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';

// Global window interface extension
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isConnected?: boolean;
      publicKey?: PublicKey;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
      on: (event: string, callback: (args: any) => void) => void;
      off: (event: string, callback: (args: any) => void) => void;
    };
  }
}

export interface WalletState {
  wallet: any;
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  balance: number;
  error: string | null;
}

export interface UsePhantomWalletReturn extends WalletState {
  connectWallet: () => Promise<{ publicKey: PublicKey; balance: number }>;
  disconnectWallet: () => Promise<void>;
  updateBalance: (publicKey?: PublicKey) => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const usePhantomWallet = (): UsePhantomWalletReturn => {
  const [wallet, setWallet] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const connection = useRef<Connection | null>(null);
  const eventListeners = useRef<Map<string, (args: any) => void>>(new Map());

  // Initialize connection
  useEffect(() => {
    connection.current = new Connection(SOLANA_RPC_URL, 'confirmed');
  }, []);

  // Dynamic wallet detection
  const detectWallet = useCallback(() => {
    const { solana } = window;
    
    if (solana?.isPhantom) {
      setWallet(solana);
      return solana;
    } else {
      // Retry detection for delayed loading
      setTimeout(detectWallet, 1000);
      return null;
    }
  }, []);

  // Setup event listeners
  const setupEventListeners = useCallback((walletInstance: any) => {
    if (!walletInstance) return;

    // Account change detection
    const handleAccountChange = (newPublicKey: PublicKey | null) => {
      if (newPublicKey) {
        const pubKey = new PublicKey(newPublicKey.toString());
        setPublicKey(pubKey);
        updateBalance(pubKey);
        localStorage.setItem('phantom_public_key', pubKey.toString());
        setConnected(true);
      } else {
        // Wallet disconnected
        handleDisconnect();
      }
    };

    // Network change detection
    const handleConnect = () => {
      setConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setConnected(false);
      setPublicKey(null);
      setBalance(0);
      localStorage.removeItem('phantom_auto_connect');
      localStorage.removeItem('phantom_public_key');
    };

    // Store listeners for cleanup
    eventListeners.current.set('accountChanged', handleAccountChange);
    eventListeners.current.set('connect', handleConnect);
    eventListeners.current.set('disconnect', handleDisconnect);

    // Add event listeners
    walletInstance.on('accountChanged', handleAccountChange);
    walletInstance.on('connect', handleConnect);
    walletInstance.on('disconnect', handleDisconnect);
  }, []);

  // Remove event listeners
  const removeEventListeners = useCallback((walletInstance: any) => {
    if (!walletInstance) return;

    eventListeners.current.forEach((callback, event) => {
      walletInstance.off(event, callback);
    });
    eventListeners.current.clear();
  }, []);

  // Update balance
  const updateBalance = useCallback(async (pubKey = publicKey) => {
    if (!pubKey || !connection.current) return;

    try {
      const balance = await connection.current.getBalance(pubKey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Balance update failed:', error);
    }
  }, [publicKey]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!wallet) {
      const detectedWallet = detectWallet();
      if (!detectedWallet) {
        throw new Error('Phantom wallet not found. Please install Phantom.');
      }
    }

    try {
      setConnecting(true);
      setError(null);
      
      const response = await wallet.connect();
      const pubKey = new PublicKey(response.publicKey.toString());
      
      setConnected(true);
      setPublicKey(pubKey);
      
      // Fetch initial balance
      await updateBalance(pubKey);
      
      // Store connection state
      localStorage.setItem('phantom_auto_connect', 'true');
      localStorage.setItem('phantom_public_key', pubKey.toString());
      
      // Setup event listeners
      setupEventListeners(wallet);
      
      return { publicKey: pubKey, balance };
      
    } catch (error: any) {
      console.error('Connection failed:', error);
      setError(error.message || 'Wallet connection failed');
      setConnected(false);
      setPublicKey(null);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [wallet, detectWallet, updateBalance, setupEventListeners, balance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (wallet && connected) {
      try {
        await wallet.disconnect();
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
    
    // Remove event listeners
    removeEventListeners(wallet);
    
    // Reset state
    setConnected(false);
    setPublicKey(null);
    setBalance(0);
    setError(null);
    localStorage.removeItem('phantom_auto_connect');
    localStorage.removeItem('phantom_public_key');
  }, [wallet, connected, removeEventListeners]);

  // Sign transaction
  const signTransaction = useCallback(async (transaction: any) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await wallet.signTransaction(transaction);
    } catch (error: any) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }, [wallet, connected]);

  // Sign multiple transactions
  const signAllTransactions = useCallback(async (transactions: any[]) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await wallet.signAllTransactions(transactions);
    } catch (error: any) {
      console.error('Multiple transaction signing failed:', error);
      throw error;
    }
  }, [wallet, connected]);

  // Auto-reconnection on page load
  useEffect(() => {
    const autoConnect = localStorage.getItem('phantom_auto_connect');
    const storedKey = localStorage.getItem('phantom_public_key');
    
    if (autoConnect && storedKey) {
      detectWallet();
      if (wallet && !connected) {
        connectWallet().catch(console.error);
      }
    } else {
      detectWallet();
    }
  }, [detectWallet, wallet, connected, connectWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeEventListeners(wallet);
    };
  }, [wallet, removeEventListeners]);

  return {
    wallet,
    connected,
    connecting,
    publicKey,
    balance,
    error,
    connectWallet,
    disconnectWallet,
    updateBalance,
    signTransaction,
    signAllTransactions,
  };
};
