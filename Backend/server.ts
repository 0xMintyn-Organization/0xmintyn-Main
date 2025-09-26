import { app } from "./app";
import { connectDB } from "./utils/db";
import { blockchainWorker } from "./services/workers/blockchain-worker.service";
import { solanaClientManager } from "./services/solana/solana-client-manager.service";
import { initializeBlockchainService } from "./services/blockchain.service";
import { logger } from "./utils/logger";
require ('dotenv').config();
import http from 'http';
const server = http.createServer(app);

// create server
const PORT = process.env.PORT || 8000;

// Initialize blockchain services
async function initializeBlockchainServices() {
  try {
    logger.info('Initializing blockchain services...');
    
    // Initialize the new blockchain service
    const blockchainService = initializeBlockchainService({
      rpcUrls: [
        process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'https://api.mainnet-beta.solana.com',
      ],
      programIds: {
        ubi: process.env.UBI_PROGRAM_ID || '11111111111111111111111111111111',
        governance: process.env.GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111',
        marketplace: process.env.MARKETPLACE_PROGRAM_ID || '11111111111111111111111111111111',
        p2p: process.env.P2P_PROGRAM_ID || '11111111111111111111111111111111',
        bridge: process.env.BRIDGE_PROGRAM_ID || '11111111111111111111111111111111',
      },
      enableWorkers: process.env.ENABLE_WORKERS !== 'false',
      enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
    });

    // Initialize WebSocket service
    await blockchainService.initializeWebSocket(server);
    
    // Perform health check
    const healthCheck = await blockchainService.healthCheck();
    if (healthCheck.healthy) {
      logger.info('Blockchain service initialized successfully');
    } else {
      logger.warn('Blockchain service health check failed:', healthCheck.errors);
    }
    
    // Legacy services (keep for backward compatibility)
    const legacyHealthCheck = await solanaClientManager.performHealthCheck();
    if (legacyHealthCheck.healthy) {
      logger.info('Legacy Solana client manager initialized successfully');
    } else {
      logger.warn('Legacy Solana client manager health check failed:', legacyHealthCheck.issues);
    }
    
    // Start blockchain worker
    if (process.env.NODE_ENV !== 'test') {
      blockchainWorker.start();
    }
    
    logger.info('All blockchain services initialized');
  } catch (error) {
    logger.error('Failed to initialize blockchain services:', error);
  }
}

server.listen(PORT, async () => {
  console.log(`Server is running on ${PORT}`);
  
  // Connect to database
  await connectDB();
  
  // Initialize blockchain services
  await initializeBlockchainServices();
});