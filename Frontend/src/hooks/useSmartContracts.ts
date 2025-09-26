import { useCallback, useEffect, useState } from 'react';
import { useBlockchain } from '@/contexts/BlockchainProvider';
import { smartContractsService, SMART_CONTRACTS } from '@/services/contracts/smart-contracts.service';
import { blockchainWebSocketClient } from '@/services/websocket/blockchain.websocket';
import { toast } from 'react-hot-toast';

// Types
export interface ContractStats {
  system: any;
  ubi: any;
  governance: any;
  contracts: Record<string, boolean>;
}

export interface UserContractData {
  ubi: {
    profile: any;
    eligibility: any;
    balance: number;
  };
  governance: {
    votingPower: string;
    votes: any[];
    delegations: any[];
  };
  marketplace: any;
  p2p: any;
  bridge: any;
}

// Smart Contracts Hook
export const useSmartContracts = () => {
  const { 
    isConnected, 
    walletBalance, 
    tokenBalance, 
    smartContracts,
    getContractStats,
    connectWebSocket,
    disconnectWebSocket,
    subscribeToEvents,
    unsubscribeFromEvents,
  } = useBlockchain();

  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [userData, setUserData] = useState<UserContractData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contract statistics
  const loadContractStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await getContractStats();
      setContractStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load contract statistics');
      console.error('Failed to load contract stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getContractStats]);

  // Load user data for all contracts
  const loadUserData = useCallback(async (publicKey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const overview = await smartContractsService.getUserOverview(publicKey);
      setUserData(overview);
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // UBI Contract operations
  const ubiOperations = {
    // Get UBI configuration
    getConfig: useCallback(async () => {
      return await smartContractsService.getUbiConfig();
    }, []),

    // Get user UBI profile
    getUserProfile: useCallback(async (publicKey: string) => {
      return await smartContractsService.getUserUbiProfile(publicKey);
    }, []),

    // Claim initial UBI
    claimInitial: useCallback(async (privateKey: string, userTokenAccount: string) => {
      return await smartContractsService.claimInitialUbi(privateKey, userTokenAccount);
    }, []),

    // Claim monthly UBI
    claimMonthly: useCallback(async (privateKey: string, userTokenAccount: string) => {
      return await smartContractsService.claimMonthlyUbi(privateKey, userTokenAccount);
    }, []),

    // Report fraud
    reportFraud: useCallback(async (reporterPrivateKey: string, reportedUser: string, reason: string) => {
      return await smartContractsService.reportFraud(reporterPrivateKey, reportedUser, reason);
    }, []),
  };

  // Governance Contract operations
  const governanceOperations = {
    // Get governance configuration
    getConfig: useCallback(async () => {
      return await smartContractsService.getGovernanceConfig();
    }, []),

    // Get proposals
    getProposals: useCallback(async (status?: string, type?: string, category?: string) => {
      return await smartContractsService.getProposals(status, type, category);
    }, []),

    // Get specific proposal
    getProposal: useCallback(async (proposalId: string) => {
      return await smartContractsService.getProposal(proposalId);
    }, []),

    // Create proposal
    createProposal: useCallback(async (
      proposerPrivateKey: string,
      title: string,
      description: string,
      proposalType: string,
      category: string,
      implementationDetails: string
    ) => {
      return await smartContractsService.createProposal(
        proposerPrivateKey,
        title,
        description,
        proposalType,
        category,
        implementationDetails
      );
    }, []),

    // Vote on proposal
    vote: useCallback(async (
      voterPrivateKey: string,
      proposalId: string,
      voteType: 'for' | 'against' | 'abstain',
      votingPower: string
    ) => {
      return await smartContractsService.voteOnProposal(
        voterPrivateKey,
        proposalId,
        voteType,
        votingPower
      );
    }, []),

    // Delegate vote
    delegate: useCallback(async (delegatorPrivateKey: string, delegate: string, votingPower: string) => {
      return await smartContractsService.delegateVote(delegatorPrivateKey, delegate, votingPower);
    }, []),
  };

  // System operations
  const systemOperations = {
    // Get system health
    getHealth: useCallback(async () => {
      return await smartContractsService.getSystemHealth();
    }, []),

    // Get system overview
    getOverview: useCallback(async () => {
      return await smartContractsService.getSystemOverview();
    }, []),

    // Get analytics
    getAnalytics: useCallback(async (timeframe: string = '24h') => {
      return await smartContractsService.getSystemAnalytics(timeframe);
    }, []),
  };

  // WebSocket operations
  const webSocketOperations = {
    // Connect WebSocket
    connect: useCallback((userId: string, token?: string) => {
      connectWebSocket(userId, token);
    }, [connectWebSocket]),

    // Disconnect WebSocket
    disconnect: useCallback(() => {
      disconnectWebSocket();
    }, [disconnectWebSocket]),

    // Subscribe to events
    subscribe: useCallback((events: string[]) => {
      subscribeToEvents(events);
    }, [subscribeToEvents]),

    // Unsubscribe from events
    unsubscribe: useCallback((events: string[]) => {
      unsubscribeFromEvents(events);
    }, [unsubscribeFromEvents]),

    // Event listeners
    onUbiClaim: useCallback((callback: (event: any) => void) => {
      smartContractsService.onUbiClaim(callback);
    }, []),

    onProposalCreated: useCallback((callback: (event: any) => void) => {
      smartContractsService.onProposalCreated(callback);
    }, []),

    onProposalVoted: useCallback((callback: (event: any) => void) => {
      smartContractsService.onProposalVoted(callback);
    }, []),

    onSystemAlert: useCallback((callback: (event: any) => void) => {
      smartContractsService.onSystemAlert(callback);
    }, []),
  };

  // Contract information
  const contractInfo = {
    // Get all contracts
    getAll: useCallback(() => {
      return smartContractsService.getAllContracts();
    }, []),

    // Get contract by name
    getContract: useCallback((contractName: keyof typeof SMART_CONTRACTS) => {
      return smartContractsService.getContract(contractName);
    }, []),

    // Get contract names
    getNames: useCallback(() => {
      return smartContractsService.getContractNames();
    }, []),

    // Check contract health
    checkHealth: useCallback(async (contractName: keyof typeof SMART_CONTRACTS) => {
      return await smartContractsService.checkContractHealth(contractName);
    }, []),

    // Check all contracts health
    checkAllHealth: useCallback(async () => {
      return await smartContractsService.checkAllContractsHealth();
    }, []),

    // Get contract features
    getFeatures: useCallback((contractName: keyof typeof SMART_CONTRACTS) => {
      return smartContractsService.getContractFeatures(contractName);
    }, []),

    // Get contract program ID
    getProgramId: useCallback((contractName: keyof typeof SMART_CONTRACTS) => {
      return smartContractsService.getContractProgramId(contractName);
    }, []),

    // Check if contract is active
    isActive: useCallback((contractName: keyof typeof SMART_CONTRACTS) => {
      return smartContractsService.isContractActive(contractName);
    }, []),
  };

  // Load initial data when connected
  useEffect(() => {
    if (isConnected) {
      loadContractStats();
    }
  }, [isConnected, loadContractStats]);

  // Auto-connect WebSocket when wallet connects
  useEffect(() => {
    if (isConnected) {
      // You would get the user ID from your auth system
      const userId = 'current-user-id'; // Replace with actual user ID
      webSocketOperations.connect(userId);
      
      // Subscribe to common events
      webSocketOperations.subscribe([
        'ubi_claim',
        'proposal_created',
        'proposal_voted',
        'system_alert',
      ]);
    } else {
      webSocketOperations.disconnect();
    }

    return () => {
      webSocketOperations.disconnect();
    };
  }, [isConnected]);

  return {
    // State
    contractStats,
    userData,
    isLoading,
    error,
    isConnected,
    walletBalance,
    tokenBalance,

    // Contract information
    contracts: smartContracts,
    contractInfo,

    // Operations
    ubi: ubiOperations,
    governance: governanceOperations,
    system: systemOperations,
    webSocket: webSocketOperations,

    // Utility functions
    loadContractStats,
    loadUserData,
    refreshData: loadContractStats,

    // Contract constants
    SMART_CONTRACTS,
  };
};

export default useSmartContracts;
