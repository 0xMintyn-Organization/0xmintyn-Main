import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Event types
export interface NotificationEvent {
  type: 'ubi_claim' | 'fraud_alert' | 'verification_update' | 'treasury_update' | 'marketplace_update' | 'governance_update' | 'bridge_update';
  data: any;
  timestamp: number;
  userId?: string;
}

export interface AdminAlert {
  type: 'fraud_report' | 'system_warning' | 'treasury_low' | 'user_verification_needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  timestamp: number;
}

export interface MarketplaceUpdate {
  type: 'new_listing' | 'sale_completed' | 'listing_updated' | 'listing_removed';
  listingId: string;
  data: any;
  timestamp: number;
}

export interface GovernanceUpdate {
  type: 'proposal_created' | 'vote_cast' | 'proposal_executed' | 'proposal_cancelled';
  proposalId: string;
  data: any;
  timestamp: number;
}

export interface ExchangeUpdate {
  type: 'order_placed' | 'order_filled' | 'order_cancelled' | 'trade_executed';
  orderId?: string;
  tradeId?: string;
  data: any;
  timestamp: number;
}

export interface BridgeUpdate {
  type: 'bridge_initiated' | 'bridge_completed' | 'bridge_failed' | 'bridge_status_update';
  transactionId: string;
  data: any;
  timestamp: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      toast.success('Connected to real-time updates');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't try to reconnect
        return;
      }
      
      toast.error('Lost connection to real-time updates');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to real-time updates');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      toast.success('Reconnected to real-time updates');
    });

    // Set up event channel listeners
    this.setupChannelListeners();
  }

  private setupChannelListeners() {
    if (!this.socket) return;

    // Notifications channel
    this.socket.on('mintyn:events:notifications', (event: NotificationEvent) => {
      this.handleNotification(event);
      this.emit('notification', event);
    });

    // Admin alerts channel
    this.socket.on('mintyn:events:admin_alerts', (alert: AdminAlert) => {
      this.handleAdminAlert(alert);
      this.emit('admin_alert', alert);
    });

    // Marketplace updates channel
    this.socket.on('mintyn:events:marketplace_updates', (update: MarketplaceUpdate) => {
      this.handleMarketplaceUpdate(update);
      this.emit('marketplace_update', update);
    });

    // Governance updates channel
    this.socket.on('mintyn:events:governance_updates', (update: GovernanceUpdate) => {
      this.handleGovernanceUpdate(update);
      this.emit('governance_update', update);
    });

    // Exchange updates channel
    this.socket.on('mintyn:events:exchange_updates', (update: ExchangeUpdate) => {
      this.handleExchangeUpdate(update);
      this.emit('exchange_update', update);
    });

    // Bridge updates channel
    this.socket.on('mintyn:events:bridge_updates', (update: BridgeUpdate) => {
      this.handleBridgeUpdate(update);
      this.emit('bridge_update', update);
    });
  }

  private handleNotification(event: NotificationEvent) {
    switch (event.type) {
      case 'ubi_claim':
        toast.success(`UBI claim successful: ${event.data.amount} tokens`);
        break;
      case 'fraud_alert':
        toast.error(`Fraud alert: ${event.data.reason}`);
        break;
      case 'verification_update':
        toast.info(`Verification status updated`);
        break;
      case 'treasury_update':
        toast.info(`Treasury updated: ${event.data.action}`);
        break;
      default:
        console.log('Unknown notification type:', event.type);
    }
  }

  private handleAdminAlert(alert: AdminAlert) {
    const severityColors = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'error'
    };

    switch (alert.type) {
      case 'fraud_report':
        toast.error(`New fraud report: ${alert.data.reason}`);
        break;
      case 'system_warning':
        toast.error(`System warning: ${alert.data.message}`);
        break;
      case 'treasury_low':
        toast.error(`Treasury balance low: ${alert.data.balance} tokens remaining`);
        break;
      case 'user_verification_needed':
        toast.info(`User verification needed: ${alert.data.userId}`);
        break;
      default:
        console.log('Unknown admin alert type:', alert.type);
    }
  }

  private handleMarketplaceUpdate(update: MarketplaceUpdate) {
    switch (update.type) {
      case 'new_listing':
        toast.success(`New product listed: ${update.data.title}`);
        break;
      case 'sale_completed':
        toast.success(`Sale completed: ${update.data.title}`);
        break;
      case 'listing_updated':
        toast.info(`Product updated: ${update.data.title}`);
        break;
      case 'listing_removed':
        toast.info(`Product removed: ${update.data.title}`);
        break;
      default:
        console.log('Unknown marketplace update type:', update.type);
    }
  }

  private handleGovernanceUpdate(update: GovernanceUpdate) {
    switch (update.type) {
      case 'proposal_created':
        toast.info(`New proposal: ${update.data.title}`);
        break;
      case 'vote_cast':
        toast.info(`Vote cast on proposal: ${update.data.proposalTitle}`);
        break;
      case 'proposal_executed':
        toast.success(`Proposal executed: ${update.data.title}`);
        break;
      case 'proposal_cancelled':
        toast.info(`Proposal cancelled: ${update.data.title}`);
        break;
      default:
        console.log('Unknown governance update type:', update.type);
    }
  }

  private handleExchangeUpdate(update: ExchangeUpdate) {
    switch (update.type) {
      case 'order_placed':
        toast.info(`Order placed: ${update.data.type} ${update.data.amount}`);
        break;
      case 'order_filled':
        toast.success(`Order filled: ${update.data.amount}`);
        break;
      case 'order_cancelled':
        toast.info(`Order cancelled`);
        break;
      case 'trade_executed':
        toast.success(`Trade executed: ${update.data.amount}`);
        break;
      default:
        console.log('Unknown exchange update type:', update.type);
    }
  }

  private handleBridgeUpdate(update: BridgeUpdate) {
    switch (update.type) {
      case 'bridge_initiated':
        toast.info(`Bridge transfer initiated: ${update.data.amount}`);
        break;
      case 'bridge_completed':
        toast.success(`Bridge transfer completed: ${update.data.amount}`);
        break;
      case 'bridge_failed':
        toast.error(`Bridge transfer failed: ${update.data.reason}`);
        break;
      case 'bridge_status_update':
        toast.info(`Bridge status: ${update.data.status}`);
        break;
      default:
        console.log('Unknown bridge update type:', update.type);
    }
  }

  // Public methods
  public subscribe(channel: string, callback: Function) {
    if (!this.eventListeners.has(channel)) {
      this.eventListeners.set(channel, new Set());
    }
    this.eventListeners.get(channel)!.add(callback);

    // Join the channel if connected
    if (this.isConnected && this.socket) {
      this.socket.emit('join', channel);
    }
  }

  public unsubscribe(channel: string, callback?: Function) {
    if (callback) {
      this.eventListeners.get(channel)?.delete(callback);
    } else {
      this.eventListeners.delete(channel);
    }

    // Leave the channel if connected
    if (this.isConnected && this.socket) {
      this.socket.emit('leave', channel);
    }
  }

  public joinUserChannel(userId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit('join', `user:${userId}`);
    }
  }

  public leaveUserChannel(userId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit('leave', `user:${userId}`);
    }
  }

  public joinAdminChannel() {
    if (this.isConnected && this.socket) {
      this.socket.emit('join', 'admin');
    }
  }

  public leaveAdminChannel() {
    if (this.isConnected && this.socket) {
      this.socket.emit('leave', 'admin');
    }
  }

  private emit(eventName: string, data: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
