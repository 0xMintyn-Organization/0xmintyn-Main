import axios from 'axios';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
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
}

export interface FraudDetection {
  user: string;
  identityHash: number[];
  registrationTimestamp: string;
  verificationAttempts: number;
  isFlagged: boolean;
  riskScore: number;
  lastActivity: string;
}

export interface Treasury {
  authority: string;
  tokenMint: string;
  totalFunded: string;
  totalDistributed: string;
}

export interface EligibilityCheck {
  canClaimInitial: boolean;
  canClaimMonthly: boolean;
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

class BlockchainService {
  private apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/blockchain`,
    timeout: 30000,
    withCredentials: true,
  });

  constructor() {
    // Add request interceptor for auth tokens
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        toast.error(message);
        throw error;
      }
    );
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
    const response = await this.apiClient.get<ApiResponse<any>>('/connection/stats');
    return response.data;
  }

  // UBI System
  async getUbiConfig(): Promise<ApiResponse<{ blockchain: UbiConfig; database: any }>> {
    const response = await this.apiClient.get('/ubi/config');
    return response.data;
  }

  async getTreasury(): Promise<ApiResponse<{ blockchain: Treasury; database: any; stats: any }>> {
    const response = await this.apiClient.get('/ubi/treasury');
    return response.data;
  }

  async getUserProfile(publicKey: string): Promise<ApiResponse<{ profile: UserProfile; fraudDetection: FraudDetection; stats: any }>> {
    const response = await this.apiClient.get(`/ubi/user/${publicKey}`);
    return response.data;
  }

  async getUserBalance(publicKey: string): Promise<ApiResponse<{ balance: number }>> {
    const response = await this.apiClient.get(`/ubi/user/${publicKey}/balance`);
    return response.data;
  }

  async checkEligibility(publicKey: string): Promise<ApiResponse<EligibilityCheck>> {
    const response = await this.apiClient.get(`/ubi/user/${publicKey}/eligibility`);
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

  // Marketplace (placeholders for future implementation)
  async getMarketplaceListings() {
    const response = await this.apiClient.get('/marketplace/listings');
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

  // Governance (placeholders for future implementation)
  async getProposals() {
    const response = await this.apiClient.get('/governance/proposals');
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
}

export const blockchainService = new BlockchainService();
export default blockchainService;
