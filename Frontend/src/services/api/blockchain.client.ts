import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Types for all smart contracts
export interface UbiConfig {
  admin: string;
  tokenMint: string;
  welcomeBonusAmount: string;
  initialUbiAmount: string;
  monthlyUbiAmount: string;
  maxUsers: number;
  totalUsers: number;
  totalDistributed: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  onChainSlot: number;
  lastSyncAt: string;
}

export interface UserProfile {
  user: string;
  identityHash: number[];
  registeredAt: string;
  welcomeBonusClaimed: boolean;
  initialUbiClaimed: boolean;
  lastMonthlyClaim: string;
  totalClaimed: string;
  isVerified: boolean;
  isSuspended: boolean;
  referralCode?: string;
  verificationScore: number;
  createdAt: string;
  updatedAt: string;
  onChainSlot: number;
  lastSyncAt: string;
}

export interface Proposal {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
  proposalType: 'parameter_change' | 'technical_upgrade' | 'security_update' | 'treasury' | 'governance' | 'other';
  category: string;
  votesFor: string;
  votesAgainst: string;
  totalVotes: string;
  quorumRequired: string;
  isExecuted: boolean;
  executionData?: string;
  implementationDetails?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  onChainSlot: number;
  lastSyncAt: string;
}

export interface Vote {
  voter: string;
  proposal: string;
  voteType: 'for' | 'against' | 'abstain';
  votingPower: string;
  timestamp: string;
  transactionHash: string;
  blockTime: number;
  slot: number;
  createdAt: string;
  updatedAt: string;
}

export interface Delegation {
  delegator: string;
  delegate: string;
  votingPower: string;
  createdAt: string;
  isActive: boolean;
  transactionHash: string;
  blockTime: number;
  slot: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemHealth {
  healthy: boolean;
  services: {
    connection: {
      healthy: boolean;
      activeEndpoints: number;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      avgResponseTime: number;
    };
    redis: {
      connected: boolean;
      memory: any;
      queueLengths: Record<string, number>;
    };
    workers: {
      ubi: {
        running: boolean;
        queueLengths: Record<string, number>;
      };
    };
    websocket: {
      connected: boolean;
      clients: number;
      rooms: number;
    };
    programs: {
      ubi: boolean;
      governance: boolean;
      marketplace: boolean;
      p2p: boolean;
      bridge: boolean;
    };
  };
  errors: string[];
}

export interface UserOverview {
  publicKey: string;
  ubi: {
    profile: UserProfile | null;
    eligibility: {
      canClaimInitial: boolean;
      canClaimMonthly: boolean;
    } | null;
    balance: number;
    canClaimInitial: boolean;
    canClaimMonthly: boolean;
  };
  governance: {
    votingPower: string;
    votes: Array<{
      proposalId: string;
      voteType: string;
      votingPower: string;
      timestamp: string;
    }>;
    delegations: Array<{
      delegate: string;
      votingPower: string;
      createdAt: string;
      isActive: boolean;
    }>;
    proposals: any[];
  };
  marketplace: {
    products: any[];
    orders: any[];
    sales: any[];
  };
  p2p: {
    orders: any[];
    trades: any[];
    reputation: number;
  };
  bridge: {
    transactions: any[];
    supportedChains: any[];
  };
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Blockchain API Client
export class BlockchainApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1/blockchain`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        if (!response.data.success) {
          throw new Error(response.data.error || 'API request failed');
        }
        return response;
      },
      (error) => {
        const message = error.response?.data?.error || error.message || 'Network error';
        toast.error(message);
        return Promise.reject(error);
      }
    );
  }

  // System endpoints
  async getHealth(): Promise<SystemHealth> {
    const response = await this.client.get<ApiResponse<SystemHealth>>('/health');
    return response.data.data!;
  }

  async getOverview(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/overview');
    return response.data.data!;
  }

  async getUserOverview(publicKey: string): Promise<UserOverview> {
    const response = await this.client.get<ApiResponse<UserOverview>>(`/user/${publicKey}/overview`);
    return response.data.data!;
  }

  async getAnalytics(timeframe: string = '24h', type: string = 'all'): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/analytics?timeframe=${timeframe}&type=${type}`);
    return response.data.data!;
  }

  async getEventChannels(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/events');
    return response.data.data!;
  }

  // UBI Contract endpoints
  async getUbiConfig(): Promise<{ blockchain: UbiConfig; database: UbiConfig }> {
    const response = await this.client.get<ApiResponse<{ blockchain: UbiConfig; database: UbiConfig }>>('/ubi/config');
    return response.data.data!;
  }

  async getTreasury(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/ubi/treasury');
    return response.data.data!;
  }

  async getUserProfile(publicKey: string): Promise<{
    profile: UserProfile;
    fraudDetection: any;
    stats: any;
  }> {
    const response = await this.client.get<ApiResponse<{
      profile: UserProfile;
      fraudDetection: any;
      stats: any;
    }>>(`/ubi/user/${publicKey}`);
    return response.data.data!;
  }

  async getUserBalance(publicKey: string): Promise<{ balance: number }> {
    const response = await this.client.get<ApiResponse<{ balance: number }>>(`/ubi/user/${publicKey}/balance`);
    return response.data.data!;
  }

  async checkUserEligibility(publicKey: string): Promise<{
    canClaimInitial: boolean;
    canClaimMonthly: boolean;
    nextClaimTime: string;
    reason: string | null;
  }> {
    const response = await this.client.get<ApiResponse<{
      canClaimInitial: boolean;
      canClaimMonthly: boolean;
      nextClaimTime: string;
      reason: string | null;
    }>>(`/ubi/user/${publicKey}/eligibility`);
    return response.data.data!;
  }

  async getUbiStats(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/ubi/stats');
    return response.data.data!;
  }

  async getFraudAlerts(riskThreshold: number = 70): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/ubi/fraud-alerts?riskThreshold=${riskThreshold}`);
    return response.data.data!;
  }

  // UBI Contract transactions
  async initializeUser(privateKey: string, identityHash: number[], referralCode?: string): Promise<{
    txHash: string;
    publicKey: string;
  }> {
    const response = await this.client.post<ApiResponse<{
      txHash: string;
      publicKey: string;
    }>>('/ubi/initialize-user', {
      privateKey,
      identityHash,
      referralCode,
    });
    return response.data.data!;
  }

  async claimInitialUbi(privateKey: string, userTokenAccount: string): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/claim-initial', {
      privateKey,
      userTokenAccount,
    });
    return response.data.data!;
  }

  async claimMonthlyUbi(privateKey: string, userTokenAccount: string): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/claim-monthly', {
      privateKey,
      userTokenAccount,
    });
    return response.data.data!;
  }

  async reportFraud(reporterPrivateKey: string, reportedUser: string, reason: string): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/report-fraud', {
      reporterPrivateKey,
      reportedUser,
      reason,
    });
    return response.data.data!;
  }

  // UBI Admin functions
  async fundTreasury(adminPrivateKey: string, amount: string, adminTokenAccount: string): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/admin/fund-treasury', {
      adminPrivateKey,
      amount,
      adminTokenAccount,
    });
    return response.data.data!;
  }

  async verifyUser(adminPrivateKey: string, userToVerify: string, verificationScore: number): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/admin/verify-user', {
      adminPrivateKey,
      userToVerify,
      verificationScore,
    });
    return response.data.data!;
  }

  async suspendUser(adminPrivateKey: string, userToSuspend: string, suspend: boolean, reason: string): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/admin/suspend-user', {
      adminPrivateKey,
      userToSuspend,
      suspend,
      reason,
    });
    return response.data.data!;
  }

  async toggleProgram(adminPrivateKey: string, active: boolean): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/admin/toggle-program', {
      adminPrivateKey,
      active,
    });
    return response.data.data!;
  }

  async updateUbiAmounts(adminPrivateKey: string, welcomeBonus?: string, initialUbi?: string, monthlyUbi?: string): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/ubi/admin/update-amounts', {
      adminPrivateKey,
      welcomeBonus,
      initialUbi,
      monthlyUbi,
    });
    return response.data.data!;
  }

  // Governance Contract endpoints
  async getGovernanceConfig(): Promise<{ blockchain: any; database: any }> {
    const response = await this.client.get<ApiResponse<{ blockchain: any; database: any }>>('/governance/config');
    return response.data.data!;
  }

  async getProposals(status?: string, type?: string, category?: string, limit: number = 50, offset: number = 0): Promise<{
    proposals: Proposal[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await this.client.get<ApiResponse<{
      proposals: Proposal[];
      total: number;
      pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>>(`/governance/proposals?${params.toString()}`);
    return response.data.data!;
  }

  async getProposal(proposalId: string): Promise<{
    proposal: Proposal;
    stats: any;
  }> {
    const response = await this.client.get<ApiResponse<{
      proposal: Proposal;
      stats: any;
    }>>(`/governance/proposal/${proposalId}`);
    return response.data.data!;
  }

  async getUserVotingPower(publicKey: string): Promise<{ votingPower: string }> {
    const response = await this.client.get<ApiResponse<{ votingPower: string }>>(`/governance/user/${publicKey}/voting-power`);
    return response.data.data!;
  }

  async getUserVote(proposalId: string, publicKey: string): Promise<Vote> {
    const response = await this.client.get<ApiResponse<Vote>>(`/governance/proposal/${proposalId}/vote/${publicKey}`);
    return response.data.data!;
  }

  async getUserVotingHistory(publicKey: string, limit: number = 50): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/governance/user/${publicKey}/voting-history?limit=${limit}`);
    return response.data.data!;
  }

  async getUserDelegations(publicKey: string): Promise<Delegation[]> {
    const response = await this.client.get<ApiResponse<Delegation[]>>(`/governance/user/${publicKey}/delegations`);
    return response.data.data!;
  }

  async getGovernanceStats(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/governance/stats');
    return response.data.data!;
  }

  // Governance Contract transactions
  async createProposal(
    proposerPrivateKey: string,
    title: string,
    description: string,
    proposalType: string,
    category: string,
    implementationDetails: string,
    votingPeriod?: number
  ): Promise<{
    proposalId: string;
    txHash: string;
  }> {
    const response = await this.client.post<ApiResponse<{
      proposalId: string;
      txHash: string;
    }>>('/governance/create-proposal', {
      proposerPrivateKey,
      title,
      description,
      proposalType,
      category,
      implementationDetails,
      votingPeriod,
    });
    return response.data.data!;
  }

  async voteOnProposal(
    voterPrivateKey: string,
    proposalId: string,
    voteType: 'for' | 'against' | 'abstain',
    votingPower: string
  ): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/governance/vote', {
      voterPrivateKey,
      proposalId,
      voteType,
      votingPower,
    });
    return response.data.data!;
  }

  async delegateVote(
    delegatorPrivateKey: string,
    delegate: string,
    votingPower: string
  ): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/governance/delegate', {
      delegatorPrivateKey,
      delegate,
      votingPower,
    });
    return response.data.data!;
  }

  async executeProposal(
    executorPrivateKey: string,
    proposalId: string,
    executionData: string
  ): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/governance/execute-proposal', {
      executorPrivateKey,
      proposalId,
      executionData,
    });
    return response.data.data!;
  }
}

// Singleton instance
export const blockchainApiClient = new BlockchainApiClient();

// Export types
export type {
  UbiConfig,
  UserProfile,
  Proposal,
  Vote,
  Delegation,
  SystemHealth,
  UserOverview,
};
