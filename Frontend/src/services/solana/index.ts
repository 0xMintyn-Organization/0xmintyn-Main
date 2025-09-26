// Export all Solana services
export { getConnectionPool, destroyConnectionPool, ConnectionPool, RateLimiter } from './connection';
export type { 
  RpcEndpoint, 
  ConnectionConfig, 
  RateLimitConfig, 
  ConnectionStats 
} from './connection';

export { UbiService } from './ubi.service';
export type {
  UbiConfig,
  UserProfile,
  FraudDetection,
  Treasury,
  InitializeUserParams,
  ClaimUbiParams,
  FundTreasuryParams,
  ReportFraudParams,
  VerifyUserParams,
  SuspendUserParams,
  UpdateUbiAmountsParams,
} from './ubi.service';

export { GovernanceService } from './governance.service';
export type {
  Proposal,
  Vote,
  Delegation,
  GovernanceConfig,
  ProposalStatus,
  ProposalType,
  VoteType,
  CreateProposalParams,
  VoteParams,
  DelegateVoteParams,
  ExecuteProposalParams,
} from './governance.service';

export { MarketplaceService } from './marketplace.service';
export type {
  Product,
  Order,
  Escrow,
  Review,
  MarketplaceConfig,
  OrderStatus,
  CreateProductParams,
  PurchaseProductParams,
  ReleaseEscrowParams,
  DisputeOrderParams,
  ResolveDisputeParams,
  AddReviewParams,
} from './marketplace.service';

export { P2PService } from './p2p.service';
export type {
  OrderBook,
  Order as P2POrder,
  Trade,
  Escrow as P2PEscrow,
  P2PConfig,
  OrderType,
  OrderStatus as P2POrderStatus,
  EscrowStatus,
  CreateOrderParams as CreateP2POrderParams,
  CancelOrderParams,
  ExecuteTradeParams,
  InitiateEscrowParams,
  ConfirmFiatPaymentParams,
  ReleaseEscrowParams as ReleaseP2PEscrowParams,
  DisputeEscrowParams,
  ResolveDisputeParams as ResolveP2PDisputeParams,
} from './p2p.service';

export { BridgeService } from './bridge.service';
export type {
  BridgeConfig,
  SupportedChain,
  BridgeTransaction,
  BridgeVault,
  BridgeHealth,
  BridgeStatus,
  InitiateBridgeParams,
  CompleteBridgeParams,
  CancelBridgeParams,
  UpdateBridgeConfigParams,
  AddSupportedChainParams,
  RemoveSupportedChainParams,
} from './bridge.service';

// Service factory function
import { AnchorProvider } from '@coral-xyz/anchor';

export class SolanaServiceFactory {
  private provider: AnchorProvider;
  private ubiService: UbiService | null = null;
  private governanceService: GovernanceService | null = null;
  private marketplaceService: MarketplaceService | null = null;
  private p2pService: P2PService | null = null;
  private bridgeService: BridgeService | null = null;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
  }

  getUbiService(): UbiService {
    if (!this.ubiService) {
      this.ubiService = new UbiService(this.provider);
    }
    return this.ubiService;
  }

  getGovernanceService(): GovernanceService {
    if (!this.governanceService) {
      this.governanceService = new GovernanceService(this.provider);
    }
    return this.governanceService;
  }

  getMarketplaceService(): MarketplaceService {
    if (!this.marketplaceService) {
      this.marketplaceService = new MarketplaceService(this.provider);
    }
    return this.marketplaceService;
  }

  getP2PService(): P2PService {
    if (!this.p2pService) {
      this.p2pService = new P2PService(this.provider);
    }
    return this.p2pService;
  }

  getBridgeService(): BridgeService {
    if (!this.bridgeService) {
      this.bridgeService = new BridgeService(this.provider);
    }
    return this.bridgeService;
  }

  // Get all services
  getAllServices() {
    return {
      ubi: this.getUbiService(),
      governance: this.getGovernanceService(),
      marketplace: this.getMarketplaceService(),
      p2p: this.getP2PService(),
      bridge: this.getBridgeService(),
    };
  }

  // Cleanup all services
  cleanup(): void {
    this.ubiService = null;
    this.governanceService = null;
    this.marketplaceService = null;
    this.p2pService = null;
    this.bridgeService = null;
  }
}

// Default export
export default SolanaServiceFactory;
