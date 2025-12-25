'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownUp, Wallet, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSwapPrice } from '@/hooks/useSwapPrice';
import { useBitgetBalance } from '@/hooks/useBitgetBalance';
import { usePhantomBalances } from '@/hooks/usePhantomBalances';
import { p2pAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';

// Available tokens for swapping
// Note: OXM is in developer mode and may not be available on Bitget
const availableTokens = [
  { value: 'OXM', label: 'OXM', note: 'Developer Mode' },
  { value: 'USDT', label: 'USDT' },
  { value: 'USD', label: 'USD' },
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
  { value: 'SOL', label: 'SOL' },
  { value: 'BNB', label: 'BNB' },
];

export default function QuickSwap() {
  const { isConnected, address } = useWallet();
  const [fromToken, setFromToken] = useState('OXM');
  const [toToken, setToToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [swapMessage, setSwapMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Debug: Log modal state changes
  useEffect(() => {
    if (showSuccessModal) {
      console.log('✅ Success modal is now OPEN');
    }
  }, [showSuccessModal]);
  
  const [swapResult, setSwapResult] = useState<{
    orderId?: string;
    clientOid?: string;
    fromAmount: number;
    toAmount: number;
    fromToken: string;
    toToken: string;
    rate: number;
  } | null>(null);

  // Fetch real-time conversion rate from Bitget
  const { rate, loading: priceLoading, error: priceError } = useSwapPrice(fromToken, toToken);
  
  // Fetch Bitget account balances (if user has Bitget account)
  const { balances: bitgetBalances, loading: balanceLoading, error: balanceError } = useBitgetBalance();
  
  // Fetch Phantom wallet balances (Solana tokens)
  const { 
    balances: phantomBalances, 
    solBalance, 
    loading: phantomLoading, 
    error: phantomError,
    getTokenBalance 
  } = usePhantomBalances(address);

  // Calculate converted amount
  const convertedAmount = useMemo(() => {
    if (!amount || !rate) return '0.00';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0.00';
    return (numAmount * rate).toFixed(6);
  }, [amount, rate]);

  // Get available balance for fromToken
  // Priority: Phantom wallet (for Solana tokens like OXM) > Bitget (for exchange tokens)
  const availableBalance = useMemo(() => {
    // Check if token is in Phantom wallet (Solana tokens)
    if (isConnected && address) {
      // For SOL
      if (fromToken === 'SOL') {
        return solBalance;
      }
      
      // For other tokens, try to find in Phantom balances
      const phantomToken = phantomBalances.find(b => 
        b.symbol.toUpperCase() === fromToken.toUpperCase()
      );
      if (phantomToken) {
        return phantomToken.uiAmount;
      }
    }
    
    // Fallback to Bitget balances
    if (bitgetBalances.length > 0) {
      const bitgetToken = bitgetBalances.find(b => 
        b.coin.toUpperCase() === fromToken.toUpperCase()
      );
      if (bitgetToken) {
        return parseFloat(bitgetToken.available);
      }
    }
    
    return 0;
  }, [phantomBalances, solBalance, bitgetBalances, fromToken, isConnected, address]);
  
  // Check if token is from Phantom wallet
  const isPhantomToken = useMemo(() => {
    if (!isConnected || !address) return false;
    if (fromToken === 'SOL') return true;
    return phantomBalances.some(b => b.symbol.toUpperCase() === fromToken.toUpperCase());
  }, [fromToken, phantomBalances, isConnected, address]);

  // Check if OXM is involved (developer mode warning)
  const isOXMInvolved = fromToken === 'OXM' || toToken === 'OXM';

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount(''); // Reset amount when swapping tokens
  };

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!rate) {
      toast.error('Unable to get conversion rate. Please try again.');
      return;
    }

    // Check if user has sufficient balance
    if (availableBalance < parseFloat(amount)) {
      const source = isPhantomToken ? 'Phantom wallet' : 'Bitget account';
      toast.error(`Insufficient balance in ${source}. Available: ${availableBalance.toFixed(4)} ${fromToken}. Required: ${parseFloat(amount).toFixed(4)} ${fromToken}`);
      return;
    }
    
    // For Phantom wallet tokens (especially OXM), we need to use Solana DEX
    // For now, show a message that on-chain swaps are coming soon
    if (isPhantomToken && fromToken !== 'SOL') {
      toast.info('On-chain token swaps from Phantom wallet are coming soon. For now, please use Bitget for swaps.');
      // TODO: Implement Jupiter DEX integration for Solana token swaps
      return;
    }

    // Warn about OXM in developer mode
    if (isOXMInvolved) {
      const proceed = window.confirm(
        'OXM token is in developer mode and may not be available on Bitget. ' +
        'This swap might fail. Do you want to continue?'
      );
      if (!proceed) return;
    }

    setIsSwapping(true);
    setSwapStatus('idle');
    setSwapMessage('');

    // Declare expectedToAmount in outer scope
    let expectedToAmount: number | undefined;

    try {
      console.log('📤 Getting swap quote first...', {
        fromToken,
        toToken,
        amount: parseFloat(amount),
      });

      // Step 1: Get swap quote to get optimal market and expected output
      const quoteRes = await p2pAPI.getSwapQuote({
        fromToken,
        toToken,
        amount: parseFloat(amount),
        fromChain: 'sol', // Default to Solana, can be made dynamic
        toChain: 'sol',
        fromAddress: address || undefined,
        estimateGas: true,
      });

      console.log('📥 Swap quote received:', quoteRes);

      if (!quoteRes.success || !quoteRes.quote) {
        throw new Error(quoteRes.message || 'Failed to get swap quote');
      }

      const { quote } = quoteRes;
      const market = quote.market;
      expectedToAmount = parseFloat(quote.toAmount);

      console.log('📤 Placing swap order with calldata...', {
        fromToken,
        toToken,
        amount: parseFloat(amount),
        market,
        expectedToAmount,
      });

      // Step 2: Get swap calldata
      if (!address) {
        throw new Error('Wallet address is required for on-chain swap');
      }

      const res = await p2pAPI.placeSwapOrder({
        fromToken,
        toToken,
        amount: parseFloat(amount),
        fromChain: 'sol',
        toChain: 'sol',
        fromAddress: address,
        toAddress: address, // Recipient is same as sender
        slippage: 1, // 1% slippage
        market,
        toMinAmount: expectedToAmount * 0.99, // 1% slippage tolerance
      });

      console.log('📥 Swap API response:', res);
      console.log('📥 Full response structure:', JSON.stringify(res, null, 2));

      // Check for success in multiple possible response formats
      // IMPORTANT: Swap order should have 'order' field, not 'rate' field
      // If response has 'rate', it might be the wrong endpoint
      const isSwapOrderResponse = res.order || res.data?.order;
      const isConversionRateResponse = res.rate && res.fromToken && res.toToken;
      
      if (isConversionRateResponse && !isSwapOrderResponse) {
        console.error('❌ ERROR: Received conversion rate response instead of swap order response!');
        console.error('This means the wrong API endpoint was called.');
        throw new Error('Received conversion rate response instead of swap order. Please check API endpoint.');
      }

      const isSuccess = res.success === true || 
                       res.data?.success === true || 
                       (res.status === 200 && !res.error) ||
                       (res.code === '00000' || res.code === '0'); // Bitget success codes

      console.log('🔍 Checking success:', { 
        isSuccess, 
        resSuccess: res.success,
        hasOrder: !!res.order,
        hasRate: !!res.rate,
        isSwapOrderResponse,
        isConversionRateResponse,
        response: res 
      });

      if (isSuccess) {
        // Extract order ID and calldata from Bitget Wallet Swap API response
        const orderId = 
          res.order?.id || 
          res.order?.orderId || 
          res.data?.id ||
          res.data?.orderId ||
          'N/A';
        
        const calldata = res.order?.calldata || res.data?.calldata;
        const contract = res.order?.contract || res.data?.contract;
        
        const fromAmount = parseFloat(amount);
        // Use expected amount from quote if available, otherwise calculate from rate
        const toAmount = typeof expectedToAmount !== 'undefined' ? expectedToAmount : (fromAmount * (rate || 0));
        
        console.log('✅ Swap successful!', { 
          orderId, 
          fromAmount, 
          toAmount, 
          rate,
          response: res 
        });
        
        // Store swap result for modal
        setSwapResult({
          orderId: orderId !== 'N/A' ? orderId : undefined,
          clientOid: res.order?.clientOid || 
                     res.order?.data?.clientOid ||
                     res.data?.order?.clientOid ||
                     res.data?.clientOid,
          fromAmount,
          toAmount,
          fromToken,
          toToken,
          rate: rate || 0,
        });
        
        setSwapStatus('success');
        setSwapMessage(`Swap order placed successfully! Order ID: ${orderId}`);
        
        // IMPORTANT: Show success toast notification FIRST
        console.log('🎉 Showing success toast and modal');
        try {
          toast.success('Swap Successful!', {
            description: `You swapped ${fromAmount.toFixed(4)} ${fromToken} for ${toAmount.toFixed(4)} ${toToken}`,
            duration: 5000,
          });
          console.log('✅ Toast notification shown');
        } catch (toastError) {
          console.error('❌ Error showing toast:', toastError);
        }
        
        // IMPORTANT: Show success modal - use setTimeout to ensure state update
        console.log('🔄 Setting modal state to true...');
        setTimeout(() => {
          setShowSuccessModal(true);
          console.log('✅ Modal state set to true');
        }, 100);
        
        // Reset form after successful swap (but keep modal open)
        setTimeout(() => {
          setAmount('');
        }, 100);
      } else {
        const errorMsg = res.message || 
                        res.data?.message || 
                        res.msg ||
                        'Failed to place swap order';
        console.error('❌ Swap failed:', errorMsg, res);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Swap error:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.msg ||
        error.message || 
        'Failed to execute swap. Please try again.';
      
      setSwapStatus('error');
      setSwapMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSwapping(false);
    }
  };

  // Format rate display
  const rateDisplay = useMemo(() => {
    if (priceLoading) return 'Loading...';
    if (priceError) return 'Error';
    if (!rate) return 'N/A';
    if (rate < 0.0001) return rate.toExponential(2);
    if (rate < 1) return rate.toFixed(6);
    return rate.toFixed(4);
  }, [rate, priceLoading, priceError]);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <div className="space-y-4">
          {/* Wallet Connection Status */}
          {isConnected && address && (
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                Phantom wallet connected: {address.slice(0, 6)}...{address.slice(-4)}
              </AlertDescription>
            </Alert>
          )}

          {/* OXM Developer Mode Warning */}
          {isOXMInvolved && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                OXM token is in developer mode. It may not be available on Bitget. 
                Consider using P2P trading for OXM swaps.
              </AlertDescription>
            </Alert>
          )}

          {/* Swap Status Messages */}
          {swapStatus === 'success' && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                {swapMessage}
              </AlertDescription>
            </Alert>
          )}

          {swapStatus === 'error' && (
            <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-sm text-red-800 dark:text-red-200">
                {swapMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* From Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                From
              </label>
              {availableBalance > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Available: {availableBalance.toFixed(4)} {fromToken}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setAmount(value);
                  }
                }}
                className="flex-1 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
                disabled={isSwapping}
              />
              <Select value={fromToken} onValueChange={setFromToken} disabled={isSwapping}>
                <SelectTrigger className="w-32 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.value} value={token.value}>
                      <div className="flex items-center gap-2">
                        <span>{token.label}</span>
                        {token.note && (
                          <Badge variant="outline" className="text-[10px]">
                            {token.note}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapTokens}
              disabled={isSwapping}
              className="rounded-full border-2 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-110 transition-transform duration-200 shadow-md disabled:opacity-50"
            >
              <ArrowDownUp className="w-4 h-4 text-purple-600" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={convertedAmount}
                readOnly
                className="flex-1 bg-gray-100 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600"
              />
              <Select value={toToken} onValueChange={setToToken} disabled={isSwapping}>
                <SelectTrigger className="w-32 bg-white dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.value} value={token.value}>
                      <div className="flex items-center gap-2">
                        <span>{token.label}</span>
                        {token.note && (
                          <Badge variant="outline" className="text-[10px]">
                            {token.note}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              1 {fromToken} = {rateDisplay} {toToken}
            </span>
            {priceLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            )}
            {priceError && (
              <span className="text-red-500 text-xs">Price unavailable</span>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Swaps are executed on Bitget exchange. 
              You need to have funds deposited on Bitget to use this feature. 
              {isOXMInvolved && ' OXM in developer mode may not be available.'}
            </p>
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !amount || !rate || parseFloat(amount) <= 0 || priceLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwapping ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Swap Now
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Swap Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your swap order has been placed successfully on Bitget
            </DialogDescription>
          </DialogHeader>

          {swapResult && (
            <div className="space-y-4 py-4">
              {/* Swap Details */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">You Swapped</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {swapResult.fromAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}{' '}
                    {swapResult.fromToken}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowDownUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">You Received</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {swapResult.toAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}{' '}
                    {swapResult.toToken}
                  </span>
                </div>
              </div>

              {/* Rate Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  1 {swapResult.fromToken} = {swapResult.rate.toLocaleString(undefined, {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 8,
                  })}{' '}
                  {swapResult.toToken}
                </span>
              </div>

              {/* Order ID */}
              {swapResult.orderId && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                      {swapResult.orderId.length > 12
                        ? `${swapResult.orderId.slice(0, 8)}...${swapResult.orderId.slice(-4)}`
                        : swapResult.orderId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(swapResult.orderId || '');
                        toast.success('Order ID copied to clipboard');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                setSwapStatus('idle');
                setSwapMessage('');
                setSwapResult(null);
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setSwapStatus('idle');
                setSwapMessage('');
                setSwapResult(null);
                // Optionally refresh balances
                window.location.reload();
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
