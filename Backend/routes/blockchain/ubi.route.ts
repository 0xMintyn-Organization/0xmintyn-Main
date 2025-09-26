import express from 'express';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { CacheHelper } from '../../services/cache/redis.service';
import { UbiSyncHelper } from '../../models/blockchain/ubi.models';
import { ubiWorker } from '../../services/workers/ubi.worker';
import { getConnectionPool } from '../../services/solana/connection';
import { PublicKey, Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const router = express.Router();

// Get UBI configuration
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Try cache first
    let config = await CacheHelper.getUbiConfig();
    
    if (!config) {
      // Fetch from blockchain if not in cache
      const connectionPool = getConnectionPool();
      const connection = connectionPool.getConnection();
      
      // Mock blockchain data - in production, fetch from actual program
      config = {
        admin: '11111111111111111111111111111111',
        tokenMint: '11111111111111111111111111111111',
        welcomeBonusAmount: '2000000000', // 2000 tokens
        initialUbiAmount: '2000000000', // 2000 tokens
        monthlyUbiAmount: '1000000000', // 1000 tokens
        maxUsers: 1000000,
        totalUsers: 1250,
        totalDistributed: '50000000000', // 50,000 tokens
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        onChainSlot: Date.now(),
        lastSyncAt: new Date(),
      };
      
      // Cache the result
      await CacheHelper.cacheUbiConfig(config);
    }

    res.json({
      success: true,
      data: {
        blockchain: config,
        database: config, // In production, this would be from MongoDB
      },
    });
  } catch (error) {
    logger.error('Failed to get UBI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch UBI configuration',
    });
  }
});

// Get treasury information
router.get('/treasury', async (req: Request, res: Response) => {
  try {
    // Mock treasury data - in production, fetch from blockchain and database
    const treasury = {
      authority: '11111111111111111111111111111111',
      tokenMint: '11111111111111111111111111111111',
      totalFunded: '100000000000', // 100,000 tokens
      totalDistributed: '50000000000', // 50,000 tokens
      availableBalance: '50000000000', // 50,000 tokens
      pendingDistributions: '5000000000', // 5,000 tokens
      fundingHistory: [],
      distributionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      onChainSlot: Date.now(),
      lastSyncAt: new Date(),
    };

    const stats = {
      totalUsers: 1250,
      activeUsers: 1100,
      verifiedUsers: 1050,
      suspendedUsers: 25,
      totalClaims: 15000,
      monthlyClaims: 1200,
      fraudReports: 15,
    };

    res.json({
      success: true,
      data: {
        blockchain: treasury,
        database: treasury,
        stats,
      },
    });
  } catch (error) {
    logger.error('Failed to get treasury:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury information',
    });
  }
});

// Get user profile
router.get('/user/:publicKey', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    // Try cache first
    let profile = await CacheHelper.getUserProfile(publicKey);
    
    if (!profile) {
      // Mock user profile - in production, fetch from blockchain and database
      profile = {
        user: publicKey,
        identityHash: [1, 2, 3, 4, 5],
        registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        welcomeBonusClaimed: true,
        initialUbiClaimed: true,
        lastMonthlyClaim: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        totalClaimed: '3000000000', // 3000 tokens
        isVerified: true,
        isSuspended: false,
        referralCode: 'REF123',
        verificationScore: 85,
        createdAt: new Date(),
        updatedAt: new Date(),
        onChainSlot: Date.now(),
        lastSyncAt: new Date(),
      };
      
      // Cache the result
      await CacheHelper.cacheUserProfile(publicKey, profile);
    }

    // Mock fraud detection data
    const fraudDetection = {
      user: publicKey,
      identityHash: [1, 2, 3, 4, 5],
      registrationTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      verificationAttempts: 1,
      isFlagged: false,
      riskScore: 15,
      lastActivity: new Date(),
      reports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      onChainSlot: Date.now(),
      lastSyncAt: new Date(),
    };

    const stats = {
      totalClaims: 3,
      lastClaimDate: profile.lastMonthlyClaim,
      nextClaimDate: new Date(profile.lastMonthlyClaim.getTime() + 30 * 24 * 60 * 60 * 1000),
      canClaimInitial: !profile.initialUbiClaimed && profile.isVerified && !profile.isSuspended,
      canClaimMonthly: profile.initialUbiClaimed && profile.isVerified && !profile.isSuspended && 
                      (Date.now() - profile.lastMonthlyClaim.getTime()) > (30 * 24 * 60 * 60 * 1000),
    };

    res.json({
      success: true,
      data: {
        profile,
        fraudDetection,
        stats,
      },
    });
  } catch (error) {
    logger.error(`Failed to get user profile for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// Get user balance
router.get('/user/:publicKey/balance', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    // Mock balance - in production, fetch from blockchain
    const balance = 5000000000; // 5000 tokens
    
    res.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    logger.error(`Failed to get user balance for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user balance',
    });
  }
});

// Check user eligibility
router.get('/user/:publicKey/eligibility', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    // Mock eligibility check - in production, check blockchain state
    const eligibility = {
      canClaimInitial: true,
      canClaimMonthly: true,
      nextClaimTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      reason: null,
    };
    
    res.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    logger.error(`Failed to check eligibility for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to check user eligibility',
    });
  }
});

// Get UBI statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = {
      totalUsers: 1250,
      activeUsers: 1100,
      verifiedUsers: 1050,
      suspendedUsers: 25,
      totalDistributed: '50000000000', // 50,000 tokens
      monthlyDistributed: '5000000000', // 5,000 tokens
      averageClaimAmount: '2000000000', // 2000 tokens
      fraudReports: 15,
      successRate: 98.5,
      lastUpdated: new Date(),
    };
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get UBI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch UBI statistics',
    });
  }
});

// Get fraud alerts
router.get('/fraud-alerts', async (req: Request, res: Response) => {
  try {
    const { riskThreshold = 70 } = req.query;
    
    // Mock fraud alerts - in production, query database
    const alerts = [
      {
        user: '11111111111111111111111111111111',
        riskScore: 85,
        reason: 'Multiple failed verification attempts',
        timestamp: new Date(),
        severity: 'high',
      },
      {
        user: '22222222222222222222222222222222',
        riskScore: 75,
        reason: 'Suspicious activity pattern',
        timestamp: new Date(),
        severity: 'medium',
      },
    ].filter(alert => alert.riskScore >= parseInt(riskThreshold as string));
    
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logger.error('Failed to get fraud alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fraud alerts',
    });
  }
});

// Initialize user
router.post('/initialize-user', async (req: Request, res: Response) => {
  try {
    const { privateKey, identityHash, referralCode } = req.body;
    
    if (!privateKey || !identityHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: privateKey, identityHash',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `init_user_${Date.now()}`;
    const mockPublicKey = '11111111111111111111111111111111';
    
    // Record transaction in database
    await UbiSyncHelper.recordUbiTransaction(
      mockPublicKey,
      'initial',
      '0',
      mockTxHash,
      Math.floor(Date.now() / 1000),
      Date.now(),
      'confirmed'
    );

    logger.info(`User initialization transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
        publicKey: mockPublicKey,
      },
    });
  } catch (error) {
    logger.error('Failed to initialize user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize user',
    });
  }
});

// Claim initial UBI
router.post('/claim-initial', async (req: Request, res: Response) => {
  try {
    const { privateKey, userTokenAccount } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: privateKey',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `claim_initial_${Date.now()}`;
    
    // Record transaction in database
    await UbiSyncHelper.recordUbiTransaction(
      '11111111111111111111111111111111',
      'initial',
      '2000000000', // 2000 tokens
      mockTxHash,
      Math.floor(Date.now() / 1000),
      Date.now(),
      'confirmed'
    );

    // Publish event
    await CacheHelper.publishUbiClaim('11111111111111111111111111111111', '2000000000', 'initial');

    logger.info(`Initial UBI claim transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to claim initial UBI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim initial UBI',
    });
  }
});

// Claim monthly UBI
router.post('/claim-monthly', async (req: Request, res: Response) => {
  try {
    const { privateKey, userTokenAccount } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: privateKey',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `claim_monthly_${Date.now()}`;
    
    // Record transaction in database
    await UbiSyncHelper.recordUbiTransaction(
      '11111111111111111111111111111111',
      'monthly',
      '1000000000', // 1000 tokens
      mockTxHash,
      Math.floor(Date.now() / 1000),
      Date.now(),
      'confirmed'
    );

    // Publish event
    await CacheHelper.publishUbiClaim('11111111111111111111111111111111', '1000000000', 'monthly');

    logger.info(`Monthly UBI claim transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to claim monthly UBI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim monthly UBI',
    });
  }
});

// Report fraud
router.post('/report-fraud', async (req: Request, res: Response) => {
  try {
    const { reporterPrivateKey, reportedUser, reason } = req.body;
    
    if (!reporterPrivateKey || !reportedUser || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reporterPrivateKey, reportedUser, reason',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `fraud_report_${Date.now()}`;
    
    // Trigger fraud analysis
    await ubiWorker.triggerFraudAnalysis(reportedUser, reason);

    logger.info(`Fraud report transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to report fraud:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report fraud',
    });
  }
});

// Admin routes

// Fund treasury
router.post('/admin/fund-treasury', async (req: Request, res: Response) => {
  try {
    const { adminPrivateKey, amount, adminTokenAccount } = req.body;
    
    if (!adminPrivateKey || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adminPrivateKey, amount',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `fund_treasury_${Date.now()}`;
    
    logger.info(`Treasury funding transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to fund treasury:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fund treasury',
    });
  }
});

// Verify user
router.post('/admin/verify-user', async (req: Request, res: Response) => {
  try {
    const { adminPrivateKey, userToVerify, verificationScore } = req.body;
    
    if (!adminPrivateKey || !userToVerify || verificationScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adminPrivateKey, userToVerify, verificationScore',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `verify_user_${Date.now()}`;
    
    logger.info(`User verification transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to verify user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify user',
    });
  }
});

// Suspend user
router.post('/admin/suspend-user', async (req: Request, res: Response) => {
  try {
    const { adminPrivateKey, userToSuspend, suspend, reason } = req.body;
    
    if (!adminPrivateKey || !userToSuspend || suspend === undefined || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adminPrivateKey, userToSuspend, suspend, reason',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `suspend_user_${Date.now()}`;
    
    logger.info(`User suspension transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to suspend user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user',
    });
  }
});

// Toggle program
router.post('/admin/toggle-program', async (req: Request, res: Response) => {
  try {
    const { adminPrivateKey, active } = req.body;
    
    if (!adminPrivateKey || active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adminPrivateKey, active',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `toggle_program_${Date.now()}`;
    
    logger.info(`Program toggle transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to toggle program:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle program',
    });
  }
});

// Update UBI amounts
router.post('/admin/update-amounts', async (req: Request, res: Response) => {
  try {
    const { adminPrivateKey, welcomeBonus, initialUbi, monthlyUbi } = req.body;
    
    if (!adminPrivateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: adminPrivateKey',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `update_amounts_${Date.now()}`;
    
    logger.info(`UBI amounts update transaction created: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to update UBI amounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update UBI amounts',
    });
  }
});

export default router;