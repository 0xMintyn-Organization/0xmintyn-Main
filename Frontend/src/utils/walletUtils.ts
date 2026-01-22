"use client";
/*
  Wallet utilities stub
  ---------------------
  Phantom/browser-wallet support removed. Provide minimal, dependency-free
  interfaces and no-op implementations so imports remain valid.
*/

export interface WalletProvider {
  name: string;
  isInstalled: boolean;
  connect: () => Promise<any>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<any>;
  getBalance: (address: string) => Promise<number>;
  sendTransaction: (transaction: any) => Promise<string>;
}

export class WalletManager {
  getAvailableProviders(): string[] {
    return [];
  }
  getProvider(_name: string): WalletProvider | null {
    return null;
  }
  async connectProvider(_name: string) {
    throw new Error("Wallet provider functionality removed");
  }
  async disconnectProvider() {}
  getCurrentProvider(): WalletProvider | null { return null; }
  isConnected(): boolean { return false; }
}

export const walletManager = new WalletManager();

export class CryptoUtils {
  static lamportsToSol(_lamports: number): number { return 0; }
  static solToLamports(_sol: number): number { return 0; }
  static formatAddress(address: string, startChars = 4, endChars = 4): string {
    if (!address) return "";
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }
  static isValidSolanaAddress(_address: string): boolean { return false; }
  static calculateTransactionFee(_transactionSize = 1000): number { return 0; }
}

export const cryptoUtils = CryptoUtils;
