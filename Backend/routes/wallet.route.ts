import express from 'express';
import { 
  getWalletInfo,
  validateWallet,
  getWalletStats,
  getSOLBalance,
  getSPLTokenBalances,
  getGovernanceTokenBalance,
  getUBICredits,
  getNFTAssets,
  walletHealthCheck,
  setupWalletMonitoring
} from '../controllers/wallet.controller';

const walletRouter = express.Router();

// Wallet information endpoints
walletRouter.post('/info', getWalletInfo);
walletRouter.post('/validate', validateWallet);
walletRouter.get('/health', walletHealthCheck);

// Wallet statistics
walletRouter.get('/:publicKey/stats', getWalletStats);

// Balance endpoints
walletRouter.get('/:publicKey/balance/sol', getSOLBalance);
walletRouter.get('/:publicKey/balance/tokens', getSPLTokenBalances);
walletRouter.get('/:publicKey/balance/governance', getGovernanceTokenBalance);
walletRouter.get('/:publicKey/balance/ubi', getUBICredits);

// Asset endpoints
walletRouter.get('/:publicKey/assets/nft', getNFTAssets);

// Monitoring endpoints
walletRouter.post('/monitor', setupWalletMonitoring);

export default walletRouter;
