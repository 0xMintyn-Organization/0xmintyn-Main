/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, CheckCircle, ExternalLink } from "lucide-react";
import { useDispatch } from "react-redux";
import { walletConnected, walletDisconnected } from "@/redux/features/wallet/walletSlice";

interface PhantomWalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Phantom wallet types
interface PhantomProvider {
  isPhantom?: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
  disconnect: () => Promise<void>;
  publicKey: any;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  request: (method: string, params?: any) => Promise<any>;
}

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  address: string | null;
}

export function PhantomWalletButton({ onConnect, onDisconnect }: PhantomWalletButtonProps) {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    balance: 0,
    address: null,
  });

  // Check if Phantom is installed
  const [phantomInstalled, setPhantomInstalled] = useState(false);
  const [phantomProvider, setPhantomProvider] = useState<PhantomProvider | null>(null);

  // Get SOL balance with retry mechanism
  const getSolBalance = useCallback(async (address: string): Promise<number> => {
    try {
      if (!phantomProvider) return 0;
      
      // Try multiple times with different approaches
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await phantomProvider.request({
            method: 'getBalance',
            params: [address],
          } as any);
          
          if (response && typeof response.value === 'number') {
            // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
            return response.value / 1_000_000_000;
          }
        } catch (balanceError) {
          console.log(`Balance fetch attempt ${attempt + 1} failed:`, balanceError);
          if (attempt === 2) throw balanceError; // Throw on last attempt
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      return 0;
    } catch (error) {
      console.error("Error fetching balance after all attempts:", error);
      return 0;
    }
  }, [phantomProvider]);

  // Handle wallet connection
  const handleWalletConnected = useCallback(async (provider: PhantomProvider) => {
    // Prevent multiple simultaneous connection processing
    if (isProcessingConnection) {
      console.log("Connection already being processed, skipping...");
      return;
    }
    
    setIsProcessingConnection(true);
    
    try {
      const publicKey = provider.publicKey;
      if (!publicKey) {
        throw new Error("Public key not found after connection");
      }
      
      const address = publicKey.toString();
      
      // Prevent duplicate connections
      if (walletState.connected && walletState.address === address) {
        console.log("Wallet already connected with same address, skipping...");
        return;
      }
      
      console.log("Processing wallet connection for:", address);
      
      const balance = await getSolBalance(address);
      
      const newWalletState = {
        connected: true,
        publicKey: publicKey,
        balance: balance,
        address: address,
      };
      
      setWalletState(newWalletState);
      
      // Save to database
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URI}update-wallet-address`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              walletAddress: address, 
              walletProvider: 'phantom' 
            }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log("Wallet address saved to database:", data);
        } else {
          console.error("Failed to save wallet address to database");
        }
      } catch (error) {
        console.error("Error saving wallet address:", error);
      }
      
      dispatch(walletConnected({ 
        provider: 'phantom', 
        publicKey: address, 
        balance: balance, 
        address: address 
      }));
      
      toast({ 
        title: "Wallet Connected!", 
        description: `Phantom wallet connected successfully` 
      });
      
      if (onConnect) { 
        onConnect(); 
      }
    } catch (error) {
      console.error("Error handling wallet connection:", error);
    } finally {
      setIsProcessingConnection(false);
    }
  }, [dispatch, onConnect, getSolBalance, toast, walletState.connected, walletState.address, isProcessingConnection]);

  useEffect(() => {
    // Enhanced Phantom detection with proper event handling
    const checkPhantom = () => {
      if (typeof window !== 'undefined') {
        // Try multiple ways to detect Phantom
        const provider = (window as any).solana || (window as any).phantom?.solana;
        console.log("Checking Phantom provider:", provider);
        
        if (provider?.isPhantom) {
          console.log("Phantom wallet detected");
          setPhantomInstalled(true);
          setPhantomProvider(provider);
          
          // Set up event listeners immediately
          setupEventListeners(provider);
          
          // Check if already connected
          if (provider.isConnected && provider.publicKey) {
            console.log("Wallet already connected:", provider.publicKey.toString());
            handleWalletConnected(provider);
          }
        } else {
          console.log("Phantom wallet not detected");
          setPhantomInstalled(false);
          setPhantomProvider(null);
        }
      }
    };

    // Set up event listeners for Phantom
    const setupEventListeners = (provider: any) => {
      try {
        // Remove existing listeners first to prevent duplicates
        if (provider.removeAllListeners) {
          provider.removeAllListeners();
        }
        
        // Listen for connect events
        provider.on('connect', () => {
          console.log("Phantom connected event fired");
          handleWalletConnected(provider);
        });

        // Listen for disconnect events
        provider.on('disconnect', () => {
          console.log("Phantom disconnected event fired");
          setIsProcessingConnection(false);
          setWalletState({
            connected: false,
            publicKey: null,
            balance: 0,
            address: null,
          });
          dispatch(walletDisconnected());
        });

        // Listen for account changes
        provider.on('accountChanged', (publicKey: any) => {
          console.log("Account changed:", publicKey?.toString());
          if (publicKey) {
            handleWalletConnected(provider);
          } else {
            // Account disconnected
            setIsProcessingConnection(false);
            setWalletState({
              connected: false,
              publicKey: null,
              balance: 0,
              address: null,
            });
            dispatch(walletDisconnected());
          }
        });
      } catch (error) {
        console.error("Error setting up event listeners:", error);
      }
    };

    // Initial check
    checkPhantom();

    // Listen for Phantom installation with multiple triggers
    const handlePhantomInstall = () => {
      console.log("Window loaded, checking for Phantom again");
      setTimeout(checkPhantom, 100);
    };

    // Multiple event listeners for better detection
    window.addEventListener('load', handlePhantomInstall);
    window.addEventListener('DOMContentLoaded', handlePhantomInstall);
    
    // Check periodically for Phantom installation
    const interval = setInterval(checkPhantom, 2000);
    
    return () => {
      window.removeEventListener('load', handlePhantomInstall);
      window.removeEventListener('DOMContentLoaded', handlePhantomInstall);
      clearInterval(interval);
      
      // Clean up event listeners - Phantom handles this automatically
    };
  }, [dispatch, handleWalletConnected]);

  // Connect wallet with research-based best practices
  const connectWallet = async () => {
    if (!phantomInstalled) {
      toast({
        title: "Phantom Wallet Not Found",
        description: "Please install Phantom wallet to continue",
        variant: "destructive",
      });
      return;
    }

    if (!phantomProvider) {
      toast({
        title: "Error",
        description: "Phantom provider not available",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple connection attempts
    if (isConnecting || isProcessingConnection) {
      console.log("Connection already in progress, skipping...");
      return;
    }

    try {
      setIsConnecting(true);
      setIsLoading(true);

      // Check if already connected
      if (phantomProvider.isConnected && phantomProvider.publicKey) {
        console.log("Wallet already connected, using existing connection");
        await handleWalletConnected(phantomProvider);
        return;
      }

      console.log("Starting wallet connection process...");
      
      // Research-based approach: Use the most reliable connection method
      try {
        console.log("Attempting Phantom connection with proper error handling...");
        
        // Method 1: Direct connection with proper error handling
        const response = await phantomProvider.connect();
        
        if (response && response.publicKey) {
          console.log("Connection successful:", response.publicKey.toString());
          await handleWalletConnected(phantomProvider);
          return;
        } else {
          throw new Error("No public key received from wallet");
        }
        
      } catch (connectionError: any) {
        console.log("Primary connection method failed:", connectionError);
        
        // Method 2: Try with explicit options if first method fails
        try {
          console.log("Trying connection with explicit options...");
          const response = await phantomProvider.connect({ onlyIfTrusted: false });
          
          if (response && response.publicKey) {
            console.log("Explicit options connection successful:", response.publicKey.toString());
            await handleWalletConnected(phantomProvider);
            return;
          }
        } catch (explicitError: any) {
          console.log("Explicit options connection failed:", explicitError);
        }
        
        // Method 3: Try alternative provider detection
        try {
          console.log("Trying alternative provider detection...");
          const altProvider = (window as any).phantom?.solana || (window as any).solana;
          
          if (altProvider && altProvider.isPhantom && altProvider !== phantomProvider) {
            console.log("Found alternative provider, trying connection...");
            const response = await altProvider.connect();
            
            if (response && response.publicKey) {
              console.log("Alternative provider connection successful:", response.publicKey.toString());
              await handleWalletConnected(altProvider);
              return;
            }
          }
        } catch (altError: any) {
          console.log("Alternative provider connection failed:", altError);
        }
        
        // If all methods fail, throw the original error
        throw connectionError;
      }
      
    } catch (error: any) {
      console.error("All connection methods failed:", error);
      
      // Enhanced error handling based on research
      if (error.code === 4001) {
        toast({
          title: "Connection Rejected",
          description: "User rejected the connection request. Please try again.",
          variant: "destructive",
        });
      } else if (error.code === -32002) {
        toast({
          title: "Connection Pending",
          description: "A connection request is already pending. Please check your Phantom wallet.",
          variant: "destructive",
        });
      } else if (error.message?.includes("User rejected")) {
        toast({
          title: "Connection Rejected",
          description: "User rejected the connection request. Please try again.",
          variant: "destructive",
        });
      } else if (error.message?.includes("Unexpected error") || error.message?.includes("Oe:")) {
        toast({
          title: "Connection Error",
          description: "Phantom wallet connection failed. Please refresh the page and try again, or check if Phantom is unlocked.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect to Phantom wallet. Please refresh the page and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (!phantomProvider) return;

    try {
      setIsLoading(true);
      await phantomProvider.disconnect();
      
      setWalletState({
        connected: false,
        publicKey: null,
        balance: 0,
        address: null,
      });
      
      // Remove wallet address from database
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URI}remove-wallet-address`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Wallet address removed from database:", data);
        } else {
          console.error("Failed to remove wallet address from database");
        }
      } catch (error) {
        console.error("Error removing wallet address:", error);
      }

      // Dispatch to Redux
      dispatch(walletDisconnected());
      
      toast({
        title: "Wallet Disconnected",
        description: "Phantom wallet disconnected successfully",
      });
      
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get wallet display information
  const getWalletDisplayInfo = () => {
    if (!walletState.connected || !walletState.address) {
      return { shortAddress: '', balance: 0 };
    }

    const shortAddress = walletState.address.length > 10
      ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
      : walletState.address;

    return {
      shortAddress,
      balance: walletState.balance,
    };
  };

  const { shortAddress, balance } = getWalletDisplayInfo();

  return (
    <div className="space-y-3">
      {/* Main Connect/Disconnect Button */}
      <Button
        onClick={walletState.connected ? disconnectWallet : connectWallet}
        disabled={isLoading || isConnecting || isProcessingConnection}
        variant={walletState.connected ? "outline" : "default"}
        className={`w-full transition-all duration-200 ${
          walletState.connected
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
            : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
        }`}
      >
        {isLoading || isConnecting || isProcessingConnection ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isProcessingConnection ? "Processing..." : isConnecting ? "Connecting..." : "Loading..."}
          </>
        ) : walletState.connected ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Connected to Phantom
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Phantom Wallet
          </>
        )}
      </Button>

      {/* Wallet Info Display */}
      {walletState.connected && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Wallet Address:
            </span>
            <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
              {shortAddress}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              SOL Balance:
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {balance.toFixed(4)} SOL
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status:
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 dark:text-green-400">
                Connected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Install Phantom Button (if not installed) */}
      {!phantomInstalled && (
        <Button
          onClick={() => window.open('https://phantom.app/', '_blank')}
          variant="outline"
          className="w-full border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Install Phantom Wallet
        </Button>
      )}

      {/* Connection Troubleshooting */}
      {phantomInstalled && !walletState.connected && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            <strong>Troubleshooting Tips:</strong>
          </div>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Make sure Phantom wallet is unlocked</li>
            <li>• Try refreshing the page</li>
            <li>• Check if other extensions are interfering</li>
            <li>• Clear browser cache if issues persist</li>
          </ul>
        </div>
      )}

  
    </div>
  );
}

// Export utility functions for future use
export const phantomUtils = {
  signMessage: async (message: string) => {
    const provider = (window as any).solana;
    if (!provider?.isPhantom) {
      throw new Error("Phantom wallet not found");
    }
    
    const encodedMessage = new TextEncoder().encode(message);
    return await provider.signMessage(encodedMessage);
  },
  
  getBalance: async (address: string) => {
    const provider = (window as any).solana;
    if (!provider?.isPhantom) {
      throw new Error("Phantom wallet not found");
    }
    
    const response = await provider.request({
      method: 'getBalance',
      params: [address],
    });
    
    return response.value / 1_000_000_000; // Convert lamports to SOL
  },
  
  isConnected: () => {
    const provider = (window as any).solana;
    return provider?.isPhantom && provider.isConnected;
  },
  
  getPublicKey: () => {
    const provider = (window as any).solana;
    return provider?.isPhantom && provider.isConnected ? provider.publicKey?.toString() : null;
  }
};

