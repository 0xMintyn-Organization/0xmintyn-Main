import express from 'express';
import ubiRouter from './ubi.route';
import marketplaceRouter from './marketplace.route';
import governanceRouter from './governance.route';
import { catchAsyncError } from '../../middleware/catchAsyncError';
import { solanaClientManager } from '../../services/solana/solana-client-manager.service';
import { blockchainWorker } from '../../services/workers/blockchain-worker.service';
import { cacheService } from '../../services/cache/redis-cache.service';

const blockchainRouter = express.Router();

// Mount sub-routers
blockchainRouter.use('/ubi', ubiRouter);
blockchainRouter.use('/marketplace', marketplaceRouter);
blockchainRouter.use('/governance', governanceRouter);

// Health check endpoint
blockchainRouter.get('/health', catchAsyncError(async (req, res) => {
  const solanaHealth = await solanaClientManager.performHealthCheck();
  const workerStatus = await blockchainWorker.getWorkerStatus();
  const cacheHealth = await cacheService.healthCheck();
  
  const isHealthy = solanaHealth.healthy && 
                   cacheHealth.status === 'healthy' && 
                   workerStatus.isRunning;
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      solana: solanaHealth,
      worker: workerStatus,
      cache: cacheHealth,
      timestamp: Date.now()
    }
  });
}));

// System overview endpoint
blockchainRouter.get('/overview', catchAsyncError(async (req, res) => {
  const overview = await solanaClientManager.getSystemOverview();
  
  res.status(200).json({
    success: true,
    data: overview
  });
}));

// User overview endpoint
blockchainRouter.get('/user/:publicKey/overview', catchAsyncError(async (req, res) => {
  const { publicKey } = req.params;
  
  try {
    const overview = await solanaClientManager.getUserOverview(
      new (await import('@solana/web3.js')).PublicKey(publicKey)
    );
    
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid public key format'
    });
  }
}));

// Programs endpoint
blockchainRouter.get('/programs', catchAsyncError(async (req, res) => {
  const programs = solanaClientManager.getAllPrograms();
  
  res.status(200).json({
    success: true,
    data: programs
  });
}));

// Connection stats endpoint
blockchainRouter.get('/connection/stats', catchAsyncError(async (req, res) => {
  const stats = await solanaClientManager.getConnectionStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
}));

// Cache stats endpoint
blockchainRouter.get('/cache/stats', catchAsyncError(async (req, res) => {
  const memoryStats = await cacheService.getMemoryStats();
  
  res.status(200).json({
    success: true,
    data: {
      memory: memoryStats,
      timestamp: Date.now()
    }
  });
}));

// Clear cache endpoint (admin only)
blockchainRouter.post('/cache/clear', catchAsyncError(async (req, res) => {
  // TODO: Add admin role check
  const { pattern = '*' } = req.body;
  
  const deletedCount = await cacheService.deletePattern(pattern);
  
  res.status(200).json({
    success: true,
    data: { deletedKeys: deletedCount },
    message: 'Cache cleared successfully'
  });
}));

// Worker control endpoints (admin only)
blockchainRouter.post('/worker/start', catchAsyncError(async (req, res) => {
  // TODO: Add admin role check
  blockchainWorker.start();
  
  res.status(200).json({
    success: true,
    message: 'Blockchain worker started'
  });
}));

blockchainRouter.post('/worker/stop', catchAsyncError(async (req, res) => {
  // TODO: Add admin role check
  blockchainWorker.stop();
  
  res.status(200).json({
    success: true,
    message: 'Blockchain worker stopped'
  });
}));

blockchainRouter.get('/worker/status', catchAsyncError(async (req, res) => {
  const status = await blockchainWorker.getWorkerStatus();
  
  res.status(200).json({
    success: true,
    data: status
  });
}));

// Analytics endpoints
blockchainRouter.get('/analytics/daily', catchAsyncError(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  
  const analytics = await cacheService.getAnalytics(`daily_stats:${date}`);
  
  res.status(200).json({
    success: true,
    data: analytics || {}
  });
}));

blockchainRouter.get('/analytics/trends', catchAsyncError(async (req, res) => {
  const { 
    program = 'all', 
    timeframe = '7d',
    metric = 'volume' 
  } = req.query;
  
  // This would be implemented based on specific analytics needs
  const trends = {
    program,
    timeframe,
    metric,
    data: [], // Placeholder
    timestamp: Date.now()
  };
  
  res.status(200).json({
    success: true,
    data: trends
  });
}));

// WebSocket events endpoint info
blockchainRouter.get('/events/channels', catchAsyncError(async (req, res) => {
  const channels = [
    {
      name: 'notifications',
      description: 'User notifications for blockchain events',
      pattern: 'mintyn:events:notifications'
    },
    {
      name: 'admin_alerts',
      description: 'Administrative alerts and fraud reports',
      pattern: 'mintyn:events:admin_alerts'
    },
    {
      name: 'marketplace_updates',
      description: 'Real-time marketplace listing and sales updates',
      pattern: 'mintyn:events:marketplace_updates'
    },
    {
      name: 'governance_updates',
      description: 'Proposal and voting updates',
      pattern: 'mintyn:events:governance_updates'
    },
    {
      name: 'exchange_updates',
      description: 'Trading and order book updates',
      pattern: 'mintyn:events:exchange_updates'
    },
    {
      name: 'bridge_updates',
      description: 'Cross-chain bridge status updates',
      pattern: 'mintyn:events:bridge_updates'
    }
  ];
  
  res.status(200).json({
    success: true,
    data: channels
  });
}));

// Batch operations endpoint
blockchainRouter.post('/batch', catchAsyncError(async (req, res) => {
  const { operations } = req.body;
  
  if (!Array.isArray(operations)) {
    return res.status(400).json({
      success: false,
      message: 'Operations must be an array'
    });
  }
  
  const results = [];
  
  for (const operation of operations) {
    try {
      // This would handle batch operations across different programs
      // Implementation depends on specific use cases
      const result = {
        operation: operation.type,
        success: true,
        data: {},
        message: 'Operation completed successfully'
      };
      results.push(result);
    } catch (error) {
      results.push({
        operation: operation.type,
        success: false,
        error: error.message
      });
    }
  }
  
  res.status(200).json({
    success: true,
    data: { results }
  });
}));

// Error handling middleware specific to blockchain routes
blockchainRouter.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Blockchain API Error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal blockchain service error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default blockchainRouter;













