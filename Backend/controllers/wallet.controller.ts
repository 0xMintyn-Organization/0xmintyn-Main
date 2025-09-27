import { Request, Response, NextFunction } from 'express';
import { PublicKey } from '@solana/web3.js';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/errorHandler';
import { getWalletService } from '../services/walletService';
import { logger } from '../utils/logger';

// Get comprehensive wallet information
export const getWalletInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const walletInfo = await walletService.getCompleteWalletInfo(pubKey);

    res.status(200).json({
      success: true,
      data: {
        walletInfo
      }
    });

  } catch (error: any) {
    logger.error('Failed to get wallet info:', error);
    return next(new ErrorHandler(error.message || 'Failed to get wallet information', 500));
  }
});

// Validate wallet signature
export const validateWallet = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey, signature, message, timestamp } = req.body;
    
    if (!publicKey || !signature || !message || !timestamp) {
      return next(new ErrorHandler('All validation fields are required', 400));
    }

    const walletService = getWalletService();
    const validation = await walletService.validateAndAuthenticateWallet({
      publicKey,
      signature,
      message,
      timestamp
    });

    if (!validation.authenticated) {
      return next(new ErrorHandler(validation.error || 'Wallet validation failed', 401));
    }

    res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        publicKey: validation.publicKey,
        walletInfo: validation.walletInfo
      }
    });

  } catch (error: any) {
    logger.error('Wallet validation failed:', error);
    return next(new ErrorHandler(error.message || 'Wallet validation failed', 500));
  }
});

// Get wallet statistics
export const getWalletStats = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const stats = await walletService.getWalletStats(pubKey);

    res.status(200).json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error: any) {
    logger.error('Failed to get wallet stats:', error);
    return next(new ErrorHandler(error.message || 'Failed to get wallet statistics', 500));
  }
});

// Get SOL balance
export const getSOLBalance = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const balance = await walletService.getSOLBalance(pubKey);

    res.status(200).json({
      success: true,
      data: {
        balance,
        publicKey: publicKey
      }
    });

  } catch (error: any) {
    logger.error('Failed to get SOL balance:', error);
    return next(new ErrorHandler(error.message || 'Failed to get SOL balance', 500));
  }
});

// Get SPL token balances
export const getSPLTokenBalances = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const tokens = await walletService.getSPLTokenBalances(pubKey);

    res.status(200).json({
      success: true,
      data: {
        tokens,
        publicKey: publicKey
      }
    });

  } catch (error: any) {
    logger.error('Failed to get SPL token balances:', error);
    return next(new ErrorHandler(error.message || 'Failed to get SPL token balances', 500));
  }
});

// Get governance token balance
export const getGovernanceTokenBalance = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const governanceTokens = await walletService.getGovernanceTokenBalance(pubKey);

    res.status(200).json({
      success: true,
      data: {
        governanceTokens,
        publicKey: publicKey
      }
    });

  } catch (error: any) {
    logger.error('Failed to get governance token balance:', error);
    return next(new ErrorHandler(error.message || 'Failed to get governance token balance', 500));
  }
});

// Get UBI credits
export const getUBICredits = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const ubiCredits = await walletService.getUBICredits(pubKey);

    res.status(200).json({
      success: true,
      data: {
        ubiCredits,
        publicKey: publicKey
      }
    });

  } catch (error: any) {
    logger.error('Failed to get UBI credits:', error);
    return next(new ErrorHandler(error.message || 'Failed to get UBI credits', 500));
  }
});

// Get NFT assets
export const getNFTAssets = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    const nftAssets = await walletService.getNFTAssets(pubKey);

    res.status(200).json({
      success: true,
      data: {
        nftAssets,
        publicKey: publicKey
      }
    });

  } catch (error: any) {
    logger.error('Failed to get NFT assets:', error);
    return next(new ErrorHandler(error.message || 'Failed to get NFT assets', 500));
  }
});

// Health check
export const walletHealthCheck = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletService = getWalletService();
    const health = await walletService.healthCheck();

    res.status(health.healthy ? 200 : 503).json({
      success: health.healthy,
      data: {
        ...health,
        timestamp: Date.now()
      }
    });

  } catch (error: any) {
    logger.error('Wallet health check failed:', error);
    return next(new ErrorHandler(error.message || 'Wallet health check failed', 500));
  }
});

// Setup wallet monitoring
export const setupWalletMonitoring = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return next(new ErrorHandler('Public key is required', 400));
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return next(new ErrorHandler('Invalid public key format', 400));
    }

    const walletService = getWalletService();
    
    // Setup monitoring with callback
    const monitoring = await walletService.monitorWalletChanges(pubKey, (update) => {
      // Broadcast update via WebSocket or other real-time mechanism
      logger.info('Wallet update received:', update);
    });

    res.status(200).json({
      success: true,
      data: {
        monitoring: {
          solSubscription: monitoring.solSubscription,
          tokenSubscription: monitoring.tokenSubscription
        },
        publicKey: publicKey
      }
    });

  } catch (error: any) {
    logger.error('Failed to setup wallet monitoring:', error);
    return next(new ErrorHandler(error.message || 'Failed to setup wallet monitoring', 500));
  }
});
