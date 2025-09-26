"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider, Idl } from '@coral-xyz/anchor';
import { toast } from 'react-hot-toast';
import { enhancedBlockchainService } from '@/services/enhancedBlockchainService';
import { smartContractsService, SMART_CONTRACTS } from '@/services/contracts/smart-contracts.service';
import { blockchainWebSocketClient } from '@/services/websocket/blockchain.websocket';

// Import IDLs
import UbiProgramIdl from '@/lib/idl/ubi_program.json';

// Types
export interface BlockchainContextType {
  connection: Connection;
  programs: {
    ubi?: Program<any>;
    marketplace?: Program<any>;
    governance?: Program<any>;
    bridge?: Program<any>;
    escrow?: Program<any>;
  };
  services: {
    ubi?: any;
    governance?: any;
    marketplace?: any;
    p2p?: any;
    bridge?: any;
  };
  smartContracts: {
    ubiDistribution: any;
    governance: any;
    marketplace: any;
    p2pExchange: any;
    crossChainBridge: any;
    p2pEscrow: any;
    splToken: any;
  };
  walletBalance: number;
  tokenBalance: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  executeTransaction: (txFunction: () => Promise<string>) => Promise<string | null>;
  getServiceStats: () => any;
  getContractStats: () => Promise<any>;
  connectWebSocket: (userId: string, token?: string) => void;
  disconnectWebSocket: () => void;
  subscribeToEvents: (events: string[]) => void;
  unsubscribeFromEvents: (events: string[]) => void;
}

const BlockchainContext = createContext<BlockchainContextType | null>(null);

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

// Configuration
const network = process.env.NODE_ENV === 'production' 
  ? WalletAdapterNetwork.Mainnet 
  : WalletAdapterNetwork.Devnet;

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

// Program IDs
// Program IDs from smart contracts
const PROGRAM_IDS = {
  UBI: new PublicKey(SMART_CONTRACTS.UBI_DISTRIBUTION.programId),
  GOVERNANCE: new PublicKey(SMART_CONTRACTS.GOVERNANCE.programId),
  MARKETPLACE: new PublicKey(SMART_CONTRACTS.MARKETPLACE.programId),
  P2P_EXCHANGE: new PublicKey(SMART_CONTRACTS.P2P_EXCHANGE.programId),
  CROSS_CHAIN_BRIDGE: new PublicKey(SMART_CONTRACTS.CROSS_CHAIN_BRIDGE.programId),
  P2P_ESCROW: new PublicKey(SMART_CONTRACTS.P2P_ESCROW.programId),
  SPL_TOKEN: new PublicKey(SMART_CONTRACTS.SPL_TOKEN.programId),
};

// Token mint address
const TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT || "11111111111111111111111111111111");

interface Props {
  children: ReactNode;
}

// Wallet configuration
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new LedgerWalletAdapter(),
  new SolongWalletAdapter(),
  new TorusWalletAdapter(),
];

// Inner provider component that has access to wallet context
const BlockchainProviderInner: React.FC<Props> = ({ children }) => {
  const wallet = useWallet();
  const [connection] = useState(() => new Connection(endpoint, 'confirmed'));
  const [programs, setPrograms] = useState<BlockchainContextType['programs']>({});
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize programs when wallet connects
  useEffect(() => {
    if (wallet.publicKey && wallet.wallet?.adapter) {
      initializePrograms();
    } else {
      setPrograms({});
    }
  }, [wallet.publicKey, wallet.wallet]);

  // Refresh balances when wallet connects or publicKey changes
  useEffect(() => {
    if (wallet.publicKey) {
      refreshBalances();
    } else {
      setWalletBalance(0);
      setTokenBalance(0);
    }
  }, [wallet.publicKey]);

  const initializePrograms = async () => {
    if (!wallet.publicKey || !wallet.wallet?.adapter) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet.wallet.adapter as any,
        { commitment: 'confirmed' }
      );
      setProvider(provider);

      // Initialize enhanced blockchain services
      enhancedBlockchainService.initializeBlockchainServices(provider);

      // Initialize programs
      const newPrograms: BlockchainContextType['programs'] = {};

      try {
        newPrograms.ubi = new Program(
          UbiProgramIdl as Idl,
          PROGRAM_IDS.UBI,
          provider
        );
      } catch (err) {
        console.warn('UBI program not available:', err);
      }

      // TODO: Initialize other programs when IDLs are available
      // newPrograms.marketplace = new Program(...);
      // newPrograms.governance = new Program(...);
      // newPrograms.bridge = new Program(...);
      // newPrograms.escrow = new Program(...);

      setPrograms(newPrograms);
    } catch (err) {
      console.error('Failed to initialize programs:', err);
      setError('Failed to initialize blockchain programs');
      toast.error('Failed to connect to blockchain programs');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalances = async () => {
    if (!wallet.publicKey) return;

    try {
      setIsLoading(true);
      
      // Get SOL balance
      const solBalance = await connection.getBalance(wallet.publicKey);
      setWalletBalance(solBalance / 1e9); // Convert lamports to SOL

      // Get token balance
      // TODO: Implement SPL token balance fetching
      setTokenBalance(0);

    } catch (err) {
      console.error('Failed to refresh balances:', err);
      setError('Failed to refresh balances');
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransaction = async (txFunction: () => Promise<string>): Promise<string | null> => {
    if (!wallet.publicKey) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const signature = await txFunction();
      
      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      // Refresh balances after successful transaction
      await refreshBalances();
      
      toast.success('Transaction successful!');
      return signature;

    } catch (err: any) {
      console.error('Transaction failed:', err);
      const errorMessage = err.message || 'Transaction failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

      const getServiceStats = () => {
        return enhancedBlockchainService.getStats();
      };

      const getContractStats = async () => {
        return await smartContractsService.getContractStats();
      };

      const connectWebSocket = (userId: string, token?: string) => {
        smartContractsService.connectWebSocket(userId, token);
      };

      const disconnectWebSocket = () => {
        smartContractsService.disconnectWebSocket();
      };

      const subscribeToEvents = (events: string[]) => {
        smartContractsService.subscribeToEvents(events);
      };

      const unsubscribeFromEvents = (events: string[]) => {
        smartContractsService.unsubscribeFromEvents(events);
      };

      const value: BlockchainContextType = {
        connection,
        programs,
        services: enhancedBlockchainService.getBlockchainServices() || {},
        smartContracts: {
          ubiDistribution: smartContractsService.getContract('UBI_DISTRIBUTION'),
          governance: smartContractsService.getContract('GOVERNANCE'),
          marketplace: smartContractsService.getContract('MARKETPLACE'),
          p2pExchange: smartContractsService.getContract('P2P_EXCHANGE'),
          crossChainBridge: smartContractsService.getContract('CROSS_CHAIN_BRIDGE'),
          p2pEscrow: smartContractsService.getContract('P2P_ESCROW'),
          splToken: smartContractsService.getContract('SPL_TOKEN'),
        },
        walletBalance,
        tokenBalance,
        isConnected: !!wallet.connected,
        isLoading,
        error,
        refreshBalances,
        executeTransaction,
        getServiceStats,
        getContractStats,
        connectWebSocket,
        disconnectWebSocket,
        subscribeToEvents,
        unsubscribeFromEvents,
      };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

// Main provider component
export const BlockchainProvider: React.FC<Props> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BlockchainProviderInner>
            {children}
          </BlockchainProviderInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default BlockchainProvider;
