"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Wallet utilities for future crypto functionality
// This file provides a foundation for implementing various crypto features

export interface WalletProvider {
  name: string;
  isInstalled: boolean;
  connect: () => Promise<any>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<any>;
  getBalance: (address: string) => Promise<number>;
  sendTransaction: (transaction: any) => Promise<string>;
}

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  price?: number;
}

export interface NFTInfo {
  mint: string;
  name: string;
  image: string;
  description: string;
  collection?: string;
  attributes?: any[];
}

// Phantom Wallet Provider
export class PhantomProvider implements WalletProvider {
  name = 'phantom';
  private provider: any;

  constructor() {
    // Check if window is available (client-side only)
    if (typeof window !== 'undefined') {
      this.provider = (window as any).solana;
    }
  }

  get isInstalled(): boolean {
    // Only check if window is available
    if (typeof window === 'undefined') return false;
    return this.provider?.isPhantom || false;
  }

  async connect() {
    if (!this.isInstalled || !this.provider) {
      throw new Error('Phantom wallet not installed');
    }

    const response = await this.provider.connect();
    return {
      publicKey: response.publicKey.toString(),
      address: response.publicKey.toString(),
    };
  }

  async disconnect() {
    if (!this.isInstalled || !this.provider) return;
    await this.provider.disconnect();
  }

  async signMessage(message: string) {
    if (!this.isInstalled || !this.provider) {
      throw new Error('Phantom wallet not installed');
    }

    const encodedMessage = new TextEncoder().encode(message);
    return await this.provider.signMessage(encodedMessage);
  }

  async getBalance(address: string): Promise<number> {
    if (!this.isInstalled || !this.provider) {
      throw new Error('Phantom wallet not installed');
    }

    try {
      const response = await this.provider.request({
        method: 'getBalance',
        params: [address],
      });
      
      // Convert lamports to SOL
      return response.value / 1_000_000_000;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.isInstalled || !this.provider) {
      throw new Error('Phantom wallet not installed');
    }

    try {
      const signature = await this.provider.sendTransaction(transaction);
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Additional Phantom-specific methods
  async getTokenAccounts() {
    if (!this.isInstalled || !this.provider) return [];

    try {
      const response = await this.provider.request({
        method: 'getTokenAccountsByOwner',
        params: [
          this.provider.publicKey.toString(),
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
        ],
      });
      
      return response.value;
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      return [];
    }
  }

  async getNFTs() {
    if (!this.isInstalled) return [];

    try {
      // This would typically involve calling a metadata API
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }
}

// Wallet Manager Class
export class WalletManager {
  private providers: Map<string, WalletProvider> = new Map();
  private currentProvider: WalletProvider | null = null;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize providers during SSR
    // They will be initialized lazily on first access
  }

  private initializeProviders() {
    // Only initialize on client-side
    if (typeof window === 'undefined' || this.initialized) {
      return;
    }

    // Initialize Phantom provider
    const phantomProvider = new PhantomProvider();
    if (phantomProvider.isInstalled) {
      this.providers.set('phantom', phantomProvider);
    }

    this.initialized = true;
  }

  getAvailableProviders(): string[] {
    // Lazy initialize providers on first access (client-side only)
    this.initializeProviders();
    return Array.from(this.providers.keys());
  }

  getProvider(name: string): WalletProvider | null {
    return this.providers.get(name) || null;
  }

  async connectProvider(name: string) {
    const provider = this.getProvider(name);
    if (!provider) {
      throw new Error(`Provider ${name} not available`);
    }

    const result = await provider.connect();
    this.currentProvider = provider;
    return result;
  }

  async disconnectProvider() {
    if (this.currentProvider) {
      await this.currentProvider.disconnect();
      this.currentProvider = null;
    }
  }

  getCurrentProvider(): WalletProvider | null {
    return this.currentProvider;
  }

  isConnected(): boolean {
    return this.currentProvider !== null;
  }
}

// Crypto Utilities
export class CryptoUtils {
  // Convert lamports to SOL
  static lamportsToSol(lamports: number): number {
    return lamports / 1_000_000_000;
  }

  // Convert SOL to lamports
  static solToLamports(sol: number): number {
    return Math.floor(sol * 1_000_000_000);
  }

  // Format address for display
  static formatAddress(address: string, startChars: number = 4, endChars: number = 4): string {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  // Validate Solana address
  static isValidSolanaAddress(address: string): boolean {
    try {
      // Basic validation - Solana addresses are base58 encoded and 32-44 characters
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return base58Regex.test(address);
    } catch {
      return false;
    }
  }

  // Calculate transaction fees (estimate)
  static calculateTransactionFee(transactionSize: number = 1000): number {
    // Rough estimate: 5000 lamports per signature + 0.000005 SOL per byte
    const signatureFee = 5000;
    const byteFee = transactionSize * 0.000005 * 1_000_000_000; // Convert to lamports
    return signatureFee + byteFee;
  }
}

// Token Utilities
export class TokenUtils {
  // Get token metadata (placeholder for future implementation)
  static async getTokenMetadata(mint: string): Promise<TokenInfo | null> {
    try {
      // This would typically call a metadata API like Metaplex
      // For now, return null as placeholder
      return null;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  // Get token balance for a specific mint
  static async getTokenBalance(address: string, mint: string): Promise<number> {
    try {
      // This would typically involve calling the Solana RPC
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  // Get all tokens for an address
  static async getAllTokens(address: string): Promise<TokenInfo[]> {
    try {
      // This would typically involve calling getTokenAccountsByOwner
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }
  }
}

// NFT Utilities
export class NFTUtils {
  // Get NFT metadata (placeholder for future implementation)
  static async getNFTMetadata(mint: string): Promise<NFTInfo | null> {
    try {
      // This would typically call Metaplex or other NFT metadata APIs
      // For now, return null as placeholder
      return null;
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  // Get all NFTs for an address
  static async getAllNFTs(address: string): Promise<NFTInfo[]> {
    try {
      // This would typically involve calling getProgramAccounts or using Helius/QuickNode
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  // Transfer NFT
  static async transferNFT(from: string, to: string, mint: string): Promise<string> {
    try {
      // This would create and send a transfer instruction
      // For now, throw error as placeholder
      throw new Error('NFT transfer not implemented yet');
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw error;
    }
  }
}

// Transaction Utilities
export class TransactionUtils {
  // Create a simple SOL transfer transaction
  static async createTransferTransaction(
    from: string,
    to: string,
    amount: number
  ): Promise<any> {
    try {
      // This would create a SystemProgram.transfer instruction
      // For now, return null as placeholder
      return null;
    } catch (error) {
      console.error('Error creating transfer transaction:', error);
      throw error;
    }
  }

  // Sign and send transaction
  static async signAndSendTransaction(
    transaction: any,
    provider: WalletProvider
  ): Promise<string> {
    try {
      return await provider.sendTransaction(transaction);
    } catch (error) {
      console.error('Error signing and sending transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance (lazy initialization prevents SSR issues)
export const walletManager = new WalletManager();
export const cryptoUtils = CryptoUtils;
export const tokenUtils = TokenUtils;
export const nftUtils = NFTUtils;
export const transactionUtils = TransactionUtils;
