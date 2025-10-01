import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getEventService } from '../eventService';
import { logger } from '../../utils/logger';

export interface WebSocketClient {
  id: string;
  socket: Socket;
  walletAddress?: string;
  subscribedEvents: string[];
  connectedAt: number;
}

export interface WebSocketStats {
  connectedClients: number;
  activeRooms: number;
  totalConnections: number;
  totalDisconnections: number;
  eventsBroadcasted: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private clients = new Map<string, WebSocketClient>();
  private rooms = new Map<string, Set<string>>();
  private eventService = getEventService();
  private stats: WebSocketStats;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'https://app.0xmintyn.com',
          'https://advanced-lms-client.vercel.app'
        ],
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.stats = {
      connectedClients: 0,
      activeRooms: 0,
      totalConnections: 0,
      totalDisconnections: 0,
      eventsBroadcasted: 0
    };

    this.setupEventHandlers();
    this.setupEventServiceIntegration();
    logger.info('WebSocket Service initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket): void {
    const clientId = socket.id;
    const client: WebSocketClient = {
      id: clientId,
      socket,
      subscribedEvents: [],
      connectedAt: Date.now()
    };

    this.clients.set(clientId, client);
    this.stats.connectedClients++;
    this.stats.totalConnections++;

    logger.info(`Client connected: ${clientId}`);

    // Handle client events
    socket.on('subscribe_wallet', (data) => {
      this.handleWalletSubscription(client, data);
    });

    socket.on('subscribe_events', (data) => {
      this.handleEventSubscription(client, data);
    });

    socket.on('unsubscribe_events', (data) => {
      this.handleEventUnsubscription(client, data);
    });

    socket.on('get_event_history', (data) => {
      this.handleGetEventHistory(client, data);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      this.handleDisconnection(client);
    });

    // Send welcome message
    socket.emit('connected', {
      clientId,
      timestamp: Date.now(),
      availableEvents: [
        'GOVERNANCE_VOTE_CAST',
        'GOVERNANCE_PROPOSAL_CREATED',
        'UBI_CLAIMED',
        'COUNTER_INCREMENTED',
        'COUNTER_DECREMENTED',
        'SPL_TOKEN_TRANSFERRED',
        'SOL_BALANCE_CHANGE',
        'TOKEN_BALANCE_CHANGE'
      ]
    });
  }

  private handleWalletSubscription(client: WebSocketClient, data: { walletAddress: string }): void {
    if (!data.walletAddress) {
      client.socket.emit('error', { message: 'Wallet address is required' });
      return;
    }

    client.walletAddress = data.walletAddress;
    
    // Join wallet-specific room
    const roomName = `wallet:${data.walletAddress}`;
    client.socket.join(roomName);
    
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(client.id);
    this.stats.activeRooms = this.rooms.size;

    logger.info(`Client ${client.id} subscribed to wallet ${data.walletAddress}`);
    
    client.socket.emit('wallet_subscribed', {
      walletAddress: data.walletAddress,
      roomName,
      timestamp: Date.now()
    });
  }

  private handleEventSubscription(client: WebSocketClient, data: { eventTypes: string[] }): void {
    if (!data.eventTypes || !Array.isArray(data.eventTypes)) {
      client.socket.emit('error', { message: 'Event types array is required' });
      return;
    }

    client.subscribedEvents = [...new Set([...client.subscribedEvents, ...data.eventTypes])];
    
    // Join event-specific rooms
    data.eventTypes.forEach(eventType => {
      const roomName = `event:${eventType}`;
      client.socket.join(roomName);
      
      if (!this.rooms.has(roomName)) {
        this.rooms.set(roomName, new Set());
      }
      this.rooms.get(roomName)!.add(client.id);
    });

    this.stats.activeRooms = this.rooms.size;

    logger.info(`Client ${client.id} subscribed to events: ${data.eventTypes.join(', ')}`);
    
    client.socket.emit('events_subscribed', {
      eventTypes: data.eventTypes,
      allSubscribedEvents: client.subscribedEvents,
      timestamp: Date.now()
    });
  }

  private handleEventUnsubscription(client: WebSocketClient, data: { eventTypes: string[] }): void {
    if (!data.eventTypes || !Array.isArray(data.eventTypes)) {
      client.socket.emit('error', { message: 'Event types array is required' });
      return;
    }

    // Remove from subscribed events
    client.subscribedEvents = client.subscribedEvents.filter(
      event => !data.eventTypes.includes(event)
    );
    
    // Leave event-specific rooms
    data.eventTypes.forEach(eventType => {
      const roomName = `event:${eventType}`;
      client.socket.leave(roomName);
      
      if (this.rooms.has(roomName)) {
        this.rooms.get(roomName)!.delete(client.id);
        if (this.rooms.get(roomName)!.size === 0) {
          this.rooms.delete(roomName);
        }
      }
    });

    this.stats.activeRooms = this.rooms.size;

    logger.info(`Client ${client.id} unsubscribed from events: ${data.eventTypes.join(', ')}`);
    
    client.socket.emit('events_unsubscribed', {
      eventTypes: data.eventTypes,
      remainingSubscribedEvents: client.subscribedEvents,
      timestamp: Date.now()
    });
  }

  private handleGetEventHistory(client: WebSocketClient, data: {
    walletAddress?: string;
    eventTypes?: string[];
    limit?: number;
  }): void {
    try {
      const eventHistory = this.eventService.getEventHistory({
        walletAddress: data.walletAddress,
        eventTypes: data.eventTypes as any,
        limit: data.limit
      });

      client.socket.emit('event_history', {
        events: eventHistory,
        total: eventHistory.length,
        filters: data,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Failed to get event history:', error);
      client.socket.emit('error', { message: 'Failed to get event history' });
    }
  }

  private handleDisconnection(client: WebSocketClient): void {
    // Remove from all rooms
    this.rooms.forEach((clients, roomName) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.rooms.delete(roomName);
      }
    });

    this.clients.delete(client.id);
    this.stats.connectedClients--;
    this.stats.totalDisconnections++;
    this.stats.activeRooms = this.rooms.size;

    logger.info(`Client disconnected: ${client.id}`);
  }

  private setupEventServiceIntegration(): void {
    // Listen to events from the event service
    this.eventService.on('event', (event) => {
      this.broadcastEvent(event);
    });
  }

  // Broadcast event to relevant clients
  private broadcastEvent(event: any): void {
    try {
      // Broadcast to event-specific room
      const eventRoom = `event:${event.type}`;
      this.io.to(eventRoom).emit('blockchain_event', {
        event,
        timestamp: Date.now()
      });

      // Broadcast to wallet-specific room if applicable
      if (event.data && this.isEventRelevantToWallet(event)) {
        const walletAddress = this.extractWalletAddress(event);
        if (walletAddress) {
          const walletRoom = `wallet:${walletAddress}`;
          this.io.to(walletRoom).emit('blockchain_event', {
            event,
            timestamp: Date.now()
          });
        }
      }

      this.stats.eventsBroadcasted++;
    } catch (error) {
      logger.error('Failed to broadcast event:', error);
    }
  }

  // Check if event is relevant to any wallet
  private isEventRelevantToWallet(event: any): boolean {
    const data = event.data;
    return !!(
      data.voter ||
      data.claimer ||
      data.sender ||
      data.recipient ||
      data.authority ||
      data.from ||
      data.to
    );
  }

  // Extract wallet address from event
  private extractWalletAddress(event: any): string | null {
    const data = event.data;
    return data.voter || data.claimer || data.sender || data.recipient || data.authority || data.from || data.to || null;
  }

  // Public methods for external use

  // Broadcast to specific event type
  broadcastToEvent(eventType: string, data: any): void {
    const eventRoom = `event:${eventType}`;
    this.io.to(eventRoom).emit('blockchain_event', {
      type: eventType,
      data,
      timestamp: Date.now()
    });
    this.stats.eventsBroadcasted++;
  }

  // Broadcast UBI claim
  broadcastUbiClaim(user: string, amount: number, type: 'initial' | 'monthly'): void {
    this.broadcastToEvent('UBI_CLAIMED', {
      user,
      amount,
      type,
      timestamp: Date.now()
    });
  }

  // Broadcast vote cast
  broadcastVoteCast(proposal: string, voter: string, voteType: boolean): void {
    this.broadcastToEvent('GOVERNANCE_VOTE_CAST', {
      proposal,
      voter,
      voteType,
      timestamp: Date.now()
    });
  }

  // Broadcast to specific wallet
  broadcastToWallet(walletAddress: string, eventType: string, data: any): void {
    const walletRoom = `wallet:${walletAddress}`;
    this.io.to(walletRoom).emit('blockchain_event', {
      type: eventType,
      data,
      timestamp: Date.now()
    });
    this.stats.eventsBroadcasted++;
  }

  // Get statistics
  getStats(): WebSocketStats {
    return { ...this.stats };
  }

  // Get connected clients
  getConnectedClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  // Get active rooms
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  // Health check
  healthCheck(): {
    healthy: boolean;
    stats: WebSocketStats;
    connectedClients: number;
    activeRooms: number;
  } {
    return {
      healthy: true,
      stats: this.getStats(),
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size
    };
  }

  // Disconnect all clients
  disconnect(): void {
    this.io.disconnectSockets();
    this.clients.clear();
    this.rooms.clear();
    this.stats.connectedClients = 0;
    this.stats.activeRooms = 0;
    logger.info('WebSocket Service disconnected all clients');
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export const initializeWebSocketService = (httpServer: HTTPServer): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService(httpServer);
  }
  return webSocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return webSocketService;
};

export default WebSocketService;