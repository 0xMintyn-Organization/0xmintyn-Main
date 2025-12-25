import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BITGET_BASE_URL = process.env.BITGET_BASE_URL || 'https://web3.bitget.com';
const PARTNER_CODE = process.env.BITGET_PARTNER_CODE || ''; // Partner code must be agreed upon in advance

// Create axios instance for Bitget Wallet Swap API
const swapClient = axios.create({
  baseURL: BITGET_BASE_URL,
  timeout: 30000, // 30 second timeout for swap operations
  headers: {
    'Content-Type': 'application/json',
    ...(PARTNER_CODE && { 'Partner-Code': PARTNER_CODE }),
  },
});

export interface SwapQuoteRequest {
  fromSymbol?: string;
  fromContract: string; // Contract address, empty string for native token
  fromAmount: string; // Quote amount
  fromChain: string; // Chain name (bsc, eth, sol, base, morph, monad)
  toSymbol?: string;
  toContract: string; // Contract address, empty string for native token
  toChain: string; // Target chain
  fromAddress?: string; // Debit address for gas estimation
  estimateGas?: boolean; // Whether to estimate gas
  market?: string; // Specify quote channel
}

export interface SwapQuoteResponse {
  status: number; // 0 indicates success
  data: {
    fromAmount: string;
    toAmount: string;
    fromSymbol: string;
    toSymbol: string;
    fromChain: string;
    toChain: string;
    market: string; // Optimal channel
    priceImpact: number;
    gasEstimate?: string;
    gasPrice?: string;
    fee: string;
    route: any; // Swap route information
  };
  message?: string;
}

export interface SwapRequest {
  fromSymbol?: string;
  fromContract: string;
  fromAmount: string;
  fromChain: string;
  toSymbol?: string;
  toContract: string;
  toChain: string;
  toMinAmount?: string; // Minimum amount to receive
  fromAddress: string; // Debit address
  toAddress: string; // Recipient address
  slippage?: number; // Slippage in percentage (e.g., 1 means 1%)
  market: string; // Optimal channel from quote API
  feeRate?: number; // Fee rate in per mille (‰)
  executorAddress?: string; // Executor contract address
  solMaxAccounts?: number; // Maximum number of accounts (SOL chain only)
  feePayer?: string; // Fee payer address (SOL chain)
  deadline?: number; // Transaction expiration time in seconds, default 600
  protocols?: string; // Protocol list
  requestMod?: string; // Request mode: "simple" or "rich"
}

export interface SwapResponse {
  status: number; // 0 indicates success
  data: {
    id: string; // Order ID
    market: string; // Channel name
    contract?: string; // Contract address (EVM chains)
    calldata: string; // Calldata for transaction
    deadline: number; // Order timeout (seconds)
    computeUnits?: number; // SOL chain tx compute unit consumption
  };
  message?: string;
}

/**
 * Get swap quote from Bitget Wallet Swap API
 */
export async function getSwapQuote(params: SwapQuoteRequest): Promise<SwapQuoteResponse> {
  try {
    const response = await swapClient.post('/bgw-pro/swapx/pro/quote', params);
    return response.data;
  } catch (error: any) {
    console.error('Error getting swap quote:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to get swap quote'
    );
  }
}

/**
 * Get swap calldata from Bitget Wallet Swap API
 */
export async function getSwapCalldata(params: SwapRequest): Promise<SwapResponse> {
  try {
    const response = await swapClient.post('/bgw-pro/swapx/pro/swap', params);
    return response.data;
  } catch (error: any) {
    console.error('Error getting swap calldata:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to get swap calldata'
    );
  }
}

/**
 * Send batch transactions (MEV Batch Send)
 */
export async function sendBatchTransactions(chain: string, txs: any[]): Promise<any> {
  try {
    const response = await swapClient.post('/bgw-pro/swapx/pro/send', {
      chain,
      txs,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending batch transactions:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to send batch transactions'
    );
  }
}

export default {
  getSwapQuote,
  getSwapCalldata,
  sendBatchTransactions,
};

