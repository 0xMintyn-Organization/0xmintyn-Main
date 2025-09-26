import axios from 'axios';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { toast } from 'react-hot-toast';
import { 
  SolanaServiceFactory, 
  UbiService, 
  GovernanceService, 
  MarketplaceService, 
  P2PService, 
  BridgeService,
  getConnectionPool 
} from './solana';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Enhanced types that combine API and blockchain data
export interface EnhancedUbiConfig {
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
  // Additional blockchain data
  blockchainConfig?: any;
  treasuryBalance?: string;
  lastUpdated?: string;
}

export interface EnhancedUserProfile {
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
  // Additional data
  tokenBalance?: number;
  canClaimInitial?: boolean;
  canClaimMonthly?: boolean;
  nextClaimTime?: string;
  blockchainProfile?: any;
}

export interface EnhancedFraudDetection {
  user: string;
  identityHash: number[];
  registrationTimestamp: string;
  verificationAttempts: number;
  isFlagged: boolean;
  riskScore: number;
  lastActivity: string;
  // Additional data
  reportsCount?: number;
  lastReport?: string;
  blockchainFraudData?: any;
}

export interface EnhancedTreasury {
  authority: string;
  tokenMint: string;
  totalFunded: string;
  totalDistributed: string;
  // Additional data
  availableBalance?: string;
  pendingDistributions?: string;
  blockchainTreasury?: any;
}

export interface EligibilityCheck {
  canClaimInitial: boolean;
  canClaimMonthly: boolean;
  nextClaimTime?: string;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TransactionRequest {
  privateKey: string;
  userTokenAccount?: string;
  adminTokenAccount?: string;
  amount?: string;
  identityHash?: string;
  referralCode?: string;
  userToVerify?: string;
  verificationScore?: number;
  userToSuspend?: string;
  suspend?: boolean;
  reason?: string;
  reportedUser?: string;
  active?: boolean;
  welcomeBonus?: string;
  initialUbi?: string;
  monthlyUbi?: string;
}

export interface ServiceStats {
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
  blockchain: {
    connectionPool: any;
    healthyEndpoints: number;
    totalConnections: number;
  };
  services: {
    ubi: boolean;
    governance: boolean;
    marketplace: boolean;
    p2p: boolean;
    bridge: boolean;
  };
}

class EnhancedBlockchainService {
  private apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/blockchain`,
    timeout: 30000,
    withCredentials: true,
  });

  private serviceFactory: SolanaServiceFactory | null = null;
  private connectionPool = getConnectionPool();
  private stats: ServiceStats = {
    api: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
    },
    blockchain: {
      connectionPool: null,
      healthyEndpoints: 0,
      totalConnections: 0,
    },
    services: {
      ubi: false,
      governance: false,
      marketplace: false,
      p2p: false,
      bridge: false,
    },
  };

  constructor() {
    this.initializeApiClient();
    this.initializeBlockchainServices();
  }

  private initializeApiClient() {
    // Add request interceptor for auth tokens
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling and stats
    this.apiClient.interceptors.response.use(
      (response) => {
        this.stats.api.totalRequests++;
        this.stats.api.successfulRequests++;
        return response;
      },
      (error) => {
        this.stats.api.totalRequests++;
        this.stats.api.failedRequests++;
        const message = error.response?.data?.message || error.message || 'An error occurred';
        toast.error(message);
        throw error;
      }
    );
  }

  private initializeBlockchainServices() {
    // This will be called when a provider is available
    // For now, we'll set up the connection pool stats
    this.updateConnectionStats();
  }

  private updateConnectionStats() {
    try {
      const connectionStats = this.connectionPool.getStats();
      const endpoints = this.connectionPool.getEndpoints();
      
      this.stats.blockchain = {
        connectionPool: connectionStats,
        healthyEndpoints: endpoints.filter(e => e.isHealthy).length,
        totalConnections: endpoints.length,
      };
    } catch (error) {
      console.warn('Failed to update connection stats:', error);
    }
  }

  // Initialize blockchain services with provider
  initializeBlockchainServices(provider: any) {
    try {
      this.serviceFactory = new SolanaServiceFactory(provider);
      this.stats.services = {
        ubi: true,
        governance: true,
        marketplace: true,
        p2p: true,
        bridge: true,
      };
    } catch (error) {
      console.error('Failed to initialize blockchain services:', error);
    }
  }

  // Get service statistics
  getStats(): ServiceStats {
    this.updateConnectionStats();
    return { ...this.stats };
  }

  // Health and System
  async getSystemHealth() {
    const response = await this.apiClient.get<ApiResponse<any>>('/health');
    return response.data;
  }

  async getSystemOverview() {
    const response = await this.apiClient.get<ApiResponse<any>>('/overview');
    return response.data;
  }

  async getUserOverview(publicKey: string) {
    const response = await this.apiClient.get<ApiResponse<any>>(`/user/${publicKey}/overview`);
    return response.data;
  }

  async getPrograms() {
    const response = await this.apiClient.get<ApiResponse<any>>('/programs');
    return response.data;
  }

  async getConnectionStats() {
    this.updateConnectionStats();
    return {
      success: true,
      data: this.stats.blockchain,
    };
  }

  // Enhanced UBI System
  async getUbiConfig(): Promise<ApiResponse<{ blockchain: EnhancedUbiConfig; database: any }>> {
    const response = await this.apiClient.get('/ubi/config');
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const blockchainConfig = await this.serviceFactory.getUbiService().getUbiConfig();
        const treasury = await this.serviceFactory.getUbiService().getTreasury();
        
        if (response.data.success && response.data.data) {
          response.data.data.blockchain = {
            ...response.data.data.blockchain,
            blockchainConfig,
            treasuryBalance: treasury?.totalFunded.toString(),
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to enhance UBI config with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async getTreasury(): Promise<ApiResponse<{ blockchain: EnhancedTreasury; database: any; stats: any }>> {
    const response = await this.apiClient.get('/ubi/treasury');
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const blockchainTreasury = await this.serviceFactory.getUbiService().getTreasury();
        
        if (response.data.success && response.data.data) {
          response.data.data.blockchain = {
            ...response.data.data.blockchain,
            blockchainTreasury,
            availableBalance: blockchainTreasury?.totalFunded.sub(blockchainTreasury?.totalDistributed).toString(),
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to enhance treasury with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async getUserProfile(publicKey: string): Promise<ApiResponse<{ profile: EnhancedUserProfile; fraudDetection: EnhancedFraudDetection; stats: any }>> {
    const response = await this.apiClient.get(`/ubi/user/${publicKey}`);
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const userPubkey = new PublicKey(publicKey);
        const blockchainProfile = await this.serviceFactory.getUbiService().getUserProfile(userPubkey);
        const canClaimInitial = await this.serviceFactory.getUbiService().canClaimInitialUbi(userPubkey);
        const canClaimMonthly = await this.serviceFactory.getUbiService().canClaimMonthlyUbi(userPubkey);
        const tokenBalance = await this.serviceFactory.getUbiService().getUserTokenBalance(userPubkey);
        
        if (response.data.success && response.data.data) {
          response.data.data.profile = {
            ...response.data.data.profile,
            blockchainProfile,
            tokenBalance,
            canClaimInitial,
            canClaimMonthly,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to enhance user profile with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async getUserBalance(publicKey: string): Promise<ApiResponse<{ balance: number }>> {
    const response = await this.apiClient.get(`/ubi/user/${publicKey}/balance`);
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const userPubkey = new PublicKey(publicKey);
        const blockchainBalance = await this.serviceFactory.getUbiService().getUserTokenBalance(userPubkey);
        
        if (response.data.success) {
          response.data.data.balance = blockchainBalance;
        }
      } catch (error) {
        console.warn('Failed to enhance balance with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async checkEligibility(publicKey: string): Promise<ApiResponse<EligibilityCheck>> {
    const response = await this.apiClient.get(`/ubi/user/${publicKey}/eligibility`);
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const userPubkey = new PublicKey(publicKey);
        const canClaimInitial = await this.serviceFactory.getUbiService().canClaimInitialUbi(userPubkey);
        const canClaimMonthly = await this.serviceFactory.getUbiService().canClaimMonthlyUbi(userPubkey);
        
        if (response.data.success) {
          response.data.data = {
            ...response.data.data,
            canClaimInitial,
            canClaimMonthly,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to enhance eligibility with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async getUbiStats(): Promise<ApiResponse<any>> {
    const response = await this.apiClient.get('/ubi/stats');
    return response.data;
  }

  async getFraudAlerts(riskThreshold = 70): Promise<ApiResponse<any[]>> {
    const response = await this.apiClient.get(`/ubi/fraud-alerts?riskThreshold=${riskThreshold}`);
    return response.data;
  }

  // UBI Transactions
  async initializeUser(request: TransactionRequest): Promise<ApiResponse<{ txHash: string; publicKey: string }>> {
    const response = await this.apiClient.post('/ubi/initialize-user', request);
    return response.data;
  }

  async claimInitialUbi(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/claim-initial', request);
    return response.data;
  }

  async claimMonthlyUbi(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/claim-monthly', request);
    return response.data;
  }

  async reportFraud(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/report-fraud', {
      reporterPrivateKey: request.privateKey,
      reportedUser: request.reportedUser,
      reason: request.reason,
    });
    return response.data;
  }

  // Admin UBI Functions
  async fundTreasury(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/admin/fund-treasury', {
      adminPrivateKey: request.privateKey,
      amount: request.amount,
      adminTokenAccount: request.adminTokenAccount,
    });
    return response.data;
  }

  async verifyUser(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/admin/verify-user', {
      adminPrivateKey: request.privateKey,
      userToVerify: request.userToVerify,
      verificationScore: request.verificationScore,
    });
    return response.data;
  }

  async suspendUser(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/admin/suspend-user', {
      adminPrivateKey: request.privateKey,
      userToSuspend: request.userToSuspend,
      suspend: request.suspend,
      reason: request.reason,
    });
    return response.data;
  }

  async toggleProgram(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/admin/toggle-program', {
      adminPrivateKey: request.privateKey,
      active: request.active,
    });
    return response.data;
  }

  async updateUbiAmounts(request: TransactionRequest): Promise<ApiResponse<{ txHash: string }>> {
    const response = await this.apiClient.post('/ubi/admin/update-amounts', {
      adminPrivateKey: request.privateKey,
      welcomeBonus: request.welcomeBonus,
      initialUbi: request.initialUbi,
      monthlyUbi: request.monthlyUbi,
    });
    return response.data;
  }

  // Enhanced Governance System
  async getProposals() {
    const response = await this.apiClient.get('/governance/proposals');
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const blockchainProposals = await this.serviceFactory.getGovernanceService().getAllProposals();
        
        if (response.data.success) {
          response.data.data = {
            ...response.data.data,
            blockchainProposals,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to enhance proposals with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async createProposal(request: any) {
    const response = await this.apiClient.post('/governance/create-proposal', request);
    return response.data;
  }

  async vote(request: any) {
    const response = await this.apiClient.post('/governance/vote', request);
    return response.data;
  }

  // Enhanced Marketplace System
  async getMarketplaceListings() {
    const response = await this.apiClient.get('/marketplace/listings');
    
    // Enhance with blockchain data if available
    if (this.serviceFactory) {
      try {
        const blockchainProducts = await this.serviceFactory.getMarketplaceService().getAllProducts();
        
        if (response.data.success) {
          response.data.data = {
            ...response.data.data,
            blockchainProducts,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to enhance marketplace listings with blockchain data:', error);
      }
    }
    
    return response.data;
  }

  async createListing(request: any) {
    const response = await this.apiClient.post('/marketplace/create', request);
    return response.data;
  }

  async purchaseProduct(request: any) {
    const response = await this.apiClient.post('/marketplace/purchase', request);
    return response.data;
  }

  // Enhanced P2P Exchange
  async getP2POrderBook(tokenMint?: string) {
    if (this.serviceFactory && tokenMint) {
      try {
        const orderBook = await this.serviceFactory.getP2PService().getOrderBook(new PublicKey(tokenMint));
        return {
          success: true,
          data: orderBook,
        };
      } catch (error) {
        console.error('Failed to get P2P order book:', error);
        return {
          success: false,
          data: null,
          message: 'Failed to fetch order book',
        };
      }
    }
    
    return {
      success: false,
      data: null,
      message: 'P2P service not available',
    };
  }

  async getP2PTradingStats(tokenMint?: string) {
    if (this.serviceFactory && tokenMint) {
      try {
        const stats = await this.serviceFactory.getP2PService().getTradingStats(new PublicKey(tokenMint));
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('Failed to get P2P trading stats:', error);
        return {
          success: false,
          data: null,
          message: 'Failed to fetch trading stats',
        };
      }
    }
    
    return {
      success: false,
      data: null,
      message: 'P2P service not available',
    };
  }

  // Enhanced Bridge System
  async getBridgeConfig() {
    if (this.serviceFactory) {
      try {
        const config = await this.serviceFactory.getBridgeService().getBridgeConfig();
        return {
          success: true,
          data: config,
        };
      } catch (error) {
        console.error('Failed to get bridge config:', error);
        return {
          success: false,
          data: null,
          message: 'Failed to fetch bridge config',
        };
      }
    }
    
    return {
      success: false,
      data: null,
      message: 'Bridge service not available',
    };
  }

  async getBridgeHealth() {
    if (this.serviceFactory) {
      try {
        const health = await this.serviceFactory.getBridgeService().getBridgeHealth();
        return {
          success: true,
          data: health,
        };
      } catch (error) {
        console.error('Failed to get bridge health:', error);
        return {
          success: false,
          data: null,
          message: 'Failed to fetch bridge health',
        };
      }
    }
    
    return {
      success: false,
      data: null,
      message: 'Bridge service not available',
    };
  }

  async getBridgeStats() {
    if (this.serviceFactory) {
      try {
        const stats = await this.serviceFactory.getBridgeService().getBridgeStats();
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('Failed to get bridge stats:', error);
        return {
          success: false,
          data: null,
          message: 'Failed to fetch bridge stats',
        };
      }
    }
    
    return {
      success: false,
      data: null,
      message: 'Bridge service not available',
    };
  }

  // Cache and Analytics
  async getCacheStats() {
    const response = await this.apiClient.get('/cache/stats');
    return response.data;
  }

  async clearCache(pattern = '*') {
    const response = await this.apiClient.post('/cache/clear', { pattern });
    return response.data;
  }

  async getDailyAnalytics(date?: string) {
    const queryParam = date ? `?date=${date}` : '';
    const response = await this.apiClient.get(`/analytics/daily${queryParam}`);
    return response.data;
  }

  async getTrends(program = 'all', timeframe = '7d', metric = 'volume') {
    const response = await this.apiClient.get(`/analytics/trends?program=${program}&timeframe=${timeframe}&metric=${metric}`);
    return response.data;
  }

  // WebSocket Events
  async getEventChannels() {
    const response = await this.apiClient.get('/events/channels');
    return response.data;
  }

  // Batch Operations
  async executeBatch(operations: any[]) {
    const response = await this.apiClient.post('/batch', { operations });
    return response.data;
  }

  // Worker Control
  async startWorker() {
    const response = await this.apiClient.post('/worker/start');
    return response.data;
  }

  async stopWorker() {
    const response = await this.apiClient.post('/worker/stop');
    return response.data;
  }

  async getWorkerStatus() {
    const response = await this.apiClient.get('/worker/status');
    return response.data;
  }

  // Get all blockchain services
  getBlockchainServices() {
    if (!this.serviceFactory) {
      return null;
    }
    
    return this.serviceFactory.getAllServices();
  }

  // Get specific blockchain service
  getUbiService(): UbiService | null {
    return this.serviceFactory?.getUbiService() || null;
  }

  getGovernanceService(): GovernanceService | null {
    return this.serviceFactory?.getGovernanceService() || null;
  }

  getMarketplaceService(): MarketplaceService | null {
    return this.serviceFactory?.getMarketplaceService() || null;
  }

  getP2PService(): P2PService | null {
    return this.serviceFactory?.getP2PService() || null;
  }

  getBridgeService(): BridgeService | null {
    return this.serviceFactory?.getBridgeService() || null;
  }

  // Cleanup
  cleanup() {
    if (this.serviceFactory) {
      this.serviceFactory.cleanup();
      this.serviceFactory = null;
    }
  }
}

export const enhancedBlockchainService = new EnhancedBlockchainService();
export default enhancedBlockchainService;
