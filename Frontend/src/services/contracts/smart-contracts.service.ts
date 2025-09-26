import { PublicKey } from '@solana/web3.js';
import { blockchainApiClient } from '../api/blockchain.client';
import { blockchainWebSocketClient } from '../websocket/blockchain.websocket';
import { toast } from 'react-hot-toast';

// Smart Contract Names and IDs
export const SMART_CONTRACTS = {
  // UBI Distribution Contract
  UBI_DISTRIBUTION: {
    name: 'MintynUBIDistribution',
    description: 'Universal Basic Income distribution system with fraud detection',
    programId: process.env.NEXT_PUBLIC_UBI_PROGRAM_ID || '11111111111111111111111111111111',
    features: [
      'User registration and verification',
      'Welcome bonus distribution',
      'Initial UBI claims',
      'Monthly UBI distribution',
      'Fraud detection and reporting',
      'Treasury management',
      'Admin controls'
    ],
    endpoints: {
      config: '/ubi/config',
      treasury: '/ubi/treasury',
      userProfile: '/ubi/user',
      stats: '/ubi/stats',
      fraudAlerts: '/ubi/fraud-alerts'
    }
  },

  // Governance Contract
  GOVERNANCE: {
    name: 'MintynGovernance',
    description: 'Decentralized governance system for protocol decisions',
    programId: process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111',
    features: [
      'Proposal creation and management',
      'Voting with token weights',
      'Vote delegation',
      'Proposal execution',
      'Quorum and supermajority requirements',
      'Governance token integration',
      'Real-time vote tracking'
    ],
    endpoints: {
      config: '/governance/config',
      proposals: '/governance/proposals',
      proposal: '/governance/proposal',
      stats: '/governance/stats'
    }
  },

  // Digital Marketplace Contract
  MARKETPLACE: {
    name: 'MintynDigitalMarketplace',
    description: 'Decentralized marketplace for digital products and services',
    programId: process.env.NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID || '11111111111111111111111111111111',
    features: [
      'Product listing and management',
      'Escrow-based transactions',
      'Dispute resolution',
      'Creator royalties',
      'Marketplace fees',
      'Product categories and search',
      'Review and rating system'
    ],
    endpoints: {
      products: '/marketplace/products',
      orders: '/marketplace/orders',
      disputes: '/marketplace/disputes',
      stats: '/marketplace/stats'
    }
  },

  // P2P Exchange Contract
  P2P_EXCHANGE: {
    name: 'MintynP2PExchange',
    description: 'Peer-to-peer exchange for direct token trading',
    programId: process.env.NEXT_PUBLIC_P2P_PROGRAM_ID || '11111111111111111111111111111111',
    features: [
      'Order book management',
      'Limit and market orders',
      'Trade execution',
      'Reputation system',
      'Escrow protection',
      'Fiat payment integration',
      'Trading history'
    ],
    endpoints: {
      orderBook: '/p2p/orderbook',
      orders: '/p2p/orders',
      trades: '/p2p/trades',
      reputation: '/p2p/reputation'
    }
  },

  // Cross-Chain Bridge Contract
  CROSS_CHAIN_BRIDGE: {
    name: 'MintynCrossChainBridge',
    description: 'Cross-chain asset bridging for multi-network support',
    programId: process.env.NEXT_PUBLIC_BRIDGE_PROGRAM_ID || '11111111111111111111111111111111',
    features: [
      'Multi-chain asset bridging',
      'Bridge security verification',
      'Transaction monitoring',
      'Bridge health monitoring',
      'Supported chain management',
      'Bridge fees and limits',
      'Emergency pause functionality'
    ],
    endpoints: {
      config: '/bridge/config',
      health: '/bridge/health',
      transactions: '/bridge/transactions',
      supportedChains: '/bridge/chains'
    }
  },

  // P2P Escrow Contract
  P2P_ESCROW: {
    name: 'MintynP2PEscrow',
    description: 'Secure escrow system for P2P transactions',
    programId: process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID || '11111111111111111111111111111111',
    features: [
      'Secure fund holding',
      'Multi-signature releases',
      'Dispute resolution',
      'Time-locked releases',
      'Escrow fees',
      'Transaction history',
      'Automated settlements'
    ],
    endpoints: {
      escrows: '/escrow/escrows',
      disputes: '/escrow/disputes',
      releases: '/escrow/releases'
    }
  },

  // SPL Token Contract (Standard)
  SPL_TOKEN: {
    name: 'SPLToken',
    description: 'Solana Program Library Token standard',
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    features: [
      'Token creation and management',
      'Token transfers',
      'Token accounts',
      'Associated token accounts',
      'Token metadata',
      'Token authority management'
    ]
  }
} as const;

// Smart Contract Service Class
export class SmartContractsService {
  private contracts: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeContracts();
  }

  private initializeContracts(): void {
    // Initialize all smart contracts
    Object.entries(SMART_CONTRACTS).forEach(([key, contract]) => {
      this.contracts.set(key, {
        ...contract,
        programId: new PublicKey(contract.programId),
        isActive: true,
        lastHealthCheck: Date.now(),
      });
    });

    this.isInitialized = true;
    console.log('Smart contracts initialized:', Array.from(this.contracts.keys()));
  }

  // Get contract information
  public getContract(contractName: keyof typeof SMART_CONTRACTS): any {
    return this.contracts.get(contractName);
  }

  public getAllContracts(): Map<string, any> {
    return new Map(this.contracts);
  }

  public getContractNames(): string[] {
    return Array.from(this.contracts.keys());
  }

  // Contract health checks
  public async checkContractHealth(contractName: keyof typeof SMART_CONTRACTS): Promise<boolean> {
    try {
      const contract = this.contracts.get(contractName);
      if (!contract) return false;

      // Perform health check based on contract type
      switch (contractName) {
        case 'UBI_DISTRIBUTION':
          await blockchainApiClient.getUbiConfig();
          break;
        case 'GOVERNANCE':
          await blockchainApiClient.getGovernanceConfig();
          break;
        case 'MARKETPLACE':
          // TODO: Implement marketplace health check
          break;
        case 'P2P_EXCHANGE':
          // TODO: Implement P2P health check
          break;
        case 'CROSS_CHAIN_BRIDGE':
          // TODO: Implement bridge health check
          break;
        case 'P2P_ESCROW':
          // TODO: Implement escrow health check
          break;
        default:
          return true;
      }

      contract.lastHealthCheck = Date.now();
      return true;
    } catch (error) {
      console.error(`Health check failed for ${contractName}:`, error);
      return false;
    }
  }

  public async checkAllContractsHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const contractName of this.getContractNames()) {
      results[contractName] = await this.checkContractHealth(contractName as keyof typeof SMART_CONTRACTS);
    }

    return results;
  }

  // UBI Contract operations
  public async getUbiConfig() {
    return await blockchainApiClient.getUbiConfig();
  }

  public async getUserUbiProfile(publicKey: string) {
    return await blockchainApiClient.getUserProfile(publicKey);
  }

  public async claimInitialUbi(privateKey: string, userTokenAccount: string) {
    try {
      const result = await blockchainApiClient.claimInitialUbi(privateKey, userTokenAccount);
      toast.success('Initial UBI claim transaction submitted!');
      return result;
    } catch (error) {
      toast.error('Failed to claim initial UBI');
      throw error;
    }
  }

  public async claimMonthlyUbi(privateKey: string, userTokenAccount: string) {
    try {
      const result = await blockchainApiClient.claimMonthlyUbi(privateKey, userTokenAccount);
      toast.success('Monthly UBI claim transaction submitted!');
      return result;
    } catch (error) {
      toast.error('Failed to claim monthly UBI');
      throw error;
    }
  }

  public async reportFraud(reporterPrivateKey: string, reportedUser: string, reason: string) {
    try {
      const result = await blockchainApiClient.reportFraud(reporterPrivateKey, reportedUser, reason);
      toast.success('Fraud report submitted!');
      return result;
    } catch (error) {
      toast.error('Failed to submit fraud report');
      throw error;
    }
  }

  // Governance Contract operations
  public async getGovernanceConfig() {
    return await blockchainApiClient.getGovernanceConfig();
  }

  public async getProposals(status?: string, type?: string, category?: string) {
    return await blockchainApiClient.getProposals(status, type, category);
  }

  public async getProposal(proposalId: string) {
    return await blockchainApiClient.getProposal(proposalId);
  }

  public async createProposal(
    proposerPrivateKey: string,
    title: string,
    description: string,
    proposalType: string,
    category: string,
    implementationDetails: string
  ) {
    try {
      const result = await blockchainApiClient.createProposal(
        proposerPrivateKey,
        title,
        description,
        proposalType,
        category,
        implementationDetails
      );
      toast.success('Proposal created successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to create proposal');
      throw error;
    }
  }

  public async voteOnProposal(
    voterPrivateKey: string,
    proposalId: string,
    voteType: 'for' | 'against' | 'abstain',
    votingPower: string
  ) {
    try {
      const result = await blockchainApiClient.voteOnProposal(
        voterPrivateKey,
        proposalId,
        voteType,
        votingPower
      );
      toast.success('Vote submitted successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to submit vote');
      throw error;
    }
  }

  public async delegateVote(delegatorPrivateKey: string, delegate: string, votingPower: string) {
    try {
      const result = await blockchainApiClient.delegateVote(delegatorPrivateKey, delegate, votingPower);
      toast.success('Vote delegation submitted!');
      return result;
    } catch (error) {
      toast.error('Failed to delegate vote');
      throw error;
    }
  }

  // System operations
  public async getSystemHealth() {
    return await blockchainApiClient.getHealth();
  }

  public async getSystemOverview() {
    return await blockchainApiClient.getOverview();
  }

  public async getUserOverview(publicKey: string) {
    return await blockchainApiClient.getUserOverview(publicKey);
  }

  public async getSystemAnalytics(timeframe: string = '24h') {
    return await blockchainApiClient.getAnalytics(timeframe);
  }

  // WebSocket operations
  public connectWebSocket(userId: string, token?: string) {
    blockchainWebSocketClient.authenticate(userId, token);
  }

  public disconnectWebSocket() {
    blockchainWebSocketClient.disconnect();
  }

  public subscribeToEvents(events: string[]) {
    blockchainWebSocketClient.subscribe(events);
  }

  public unsubscribeFromEvents(events: string[]) {
    blockchainWebSocketClient.unsubscribe(events);
  }

  // Event listeners
  public onUbiClaim(callback: (event: any) => void) {
    blockchainWebSocketClient.onUbiClaim(callback);
  }

  public onProposalCreated(callback: (event: any) => void) {
    blockchainWebSocketClient.onProposalCreated(callback);
  }

  public onProposalVoted(callback: (event: any) => void) {
    blockchainWebSocketClient.onProposalVoted(callback);
  }

  public onSystemAlert(callback: (event: any) => void) {
    blockchainWebSocketClient.onSystemAlert(callback);
  }

  // Contract statistics
  public async getContractStats() {
    const [systemHealth, ubiStats, governanceStats] = await Promise.all([
      this.getSystemHealth(),
      blockchainApiClient.getUbiStats(),
      blockchainApiClient.getGovernanceStats(),
    ]);

    return {
      system: systemHealth,
      ubi: ubiStats,
      governance: governanceStats,
      contracts: await this.checkAllContractsHealth(),
    };
  }

  // Utility methods
  public getContractProgramId(contractName: keyof typeof SMART_CONTRACTS): PublicKey {
    const contract = this.contracts.get(contractName);
    return contract?.programId || PublicKey.default;
  }

  public isContractActive(contractName: keyof typeof SMART_CONTRACTS): boolean {
    const contract = this.contracts.get(contractName);
    return contract?.isActive || false;
  }

  public getContractFeatures(contractName: keyof typeof SMART_CONTRACTS): string[] {
    const contract = this.contracts.get(contractName);
    return contract?.features || [];
  }

  // Cleanup
  public destroy() {
    this.contracts.clear();
    this.isInitialized = false;
    blockchainWebSocketClient.destroy();
  }
}

// Singleton instance
export const smartContractsService = new SmartContractsService();

// Export contract names for easy access
export const {
  UBI_DISTRIBUTION,
  GOVERNANCE,
  MARKETPLACE,
  P2P_EXCHANGE,
  CROSS_CHAIN_BRIDGE,
  P2P_ESCROW,
  SPL_TOKEN,
} = SMART_CONTRACTS;

export default smartContractsService;
