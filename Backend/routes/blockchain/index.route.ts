import express from 'express';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { getBlockchainService } from '../../services/blockchain.service';
import ubiRoutes from './ubi.route';
import governanceRoutes from './governance.route';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const blockchainService = getBlockchainService();
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized',
      });
    }

    const health = await blockchainService.healthCheck();
    
    res.status(health.healthy ? 200 : 503).json({
      success: health.healthy,
      data: {
        healthy: health.healthy,
        services: health.services,
        errors: health.errors,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

// System overview endpoint
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const blockchainService = getBlockchainService();
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized',
      });
    }

    const health = await blockchainService.healthCheck();
    const redisService = blockchainService.getRedisService();
    const connectionPool = blockchainService.getConnectionPool();

    const overview = {
      system: {
        status: health.healthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      blockchain: {
        connection: {
          healthy: health.services.connection.healthy,
          activeEndpoints: health.services.connection.activeEndpoints,
          totalRequests: health.services.connection.totalRequests,
          successRate: health.services.connection.totalRequests > 0 
            ? (health.services.connection.successfulRequests / health.services.connection.totalRequests) * 100 
            : 0,
          avgResponseTime: health.services.connection.avgResponseTime,
        },
        programs: health.services.programs,
      },
      cache: {
        redis: {
          connected: health.services.redis.connected,
          memory: health.services.redis.memory,
          queueLengths: health.services.redis.queueLengths,
        },
      },
      workers: {
        ubi: {
          running: health.services.workers.ubi.running,
          queueLengths: health.services.workers.ubi.queueLengths,
        },
      },
      websocket: {
        connected: health.services.websocket.connected,
        clients: health.services.websocket.clients,
        rooms: health.services.websocket.rooms,
      },
      errors: health.errors,
    };

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error('Failed to get system overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system overview',
    });
  }
});

// User overview endpoint
router.get('/user/:publicKey/overview', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    const blockchainService = getBlockchainService();
    
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized',
      });
    }

    // Get user data from all services
    const [ubiService, governanceService] = [
      blockchainService.getUbiService(),
      blockchainService.getGovernanceService(),
    ];

    const userOverview = {
      publicKey,
      ubi: {
        profile: null,
        eligibility: null,
        balance: 0,
        canClaimInitial: false,
        canClaimMonthly: false,
      },
      governance: {
        votingPower: '0',
        votes: [],
        delegations: [],
        proposals: [],
      },
      marketplace: {
        products: [],
        orders: [],
        sales: [],
      },
      p2p: {
        orders: [],
        trades: [],
        reputation: 0,
      },
      bridge: {
        transactions: [],
        supportedChains: [],
      },
    };

    // Fetch UBI data
    if (ubiService) {
      try {
        const userPublicKey = new (await import('@solana/web3.js')).PublicKey(publicKey);
        const profile = await ubiService.getUserProfile(userPublicKey);
        const canClaimInitial = await ubiService.canClaimInitialUbi(userPublicKey);
        const canClaimMonthly = await ubiService.canClaimMonthlyUbi(userPublicKey);
        const balance = await ubiService.getUserTokenBalance(userPublicKey);

        userOverview.ubi = {
          profile,
          eligibility: { canClaimInitial, canClaimMonthly },
          balance,
          canClaimInitial,
          canClaimMonthly,
        };
      } catch (error) {
        logger.warn(`Failed to fetch UBI data for user ${publicKey}:`, error);
      }
    }

    // Fetch Governance data
    if (governanceService) {
      try {
        const userPublicKey = new (await import('@solana/web3.js')).PublicKey(publicKey);
        const votingPower = await governanceService.getUserVotingPower(userPublicKey);
        const votes = await governanceService.getUserVotingHistory(publicKey);
        const delegations = await governanceService.getUserDelegations(userPublicKey);

        userOverview.governance = {
          votingPower: votingPower.toString(),
          votes: votes.map(v => ({
            proposalId: v.proposal.toString(),
            voteType: v.voteType,
            votingPower: v.votingPower.toString(),
            timestamp: v.timestamp,
          })),
          delegations: delegations.map(d => ({
            delegate: d.delegate.toString(),
            votingPower: d.votingPower.toString(),
            createdAt: d.createdAt,
            isActive: d.isActive,
          })),
          proposals: [], // TODO: Fetch user's proposals
        };
      } catch (error) {
        logger.warn(`Failed to fetch Governance data for user ${publicKey}:`, error);
      }
    }

    res.json({
      success: true,
      data: userOverview,
    });
  } catch (error) {
    logger.error(`Failed to get user overview for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user overview',
    });
  }
});

// Analytics endpoint
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { timeframe = '24h', type = 'all' } = req.query;
    
    const blockchainService = getBlockchainService();
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized',
      });
    }

    // Mock analytics data - in production, this would aggregate data from all services
    const analytics = {
      timeframe,
      type,
      ubi: {
        totalUsers: 1250,
        activeUsers: 1100,
        totalDistributed: '50000000000', // 50,000 tokens
        monthlyDistributed: '5000000000', // 5,000 tokens
        averageClaimAmount: '2000000000', // 2000 tokens
        fraudReports: 15,
        successRate: 98.5,
        trends: {
          userGrowth: 12.5,
          distributionGrowth: 8.3,
          fraudRate: 1.2,
        },
      },
      governance: {
        totalProposals: 15,
        activeProposals: 2,
        executedProposals: 8,
        totalVotes: 125000,
        participationRate: 78.5,
        averageVotingPower: '400000000', // 400 tokens
        trends: {
          proposalGrowth: 25.0,
          participationGrowth: 15.2,
          executionRate: 53.3,
        },
      },
      marketplace: {
        totalProducts: 0,
        totalSales: 0,
        totalVolume: '0',
        averagePrice: '0',
        trends: {
          productGrowth: 0,
          salesGrowth: 0,
          volumeGrowth: 0,
        },
      },
      p2p: {
        totalOrders: 0,
        totalTrades: 0,
        totalVolume: '0',
        averageTradeSize: '0',
        trends: {
          orderGrowth: 0,
          tradeGrowth: 0,
          volumeGrowth: 0,
        },
      },
      bridge: {
        totalTransactions: 0,
        totalVolume: '0',
        supportedChains: [],
        trends: {
          transactionGrowth: 0,
          volumeGrowth: 0,
        },
      },
      system: {
        totalRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        errorRate: 0,
        trends: {
          requestGrowth: 0,
          performanceGrowth: 0,
        },
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

// Event channels endpoint
router.get('/events', async (req: Request, res: Response) => {
  try {
    const blockchainService = getBlockchainService();
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service not initialized',
      });
    }

    const webSocketService = blockchainService.getWebSocketService();
    if (!webSocketService) {
      return res.status(503).json({
        success: false,
        error: 'WebSocket service not initialized',
      });
    }

    const eventChannels = {
      available: [
        'ubi_claim',
        'ubi_registration',
        'proposal_created',
        'proposal_voted',
        'proposal_executed',
        'marketplace_purchase',
        'p2p_trade',
        'bridge_transaction',
        'fraud_reported',
        'system_alert',
      ],
      websocket: {
        connected: webSocketService.healthCheck(),
        clients: webSocketService.getStats().connectedClients,
        rooms: webSocketService.getStats().activeRooms,
      },
    };

    res.json({
      success: true,
      data: eventChannels,
    });
  } catch (error) {
    logger.error('Failed to get event channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event channels',
    });
  }
});

// Mount sub-routes
router.use('/ubi', ubiRoutes);
router.use('/governance', governanceRoutes);

// TODO: Add other service routes
// router.use('/marketplace', marketplaceRoutes);
// router.use('/p2p', p2pRoutes);
// router.use('/bridge', bridgeRoutes);

export default router;
