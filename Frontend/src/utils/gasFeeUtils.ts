/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, PublicKey } from "@solana/web3.js";

// Network configuration - matches the pattern used throughout the app
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export interface GasFeeInfo {
  fast: number;        // High priority fee (microlamports per compute unit)
  balanced: number;    // Medium priority fee
  economic: number;   // Low priority fee
  baseFee: number;    // Base transaction fee (lamports)
  lastUpdated: Date;
}

export interface FeeEstimate {
  strategy: 'fast' | 'balanced' | 'economic';
  computeUnits: number;
  prioritizationFee: number;  // microlamports
  totalFee: number;           // lamports
  totalFeeSOL: number;        // SOL
}

/**
 * Get recent prioritization fees from Solana network
 */
export async function getRecentPrioritizationFees(): Promise<number[]> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Get recent prioritization fees (returns array of fees in microlamports per compute unit)
    // Note: This method may not be available on all RPC endpoints or devnet
    const fees = await connection.getRecentPrioritizationFees();
    
    if (!fees || fees.length === 0) {
      // Fallback to default if no fees available
      // Devnet typically has lower/no prioritization fees
      const defaultFees = NETWORK === "devnet" ? [100, 50, 10] : [1000, 500, 100];
      return defaultFees; // Fast, Balanced, Economic (microlamports)
    }
    
    // Extract prioritization fees and sort
    const prioritizationFees = fees
      .map(fee => fee.prioritizationFee)
      .filter(fee => fee > 0)
      .sort((a, b) => b - a); // Sort descending
    
    // If we got fees but array is too small, pad with defaults
    if (prioritizationFees.length < 3) {
      const defaultFees = NETWORK === "devnet" ? [100, 50, 10] : [1000, 500, 100];
      return [...prioritizationFees, ...defaultFees].slice(0, 10);
    }
    
    return prioritizationFees;
  } catch (error: any) {
    console.error("Error fetching prioritization fees:", error);
    // Return default fees on error
    // Devnet typically has lower fees
    const defaultFees = NETWORK === "devnet" ? [100, 50, 10] : [1000, 500, 100];
    return defaultFees;
  }
}

/**
 * Calculate gas fee estimates based on strategy
 */
export async function calculateGasFeeEstimate(
  strategy: 'fast' | 'balanced' | 'economic',
  computeUnits: number = 200000 // Default compute units for a typical transaction
): Promise<FeeEstimate> {
  try {
    const fees = await getRecentPrioritizationFees();
    
    // Base transaction fee (5000 lamports per signature)
    const baseFee = 5000;
    
    // Get fee percentiles
    const fastFee = fees[0] || 1000;           // Highest fee (90th percentile)
    const balancedFee = fees[Math.floor(fees.length * 0.5)] || 500;  // Median
    const economicFee = fees[fees.length - 1] || 100;  // Lowest fee (10th percentile)
    
    // Select fee based on strategy
    let prioritizationFee: number;
    switch (strategy) {
      case 'fast':
        prioritizationFee = fastFee;
        break;
      case 'balanced':
        prioritizationFee = balancedFee;
        break;
      case 'economic':
        prioritizationFee = economicFee;
        break;
      default:
        prioritizationFee = balancedFee;
    }
    
    // Calculate total prioritization fee
    // Prioritization fee is in microlamports per compute unit
    // Total = (microlamports per CU) * compute units / 1,000,000
    const prioritizationFeeTotal = (prioritizationFee * computeUnits) / 1_000_000;
    
    // Total fee = base fee + prioritization fee
    const totalFee = baseFee + prioritizationFeeTotal;
    
    // Convert to SOL (1 SOL = 1,000,000,000 lamports)
    const totalFeeSOL = totalFee / 1_000_000_000;
    
    return {
      strategy,
      computeUnits,
      prioritizationFee,
      totalFee: Math.ceil(totalFee),
      totalFeeSOL: parseFloat(totalFeeSOL.toFixed(9)),
    };
  } catch (error) {
    console.error("Error calculating gas fee estimate:", error);
    // Return default estimate on error
    return {
      strategy,
      computeUnits: 200000,
      prioritizationFee: 500,
      totalFee: 5000,
      totalFeeSOL: 0.000005,
    };
  }
}

/**
 * Get current network gas fee information
 */
export async function getGasFeeInfo(): Promise<GasFeeInfo> {
  try {
    const fees = await getRecentPrioritizationFees();
    
    const baseFee = 5000; // Base transaction fee in lamports
    const fastFee = fees[0] || 1000;
    const balancedFee = fees[Math.floor(fees.length * 0.5)] || 500;
    const economicFee = fees[fees.length - 1] || 100;
    
    return {
      fast: fastFee,
      balanced: balancedFee,
      economic: economicFee,
      baseFee,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error getting gas fee info:", error);
    // Return defaults based on network
    const defaults = NETWORK === "devnet" 
      ? { fast: 100, balanced: 50, economic: 10 }
      : { fast: 1000, balanced: 500, economic: 100 };
    
    return {
      ...defaults,
      baseFee: 5000,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Format fee for display
 */
export function formatFee(feeSOL: number): string {
  if (feeSOL < 0.000001) {
    return `${(feeSOL * 1_000_000_000).toFixed(0)} lamports`;
  } else if (feeSOL < 0.001) {
    return `${(feeSOL * 1_000_000).toFixed(2)} µSOL`;
  } else {
    return `${feeSOL.toFixed(6)} SOL`;
  }
}

/**
 * Get fee description based on strategy
 */
export function getFeeStrategyDescription(strategy: 'fast' | 'balanced' | 'economic'): string {
  switch (strategy) {
    case 'fast':
      return 'Highest priority - fastest confirmation';
    case 'balanced':
      return 'Good balance of speed and cost';
    case 'economic':
      return 'Lowest cost - may take longer';
    default:
      return '';
  }
}

