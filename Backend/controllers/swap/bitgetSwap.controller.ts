import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorHandler';
import bitget from '../../services/bitgetClient.service';
import bitgetWalletSwap from '../../services/bitgetWalletSwap.service';
import { logger } from '../../utils/logger';

// Get Bitget account balance
export const getBitgetAccount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use spot account endpoint instead of mix/futures account
      const account = await bitget.getSpotAccount();
      
      logger.info('Bitget spot account fetched successfully');
      
      res.status(200).json({
        success: true,
        account,
      });
    } catch (error: any) {
      logger.error('Error fetching Bitget account:', error);
      
      // Provide more helpful error message
      if (error.response?.data?.msg) {
        return next(new ErrorHandler(
          `Bitget API Error: ${error.response.data.msg}. Please ensure your API key has spot trading permissions.`,
          error.response.status || 500
        ));
      }
      
      return next(new ErrorHandler(error.message || 'Failed to fetch Bitget account', 500));
    }
  }
);

// Get available trading pairs from Bitget
export const getTradingPairs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { baseCoin, quoteCoin } = req.query;
      
      // Use Bitget public API to get symbols
      const axios = require('axios');
      const response = await axios.get('https://api.bitget.com/api/v2/spot/public/symbols', {
        params: {
          ...(baseCoin && { baseCoin }),
          ...(quoteCoin && { quoteCoin }),
        },
      });
      
      const symbols = response.data?.data || [];
      
      logger.info(`Found ${symbols.length} trading pairs from Bitget`);
      
      res.status(200).json({
        success: true,
        pairs: symbols.map((s: any) => ({
          symbol: s.symbol,
          baseCoin: s.baseCoin,
          quoteCoin: s.quoteCoin,
          minTradeAmount: s.minTradeAmount,
          maxTradeAmount: s.maxTradeAmount,
          pricePrecision: s.pricePrecision,
          quantityPrecision: s.quantityPrecision,
          status: s.status,
        })),
      });
    } catch (error: any) {
      logger.error('Error fetching trading pairs:', error);
      return next(new ErrorHandler(error.message || 'Failed to fetch trading pairs', 500));
    }
  }
);

// Get ticker price for a symbol (for conversion rate calculation)
export const getTickerPrice = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return next(new ErrorHandler('Symbol is required', 400));
      }
      
      const axios = require('axios');
      const response = await axios.get('https://api.bitget.com/api/v2/spot/market/tickers', {
        params: { symbol },
      });
      
      const ticker = response.data?.data?.[0];
      
      if (!ticker) {
        return next(new ErrorHandler('Ticker not found for symbol', 404));
      }
      
      res.status(200).json({
        success: true,
        ticker: {
          symbol: ticker.symbol,
          lastPrice: ticker.lastPr || ticker.last,
          bidPrice: ticker.bidPx,
          askPrice: ticker.askPx,
          high24h: ticker.high24h,
          low24h: ticker.low24h,
          volume24h: ticker.vol24h,
          change24h: ticker.change24h,
          timestamp: ticker.ts,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching ticker price:', error);
      return next(new ErrorHandler(error.message || 'Failed to fetch ticker price', 500));
    }
  }
);

// Get conversion rate between two tokens
export const getConversionRate = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromToken, toToken } = req.query;
      
      if (!fromToken || !toToken) {
        return next(new ErrorHandler('fromToken and toToken are required', 400));
      }
      
      // Handle OXM in developer mode - might not be on Bitget
      if (fromToken === 'OXM' || toToken === 'OXM') {
        // For OXM, we'll need to use a fallback or custom rate
        // Since it's in developer mode, it might not be on Bitget yet
        logger.warn('OXM token detected - using fallback rate (developer mode)');
        
        // Return a fallback rate or error
        return res.status(200).json({
          success: true,
          rate: null,
          message: 'OXM token is in developer mode and may not be available on Bitget',
          fallbackRate: 1.05, // Temporary fallback
          fromToken,
          toToken,
        });
      }
      
      // Build symbol pair (e.g., ETHUSDT, BTCUSDT)
      // If both tokens are not USDT, we need to convert through USDT
      const axios = require('axios');
      
      let rate: number;
      
      // Direct pair exists (e.g., ETHUSDT)
      if (toToken === 'USDT' || toToken === 'USD') {
        const symbol = `${fromToken}USDT`;
        logger.info(`Fetching ticker for direct pair: ${symbol}`);
        
        try {
          const response = await axios.get('https://api.bitget.com/api/v2/spot/market/tickers', {
            params: { symbol },
          });
          
          logger.info(`Bitget API response for ${symbol}:`, {
            status: response.status,
            hasData: !!response.data?.data,
            dataLength: response.data?.data?.length,
          });
          
          const ticker = response.data?.data?.[0];
          // Bitget API returns price as 'lastPr', not 'last'
          const priceValue = ticker?.lastPr || ticker?.last;
          if (ticker && priceValue) {
            const price = parseFloat(priceValue);
            if (isNaN(price) || price <= 0) {
              logger.error(`Invalid price from ticker: ${priceValue}`);
              return next(new ErrorHandler(`Invalid price data for ${symbol}`, 400));
            }
            rate = price;
            logger.info(`Rate calculated: 1 ${fromToken} = ${rate} ${toToken}`);
          } else {
            logger.error(`Ticker not found or missing price for ${symbol}`, {
              ticker,
              hasLastPr: !!ticker?.lastPr,
              hasLast: !!ticker?.last,
              responseData: response.data,
            });
            return next(new ErrorHandler(`Trading pair ${symbol} not found or price unavailable`, 404));
          }
        } catch (apiError: any) {
          logger.error(`Error fetching ticker for ${symbol}:`, {
            message: apiError.message,
            response: apiError.response?.data,
            status: apiError.response?.status,
          });
          return next(new ErrorHandler(
            `Failed to fetch price for ${symbol}: ${apiError.response?.data?.msg || apiError.message}`,
            apiError.response?.status || 500
          ));
        }
      } 
      // Reverse pair (e.g., USD → ETH means we need ETHUSDT price, then invert)
      else if (fromToken === 'USDT' || fromToken === 'USD') {
        const symbol = `${toToken}USDT`;
        logger.info(`Fetching ticker for reverse pair: ${symbol}`);
        
        try {
          const response = await axios.get('https://api.bitget.com/api/v2/spot/market/tickers', {
            params: { symbol },
          });
          
          logger.info(`Bitget API response for ${symbol}:`, {
            status: response.status,
            hasData: !!response.data?.data,
            dataLength: response.data?.data?.length,
            firstTicker: response.data?.data?.[0],
          });
          
          const ticker = response.data?.data?.[0];
          // Bitget API returns price as 'lastPr', not 'last'
          const priceValue = ticker?.lastPr || ticker?.last;
          if (ticker && priceValue) {
            const ethPrice = parseFloat(priceValue);
            if (isNaN(ethPrice) || ethPrice <= 0) {
              logger.error(`Invalid ETH price from ticker: ${priceValue}`);
              return next(new ErrorHandler(`Invalid price data for ${symbol}`, 400));
            }
            rate = 1 / ethPrice; // Inverse rate: 1 USD = 1/ETHUSDT ETH
            logger.info(`Calculated rate: 1 ${fromToken} = ${rate} ${toToken} (ETHUSDT price: ${ethPrice})`);
          } else {
            logger.error(`Ticker not found or missing price for ${symbol}`, {
              ticker,
              hasLastPr: !!ticker?.lastPr,
              hasLast: !!ticker?.last,
              responseData: response.data,
            });
            return next(new ErrorHandler(`Trading pair ${symbol} not found or price unavailable`, 404));
          }
        } catch (apiError: any) {
          logger.error(`Error fetching ticker for ${symbol}:`, {
            message: apiError.message,
            response: apiError.response?.data,
            status: apiError.response?.status,
          });
          return next(new ErrorHandler(
            `Failed to fetch price for ${symbol}: ${apiError.response?.data?.msg || apiError.message}`,
            apiError.response?.status || 500
          ));
        }
      }
      // Cross pair (e.g., ETHBTC) - convert through USDT
      else {
        const fromSymbol = `${fromToken}USDT`;
        const toSymbol = `${toToken}USDT`;
        
        const [fromResponse, toResponse] = await Promise.all([
          axios.get('https://api.bitget.com/api/v2/spot/market/tickers', {
            params: { symbol: fromSymbol },
          }),
          axios.get('https://api.bitget.com/api/v2/spot/market/tickers', {
            params: { symbol: toSymbol },
          }),
        ]);
        
        const fromTicker = fromResponse.data?.data?.[0];
        const toTicker = toResponse.data?.data?.[0];
        
        if (!fromTicker || !toTicker) {
          return next(new ErrorHandler('One or both trading pairs not found', 404));
        }
        
        // Bitget API returns price as 'lastPr', not 'last'
        const fromPriceValue = fromTicker.lastPr || fromTicker.last;
        const toPriceValue = toTicker.lastPr || toTicker.last;
        
        if (!fromPriceValue || !toPriceValue) {
          return next(new ErrorHandler('Price data missing for one or both trading pairs', 404));
        }
        
        const fromPrice = parseFloat(fromPriceValue);
        const toPrice = parseFloat(toPriceValue);
        
        if (isNaN(fromPrice) || isNaN(toPrice) || fromPrice <= 0 || toPrice <= 0) {
          return next(new ErrorHandler('Invalid price data for trading pairs', 400));
        }
        
        rate = fromPrice / toPrice; // Calculate cross rate
        logger.info(`Cross rate calculated: 1 ${fromToken} = ${rate} ${toToken} (${fromSymbol}: ${fromPrice}, ${toSymbol}: ${toPrice})`);
      }
      
      if (!rate || isNaN(rate) || rate <= 0) {
        logger.error('Invalid rate calculated:', { rate, fromToken, toToken });
        return next(new ErrorHandler('Invalid conversion rate calculated', 500));
      }
      
      logger.info(`Conversion rate calculated successfully: 1 ${fromToken} = ${rate} ${toToken}`);
      
      res.status(200).json({
        success: true,
        rate,
        fromToken,
        toToken,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      const { fromToken: ft, toToken: tt } = req.query;
      logger.error('Error calculating conversion rate:', {
        error: error.message,
        stack: error.stack,
        fromToken: ft,
        toToken: tt,
        response: error.response?.data,
      });
      
      // Return more detailed error message
      const errorMessage = error.response?.data?.msg 
        || error.message 
        || 'Failed to calculate conversion rate';
      
      return next(new ErrorHandler(errorMessage, error.response?.status || 500));
    }
  }
);

// Get swap quote from Bitget Wallet Swap API
export const getSwapQuote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        fromToken, 
        toToken, 
        amount, 
        fromChain = 'sol', 
        toChain = 'sol',
        fromAddress,
        estimateGas = false 
      } = req.body;
      
      if (!fromToken || !toToken || !amount) {
        return next(new ErrorHandler('fromToken, toToken, and amount are required', 400));
      }
      
      // Map token symbols to contract addresses
      // For native tokens (SOL), use empty string
      const getContractAddress = (token: string, chain: string): string => {
        // Native token
        if (token === 'SOL' && chain === 'sol') return '';
        if (token === 'ETH' && chain === 'eth') return '';
        if (token === 'BNB' && chain === 'bsc') return '';
        
        // Common token addresses (add more as needed)
        const tokenMap: Record<string, Record<string, string>> = {
          sol: {
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            // Add OXM contract address when available
            // 'OXM': 'OXM_CONTRACT_ADDRESS',
          },
          eth: {
            'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          },
          bsc: {
            'USDT': '0x55d398326f99059fF775485246999027B3197955',
            'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          },
        };
        
        return tokenMap[chain]?.[token] || '';
      };
      
      const fromContract = getContractAddress(fromToken, fromChain);
      const toContract = getContractAddress(toToken, toChain);
      
      logger.info('Getting swap quote:', {
        fromToken,
        toToken,
        amount,
        fromChain,
        toChain,
        fromContract,
        toContract,
      });
      
      const quote = await bitgetWalletSwap.getSwapQuote({
        fromSymbol: fromToken,
        fromContract,
        fromAmount: amount.toString(),
        fromChain,
        toSymbol: toToken,
        toContract,
        toChain,
        fromAddress,
        estimateGas,
      });
      
      logger.info('Swap quote received:', quote);
      
      res.status(200).json({
        success: true,
        quote: quote.data,
        message: 'Swap quote retrieved successfully',
      });
    } catch (error: any) {
      logger.error('Error getting swap quote:', {
        error: error.message,
        response: error.response?.data,
      });
      
      return next(new ErrorHandler(
        error.message || 'Failed to get swap quote',
        error.response?.status || 500
      ));
    }
  }
);

// Place a swap order using Bitget Wallet Swap API (on-chain swap)
export const placeSwapOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        fromToken, 
        toToken, 
        amount, 
        fromChain = 'sol',
        toChain = 'sol',
        fromAddress,
        toAddress,
        slippage = 1, // 1% default slippage
        market,
        toMinAmount,
      } = req.body;
      
      if (!fromToken || !toToken || !amount || !fromAddress || !toAddress) {
        return next(new ErrorHandler(
          'fromToken, toToken, amount, fromAddress, and toAddress are required', 
          400
        ));
      }
      
      if (!market) {
        return next(new ErrorHandler(
          'market is required. Please get a quote first to obtain the optimal market.', 
          400
        ));
      }
      
      // Map token symbols to contract addresses
      const getContractAddress = (token: string, chain: string): string => {
        if (token === 'SOL' && chain === 'sol') return '';
        if (token === 'ETH' && chain === 'eth') return '';
        if (token === 'BNB' && chain === 'bsc') return '';
        
        const tokenMap: Record<string, Record<string, string>> = {
          sol: {
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
          eth: {
            'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          },
          bsc: {
            'USDT': '0x55d398326f99059fF775485246999027B3197955',
            'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          },
        };
        
        return tokenMap[chain]?.[token] || '';
      };
      
      const fromContract = getContractAddress(fromToken, fromChain);
      const toContract = getContractAddress(toToken, toChain);
      
      logger.info('Placing Bitget Wallet swap order:', {
        fromToken,
        toToken,
        amount,
        fromChain,
        toChain,
        fromAddress,
        toAddress,
        slippage,
        market,
      });
      
      const swapResult = await bitgetWalletSwap.getSwapCalldata({
        fromSymbol: fromToken,
        fromContract,
        fromAmount: amount.toString(),
        fromChain,
        toSymbol: toToken,
        toContract,
        toChain,
        fromAddress,
        toAddress,
        slippage,
        market,
        toMinAmount: toMinAmount?.toString(),
        deadline: 600, // 10 minutes
      });
      
      logger.info('Bitget Wallet swap calldata received:', swapResult);
      
      res.status(200).json({
        success: true,
        order: swapResult.data,
        message: 'Swap calldata generated successfully. Sign and submit the transaction to complete the swap.',
      });
    } catch (error: any) {
      logger.error('Error placing swap order:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to place swap order';
      
      return next(new ErrorHandler(
        errorMessage,
        error.response?.status || 500
      ));
    }
  }
);

// Get order status
export const getOrderStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId, clientOid } = req.query;
      
      if (!orderId && !clientOid) {
        return next(new ErrorHandler('orderId or clientOid is required', 400));
      }
      
      const axios = require('axios');
      const path = '/api/v2/spot/trade/orderInfo';
      const params: any = {};
      if (orderId) params.orderId = orderId;
      if (clientOid) params.clientOid = clientOid;
      
      // This requires private API access
      // For now, we'll use a placeholder
      // You'll need to add this to bitgetClient.service.ts
      
      res.status(200).json({
        success: true,
        message: 'Order status endpoint - to be implemented in bitgetClient.service.ts',
      });
    } catch (error: any) {
      logger.error('Error fetching order status:', error);
      return next(new ErrorHandler(error.message || 'Failed to fetch order status', 500));
    }
  }
);

