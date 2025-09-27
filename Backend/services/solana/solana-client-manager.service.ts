import { SolanaConnectionManager, defaultSolanaConfig } from './connection.service';
import { UbiClientService } from './clients/ubi-client.service';
import { MarketplaceClientService } from './clients/marketplace-client.service';
import { GovernanceClientService } from './clients/governance-client.service';
import { P2PExchangeClientService } from './clients/p2p-exchange-client.service';
import { BridgeClientService } from './clients/bridge-client.service';
import { BaseProgramClientService } from './clients/base-program-client.service';
import { PublicKey, Cluster } from '@solana/web3.js';

export interface ProgramConfig {
  programId: string;
  name: string;
  enabled: boolean;
}

export interface SolanaClientManagerConfig {
  cluster: Cluster;
  programs: {
    ubi: ProgramConfig;
    marketplace: ProgramConfig;
    governance: ProgramConfig;
    p2pExchange: ProgramConfig;
    bridge: ProgramConfig;
    splToken: ProgramConfig;
    p2pEscrow: ProgramConfig;
    exchangeSettlement: ProgramConfig;
  };
}

export class SolanaClientManager {
  private connectionManager: SolanaConnectionManager;
  private config: SolanaClientManagerConfig;
  
  // Client instances
  public ubi: UbiClientService;
  public marketplace: MarketplaceClientService;
  public governance: GovernanceClientService;
  public p2pExchange: P2PExchangeClientService;
  public bridge: BridgeClientService;
  public splToken: BaseProgramClientService;
  public p2pEscrow: BaseProgramClientService;
  public exchangeSettlement: BaseProgramClientService;

  constructor(config?: Partial<SolanaClientManagerConfig>) {
    // Default configuration
    this.config = {
      cluster: 'devnet',
      programs: {
        ubi: {
          programId: 'CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN',
          name: 'UBI Distribution',
          enabled: true
        },
        marketplace: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'Digital Marketplace',
          enabled: true
        },
        governance: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'Governance',
          enabled: true
        },
        p2pExchange: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'P2P Exchange',
          enabled: true
        },
        bridge: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'Cross-Chain Bridge',
          enabled: true
        },
        splToken: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'SPL Token',
          enabled: true
        },
        p2pEscrow: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'P2P Escrow',
          enabled: true
        },
        exchangeSettlement: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'Exchange Settlement',
          enabled: true
        }
      },
      ...config
    };

    // Initialize connection manager
    this.connectionManager = new SolanaConnectionManager(defaultSolanaConfig);

    // Initialize client services
    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize UBI client
    if (this.config.programs.ubi.enabled) {
      this.ubi = new UbiClientService(
        this.connectionManager,
        this.config.programs.ubi.programId
      );
    }

    // Initialize Marketplace client
    if (this.config.programs.marketplace.enabled) {
      this.marketplace = new MarketplaceClientService(
        this.connectionManager,
        this.config.programs.marketplace.programId
      );
    }

    // Initialize Governance client
    if (this.config.programs.governance.enabled) {
      this.governance = new GovernanceClientService(
        this.connectionManager,
        this.config.programs.governance.programId
      );
    }

    // Initialize P2P Exchange client
    if (this.config.programs.p2pExchange.enabled) {
      this.p2pExchange = new P2PExchangeClientService(
        this.connectionManager,
        this.config.programs.p2pExchange.programId
      );
    }

    // Initialize Bridge client
    if (this.config.programs.bridge.enabled) {
      this.bridge = new BridgeClientService(
        this.connectionManager,
        this.config.programs.bridge.programId
      );
    }

    // Initialize SPL Token client
    if (this.config.programs.splToken.enabled) {
      this.splToken = new BaseProgramClientService(
        this.connectionManager,
        this.config.programs.splToken.programId,
        '../../../idl/counter.json'
      );
    }

    // Initialize P2P Escrow client
    if (this.config.programs.p2pEscrow.enabled) {
      this.p2pEscrow = new BaseProgramClientService(
        this.connectionManager,
        this.config.programs.p2pEscrow.programId,
        '../../../idl/counter.json'
      );
    }

    // Initialize Exchange Settlement client
    if (this.config.programs.exchangeSettlement.enabled) {
      this.exchangeSettlement = new BaseProgramClientService(
        this.connectionManager,
        this.config.programs.exchangeSettlement.programId,
        '../../../idl/counter.json'
      );
    }
  }

  // Connection Management
  public getConnection() {
    return this.connectionManager.getConnection(this.config.cluster);
  }

  public async getHealthyConnection() {
    return await this.connectionManager.getHealthyConnection(this.config.cluster);
  }

  public async getConnectionStats() {
    return await this.connectionManager.getConnectionStats();
  }

  // Program Management
  public getProgramInfo(programName: keyof typeof this.config.programs) {
    return this.config.programs[programName];
  }

  public getAllPrograms() {
    return Object.entries(this.config.programs).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  public getEnabledPrograms() {
    return this.getAllPrograms().filter(program => program.enabled);
  }

  public isProgramEnabled(programName: keyof typeof this.config.programs): boolean {
    return this.config.programs[programName].enabled;
  }

  // Cross-Program Operations
  public async getUserOverview(userPublicKey: PublicKey) {
    const overview: any = {
      publicKey: userPublicKey.toString(),
      programs: {}
    };

    try {
      // UBI Data
      if (this.ubi) {
        const userProfile = await this.ubi.getUserProfile(userPublicKey);
        const fraudDetection = await this.ubi.getFraudDetection(userPublicKey);
        const tokenBalance = await this.ubi.getUserTokenBalance(userPublicKey);
        const canClaimInitial = await this.ubi.canClaimInitialUbi(userPublicKey);
        const canClaimMonthly = await this.ubi.canClaimMonthlyUbi(userPublicKey);

        overview.programs.ubi = {
          profile: userProfile,
          fraudDetection,
          tokenBalance,
          canClaimInitial,
          canClaimMonthly
        };
      }

      // Marketplace Data
      if (this.marketplace) {
        const listings = await this.marketplace.getListingsBySeller(userPublicKey);
        overview.programs.marketplace = {
          listings: listings.length,
          activeListings: listings.filter(({ account }) => account.isActive).length
        };
      }

      // Governance Data
      if (this.governance) {
        const proposals = await this.governance.getProposalsByProposer(userPublicKey);
        const votingPower = await this.governance.getVotingPower(userPublicKey);
        overview.programs.governance = {
          proposals: proposals.length,
          votingPower: votingPower.toString()
        };
      }

      // P2P Exchange Data
      if (this.p2pExchange) {
        const orders = await this.p2pExchange.getOrdersByMaker(userPublicKey);
        overview.programs.p2pExchange = {
          orders: orders.length,
          activeOrders: orders.filter(({ account }) => account.isActive).length
        };
      }

      // Bridge Data
      if (this.bridge) {
        const bridgeRequests = await this.bridge.getBridgeRequestsBySender(userPublicKey);
        overview.programs.bridge = {
          bridgeRequests: bridgeRequests.length,
          pendingRequests: bridgeRequests.filter(({ account }) => account.status === 0).length
        };
      }

    } catch (error) {
      console.error('Error fetching user overview:', error);
      overview.error = error.message;
    }

    return overview;
  }

  public async getSystemOverview() {
    const overview: any = {
      cluster: this.config.cluster,
      programs: {},
      connection: await this.getConnectionStats()
    };

    try {
      // UBI System Data
      if (this.ubi) {
        const ubiConfig = await this.ubi.getUbiConfig();
        const treasury = await this.ubi.getTreasury();
        overview.programs.ubi = {
          config: ubiConfig,
          treasury
        };
      }

      // Marketplace System Data
      if (this.marketplace) {
        const marketplace = await this.marketplace.getMarketplace();
        const activeListings = await this.marketplace.getActiveListings();
        overview.programs.marketplace = {
          marketplace,
          activeListings: activeListings.length
        };
      }

      // Governance System Data
      if (this.governance) {
        const governanceConfig = await this.governance.getGovernanceConfig();
        const activeProposals = await this.governance.getActiveProposals();
        overview.programs.governance = {
          config: governanceConfig,
          activeProposals: activeProposals.length
        };
      }

      // P2P Exchange System Data
      if (this.p2pExchange) {
        const exchangeConfig = await this.p2pExchange.getExchangeConfig();
        const activeOrders = await this.p2pExchange.getActiveOrders();
        overview.programs.p2pExchange = {
          config: exchangeConfig,
          activeOrders: activeOrders.length
        };
      }

      // Bridge System Data
      if (this.bridge) {
        const bridgeConfig = await this.bridge.getBridgeConfig();
        const bridgeStats = await this.bridge.getBridgeStatistics();
        overview.programs.bridge = {
          config: bridgeConfig,
          statistics: bridgeStats
        };
      }

    } catch (error) {
      console.error('Error fetching system overview:', error);
      overview.error = error.message;
    }

    return overview;
  }

  // Event Management
  public setupEventListeners(callbacks: {
    onUbiClaimed?: (event: any) => void;
    onListingCreated?: (event: any) => void;
    onProposalCreated?: (event: any) => void;
    onOrderFilled?: (event: any) => void;
    onBridgeInitiated?: (event: any) => void;
  }) {
    // UBI Events
    if (callbacks.onUbiClaimed && this.ubi) {
      this.ubi.onInitialUbiClaimed(callbacks.onUbiClaimed);
      this.ubi.onMonthlyUbiClaimed(callbacks.onUbiClaimed);
    }

    // Marketplace Events
    if (callbacks.onListingCreated && this.marketplace) {
      this.marketplace.onListingCreated(callbacks.onListingCreated);
    }

    // Governance Events
    if (callbacks.onProposalCreated && this.governance) {
      this.governance.onProposalCreated(callbacks.onProposalCreated);
    }

    // P2P Exchange Events
    if (callbacks.onOrderFilled && this.p2pExchange) {
      this.p2pExchange.onOrderFilled(callbacks.onOrderFilled);
    }

    // Bridge Events
    if (callbacks.onBridgeInitiated && this.bridge) {
      this.bridge.onBridgeInitiated(callbacks.onBridgeInitiated);
    }
  }

  // Health Checks
  public async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    programs: Record<string, boolean>;
  }> {
    const issues: string[] = [];
    const programs: Record<string, boolean> = {};

    try {
      // Check connection health
      await this.getHealthyConnection();
    } catch (error) {
      issues.push(`Connection issue: ${error.message}`);
    }

    // Check each program
    for (const [name, config] of Object.entries(this.config.programs)) {
      if (!config.enabled) {
        programs[name] = true; // Skip disabled programs
        continue;
      }

      try {
        // Basic health check for each program
        const client = this[name as keyof this];
        if (client && typeof client.getProgramInfo === 'function') {
          client.getProgramInfo();
          programs[name] = true;
        } else {
          programs[name] = false;
          issues.push(`Program ${name} client not initialized`);
        }
      } catch (error) {
        programs[name] = false;
        issues.push(`Program ${name} health check failed: ${error.message}`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      programs
    };
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<SolanaClientManagerConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeClients(); // Reinitialize clients with new config
  }

  public enableProgram(programName: keyof typeof this.config.programs) {
    this.config.programs[programName].enabled = true;
    this.initializeClients();
  }

  public disableProgram(programName: keyof typeof this.config.programs) {
    this.config.programs[programName].enabled = false;
    // Note: We don't remove the client instance, just mark it as disabled
  }

  public getConfig() {
    return { ...this.config };
  }
}

// Global instance
export const solanaClientManager = new SolanaClientManager();










