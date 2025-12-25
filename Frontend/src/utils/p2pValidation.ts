/**
 * P2P Trade Validation Utilities
 * Centralized validation logic for buy/sell operations
 */

import { P2POffer, UserBalance } from '@/components/Exchange/P2PTrade';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  maxAffordable?: number;
  maxTradeable?: number;
}

export interface TradeValidationParams {
  amount: number;
  offer: P2POffer;
  userBalance: UserBalance;
  side: 'buy' | 'sell';
  paymentMethod?: string;
}

/**
 * Calculate available balance for a trade side
 */
export function getAvailableBalance(
  side: 'buy' | 'sell',
  asset: string,
  userBalance: UserBalance
): number {
  if (side === 'buy') {
    return (userBalance.USD ?? 0) + (userBalance.USDT ?? 0);
  }
  return userBalance[asset] ?? 0;
}

/**
 * Calculate maximum tradeable amount considering all constraints
 */
export function calculateMaxTradeable(
  side: 'buy' | 'sell',
  offer: P2POffer,
  availableBalance: number
): number {
  if (side === 'buy') {
    // For buy: limited by offer availability, max limit, and user's fiat balance
    const maxByBalance = availableBalance / offer.price;
    return Math.min(offer.available, offer.maxLimit, maxByBalance);
  } else {
    // For sell: limited by offer max limit, offer availability, and user's asset balance
    return Math.min(offer.available, offer.maxLimit, availableBalance);
  }
}

/**
 * Round to specified decimal places
 */
function roundToDecimals(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

/**
 * Validate trade amount with comprehensive checks
 */
export function validateTradeAmount(params: TradeValidationParams): ValidationResult {
  const { amount, offer, userBalance, side, paymentMethod } = params;
  const assetLabel = offer.asset;

  // 1. Basic amount validation
  if (!amount || amount <= 0 || isNaN(amount)) {
    return {
      isValid: false,
      error: 'Please enter a valid amount',
    };
  }

  // 2. Minimum limit check
  if (amount < offer.minLimit) {
    return {
      isValid: false,
      error: `Minimum amount is ${offer.minLimit} ${assetLabel}`,
    };
  }

  // 3. Maximum limit check
  if (amount > offer.maxLimit) {
    return {
      isValid: false,
      error: `Maximum amount is ${offer.maxLimit.toLocaleString()} ${assetLabel}`,
    };
  }

  // 4. Offer availability check
  if (amount > offer.available) {
    return {
      isValid: false,
      error: `Available amount is ${offer.available.toLocaleString()} ${assetLabel}`,
    };
  }

  // 5. Balance validation (different for buy vs sell)
  const availableBalance = getAvailableBalance(side, assetLabel, userBalance);
  const maxTradeable = calculateMaxTradeable(side, offer, availableBalance);

  if (side === 'buy') {
    const requiredFiat = amount * offer.price;
    if (requiredFiat > availableBalance) {
      const maxAffordable = roundToDecimals(availableBalance / offer.price, 2);
      return {
        isValid: false,
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}. Maximum you can buy: ${maxAffordable} ${assetLabel}`,
        maxAffordable,
        maxTradeable,
      };
    }
  } else {
    // Sell side
    if (amount > availableBalance) {
      return {
        isValid: false,
        error: `Insufficient ${assetLabel}. Available: ${availableBalance.toLocaleString()} ${assetLabel}`,
        maxTradeable,
      };
    }
  }

  // 6. Payment method validation (for buy side)
  // Skip payment method validation if explicitly set to 'skip' (for quick validation)
  if (side === 'buy' && paymentMethod !== 'skip' && !paymentMethod) {
    return {
      isValid: false,
      error: 'Please select a payment method',
    };
  }

  // All validations passed
  return {
    isValid: true,
    maxTradeable,
  };
}

/**
 * Quick validation for real-time feedback (without payment method check)
 */
export function validateAmountQuick(
  amount: number,
  offer: P2POffer,
  userBalance: UserBalance,
  side: 'buy' | 'sell'
): ValidationResult {
  return validateTradeAmount({
    amount,
    offer,
    userBalance,
    side,
    paymentMethod: 'skip', // Skip payment method validation for quick checks
  });
}

/**
 * Format validation error message for display
 */
export function formatValidationError(result: ValidationResult, assetLabel: string): string {
  if (result.isValid) return '';
  return result.error || 'Invalid trade amount';
}

