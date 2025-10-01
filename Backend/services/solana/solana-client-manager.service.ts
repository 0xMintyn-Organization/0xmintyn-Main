import { SolanaConnectionManager, defaultSolanaConfig } from './connection.service';
// Removed UBI client import
import { GovernanceClientService } from './clients/governance-client.service';
import { PublicKey, Cluster } from '@solana/web3.js';

export interface ProgramConfig {
  programId: string;
  name: string;
  enabled: boolean;
}

export interface SolanaClientManagerConfig {
  cluster: Cluster;
  programs: {
    governance: ProgramConfig;
    splToken: ProgramConfig;
  };
}

export class SolanaClientManager {
  private connectionManager: SolanaConnectionManager;
  private config: SolanaClientManagerConfig;
  
  // Client instances
  public governance: GovernanceClientService;
  public splToken: any; // SPL Token operations are handled directly

  constructor(config?: Partial<SolanaClientManagerConfig>) {
    // Default configuration
    this.config = {
      cluster: 'devnet',
      programs: {
        governance: {
          programId: 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS',
          name: 'Governance',
          enabled: true
        },
        splToken: {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          name: 'SPL Token',
          enabled: true
        },
      },
      ...config
    };

    // Initialize connection manager
    this.connectionManager = new SolanaConnectionManager(defaultSolanaConfig);
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize Governance client
    if (this.config.programs.governance.enabled) {
      this.governance = new GovernanceClientService(
        this.connectionManager,
        this.config.programs.governance.programId
      );
    }

    // SPL Token operations are handled directly through @solana/spl-token
    this.splToken = {
      programId: this.config.programs.splToken.programId,
      name: this.config.programs.splToken.name,
      enabled: this.config.programs.splToken.enabled
    };
  }

  // Connection Management
  public getConnection() {
    return this.connectionManager.getConnection(this.config.cluster);
  }

  public async getHealthyConnection() {
    return await this.connectionManager.getHealthyConnection(this.config.cluster);
  }

  // Health Check
  public async healthCheck() {
    const connection = await this.getHealthyConnection();
    const connectionHealthy = !!connection;

    return {
      healthy: connectionHealthy,
      services: {
        connection: {
          healthy: connectionHealthy,
          activeEndpoints: this.connectionManager.getActiveEndpoints(),
          totalRequests: this.connectionManager.getTotalRequests(),
          successfulRequests: this.connectionManager.getSuccessfulRequests(),
          avgResponseTime: this.connectionManager.getAvgResponseTime()
        },
        programs: {
          governance: !!this.governance,
          splToken: !!this.splToken
        },
        redis: {
          connected: true, // TODO: Add Redis health check
          memory: {},
          queueLengths: {}
        },
        workers: {
          // Removed UBI worker
        },
        websocket: {
          connected: true, // TODO: Add WebSocket health check
          clients: 0,
          rooms: []
        }
      },
      errors: []
    };
  }

  // Get specific services
  public getGovernanceService(): GovernanceClientService {
    return this.governance;
  }

  public getSplTokenService() {
    return this.splToken;
  }

  // User Overview
  public async getUserOverview(userPublicKey: PublicKey) {
    const overview = {
      publicKey: userPublicKey.toString(),
      programs: {
        governance: {
          votingPower: '0',
          votes: [],
          delegations: [],
          proposals: []
        },
        splToken: {
          tokens: [],
          totalBalance: 0
        }
      }
    };

    // Removed UBI data fetching

    // Fetch Governance data
    if (this.governance) {
      try {
        const votingPower = await this.governance.getUserVotingPower(userPublicKey);
        const votes = await this.governance.getUserVotingHistory(userPublicKey.toString());
        const delegations = await this.governance.getUserDelegations(userPublicKey);

        overview.programs.governance = {
          votingPower: votingPower.toString(),
          votes: votes.map(v => ({
            proposalId: v.proposal.toString(),
            voteType: v.voteType,
            votingPower: v.votingPower.toString(),
            timestamp: v.timestamp
          })),
          delegations: delegations.map(d => ({
            delegate: d.delegate.toString(),
            votingPower: d.votingPower.toString(),
            createdAt: d.createdAt,
            isActive: d.isActive
          })),
          proposals: []
        };
      } catch (error) {
        console.warn('Failed to fetch Governance data:', error);
      }
    }

    return overview;
  }

  // System Overview
  public async getSystemOverview() {
    const health = await this.healthCheck();
    
    return {
      system: {
        status: health.healthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      blockchain: {
        connection: {
          healthy: health.services.connection.healthy,
          activeEndpoints: health.services.connection.activeEndpoints,
          totalRequests: health.services.connection.totalRequests,
          successRate: health.services.connection.totalRequests > 0 
            ? (health.services.connection.successfulRequests / health.services.connection.totalRequests) * 100 
            : 0,
          avgResponseTime: health.services.connection.avgResponseTime
        },
        programs: health.services.programs
      },
      cache: {
        redis: {
          connected: health.services.redis.connected,
          memory: health.services.redis.memory,
          queueLengths: health.services.redis.queueLengths
        }
      },
      workers: {
        ubi: {
          running: health.services.workers.ubi.running,
          queueLengths: health.services.workers.ubi.queueLengths
        }
      },
      websocket: {
        connected: health.services.websocket.connected,
        clients: health.services.websocket.clients,
        rooms: health.services.websocket.rooms
      },
      errors: health.errors
    };
  }
}

// Export singleton instance
export const solanaClientManager = new SolanaClientManager();