import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Types
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  room?: string;
}

export interface WebSocketConfig {
  url: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
}

// Event types for all smart contracts
export interface UbiClaimEvent {
  user: string;
  amount: string;
  type: 'initial' | 'monthly' | 'welcome_bonus';
  timestamp: number;
}

export interface UbiRegistrationEvent {
  user: string;
  identityHash: number[];
  timestamp: number;
}

export interface ProposalCreatedEvent {
  proposalId: string;
  title: string;
  proposer: string;
  timestamp: number;
}

export interface ProposalVotedEvent {
  proposalId: string;
  voter: string;
  voteType: 'for' | 'against' | 'abstain';
  votingPower: string;
  timestamp: number;
}

export interface ProposalExecutedEvent {
  proposalId: string;
  executor: string;
  executionData: string;
  timestamp: number;
}

export interface MarketplacePurchaseEvent {
  buyer: string;
  seller: string;
  productId: string;
  amount: string;
  timestamp: number;
}

export interface P2PTradeEvent {
  buyer: string;
  seller: string;
  orderId: string;
  amount: string;
  timestamp: number;
}

export interface BridgeTransactionEvent {
  user: string;
  fromChain: string;
  toChain: string;
  amount: string;
  transactionHash: string;
  timestamp: number;
}

export interface FraudReportedEvent {
  reporter: string;
  reportedUser: string;
  reason: string;
  timestamp: number;
}

export interface SystemAlertEvent {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  data?: any;
  timestamp: number;
}

// WebSocket Client Class
export class BlockchainWebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private userId: string | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8000',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  // Connection management
  public connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        timeout: 20000,
      });

      this.setupEventListeners();
      console.log('WebSocket connection initiated');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      toast.error('Failed to connect to real-time updates');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.userId = null;
      console.log('WebSocket disconnected');
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
      
      // Re-authenticate if we have a userId
      if (this.userId) {
        this.authenticate(this.userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isAuthenticated = false;
      console.log('WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to real-time updates after multiple attempts');
      }
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      this.isAuthenticated = true;
      console.log('WebSocket authenticated:', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error);
      toast.error('Failed to authenticate real-time connection');
    });

    // Room events
    this.socket.on('joined_room', (data) => {
      console.log('Joined room:', data.room);
    });

    this.socket.on('left_room', (data) => {
      console.log('Left room:', data.room);
    });

    this.socket.on('join_room_error', (error) => {
      console.error('Failed to join room:', error);
    });

    this.socket.on('leave_room_error', (error) => {
      console.error('Failed to leave room:', error);
    });

    // Subscription events
    this.socket.on('subscribed', (data) => {
      console.log('Subscribed to events:', data.events);
    });

    this.socket.on('unsubscribed', (data) => {
      console.log('Unsubscribed from events:', data.events);
    });

    this.socket.on('subscribe_error', (error) => {
      console.error('Failed to subscribe to events:', error);
    });

    this.socket.on('unsubscribe_error', (error) => {
      console.error('Failed to unsubscribe from events:', error);
    });

    // Ping/Pong
    this.socket.on('pong', (data) => {
      // Connection is alive
    });

    // Smart contract events
    this.setupSmartContractEventListeners();
  }

  private setupSmartContractEventListeners(): void {
    if (!this.socket) return;

    // UBI Contract events
    this.socket.on('ubi_claim', (event: UbiClaimEvent) => {
      this.emit('ubi_claim', event);
      toast.success(`UBI ${event.type} claimed: ${event.amount} tokens`);
    });

    this.socket.on('ubi_registration', (event: UbiRegistrationEvent) => {
      this.emit('ubi_registration', event);
      toast.success('User registered for UBI');
    });

    // Governance Contract events
    this.socket.on('proposal_created', (event: ProposalCreatedEvent) => {
      this.emit('proposal_created', event);
      toast.info(`New proposal: ${event.title}`);
    });

    this.socket.on('proposal_voted', (event: ProposalVotedEvent) => {
      this.emit('proposal_voted', event);
      toast.info(`Vote cast on proposal ${event.proposalId}`);
    });

    this.socket.on('proposal_executed', (event: ProposalExecutedEvent) => {
      this.emit('proposal_executed', event);
      toast.success(`Proposal ${event.proposalId} executed`);
    });

    this.socket.on('vote_cast', (event: ProposalVotedEvent) => {
      this.emit('vote_cast', event);
    });

    this.socket.on('proposal_update', (event: any) => {
      this.emit('proposal_update', event);
    });

    // Marketplace Contract events
    this.socket.on('marketplace_purchase', (event: MarketplacePurchaseEvent) => {
      this.emit('marketplace_purchase', event);
      toast.success('Marketplace purchase completed');
    });

    // P2P Contract events
    this.socket.on('p2p_trade', (event: P2PTradeEvent) => {
      this.emit('p2p_trade', event);
      toast.success('P2P trade completed');
    });

    // Bridge Contract events
    this.socket.on('bridge_transaction', (event: BridgeTransactionEvent) => {
      this.emit('bridge_transaction', event);
      toast.success(`Bridge transaction: ${event.fromChain} → ${event.toChain}`);
    });

    // Fraud detection events
    this.socket.on('fraud_reported', (event: FraudReportedEvent) => {
      this.emit('fraud_reported', event);
      toast.warning('Fraud report submitted');
    });

    // System events
    this.socket.on('system_alert', (event: SystemAlertEvent) => {
      this.emit('system_alert', event);
      
      switch (event.level) {
        case 'error':
        case 'critical':
          toast.error(event.message);
          break;
        case 'warning':
          toast.error(event.message);
          break;
        case 'info':
          toast(event.message);
          break;
      }
    });

    // User-specific events
    this.socket.on('user_initialized', (event: any) => {
      this.emit('user_initialized', event);
    });
  }

  // Authentication
  public authenticate(userId: string, token?: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot authenticate');
      return;
    }

    this.userId = userId;
    this.socket.emit('authenticate', { userId, token });
  }

  // Room management
  public joinRoom(room: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot join room');
      return;
    }

    this.socket.emit('join_room', { room });
  }

  public leaveRoom(room: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot leave room');
      return;
    }

    this.socket.emit('leave_room', { room });
  }

  // Event subscription
  public subscribe(events: string[]): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot subscribe to events');
      return;
    }

    this.socket.emit('subscribe', { events });
  }

  public unsubscribe(events: string[]): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot unsubscribe from events');
      return;
    }

    this.socket.emit('unsubscribe', { events });
  }

  // Event listener management
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Convenience methods for smart contract events
  public onUbiClaim(callback: (event: UbiClaimEvent) => void): void {
    this.on('ubi_claim', callback);
  }

  public onUbiRegistration(callback: (event: UbiRegistrationEvent) => void): void {
    this.on('ubi_registration', callback);
  }

  public onProposalCreated(callback: (event: ProposalCreatedEvent) => void): void {
    this.on('proposal_created', callback);
  }

  public onProposalVoted(callback: (event: ProposalVotedEvent) => void): void {
    this.on('proposal_voted', callback);
  }

  public onProposalExecuted(callback: (event: ProposalExecutedEvent) => void): void {
    this.on('proposal_executed', callback);
  }

  public onMarketplacePurchase(callback: (event: MarketplacePurchaseEvent) => void): void {
    this.on('marketplace_purchase', callback);
  }

  public onP2PTrade(callback: (event: P2PTradeEvent) => void): void {
    this.on('p2p_trade', callback);
  }

  public onBridgeTransaction(callback: (event: BridgeTransactionEvent) => void): void {
    this.on('bridge_transaction', callback);
  }

  public onFraudReported(callback: (event: FraudReportedEvent) => void): void {
    this.on('fraud_reported', callback);
  }

  public onSystemAlert(callback: (event: SystemAlertEvent) => void): void {
    this.on('system_alert', callback);
  }

  // Health check
  public ping(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  // Status
  public getStatus(): {
    connected: boolean;
    authenticated: boolean;
    userId: string | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Cleanup
  public destroy(): void {
    this.eventListeners.clear();
    this.disconnect();
  }
}

// Singleton instance
export const blockchainWebSocketClient = new BlockchainWebSocketClient();

// Export types
export type {
  WebSocketEvent,
  WebSocketConfig,
  UbiClaimEvent,
  UbiRegistrationEvent,
  ProposalCreatedEvent,
  ProposalVotedEvent,
  ProposalExecutedEvent,
  MarketplacePurchaseEvent,
  P2PTradeEvent,
  BridgeTransactionEvent,
  FraudReportedEvent,
  SystemAlertEvent,
};
