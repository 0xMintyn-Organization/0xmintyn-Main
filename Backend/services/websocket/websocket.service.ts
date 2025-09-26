import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../../utils/logger';
import { redisService, EVENT_CHANNELS } from '../cache/redis.service';

// Types
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  room?: string;
}

export interface ClientInfo {
  id: string;
  userId?: string;
  rooms: Set<string>;
  lastActivity: number;
  isAuthenticated: boolean;
}

export interface RoomInfo {
  name: string;
  clients: Set<string>;
  createdAt: number;
  lastActivity: number;
}

// WebSocket Service Class
export class WebSocketService {
  private io: SocketIOServer;
  private clients: Map<string, ClientInfo> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();
  private isInitialized: boolean = false;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initializeEventHandlers();
    this.initializeRedisSubscriptions();
    this.startHeartbeat();
  }

  private initializeEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      const clientInfo: ClientInfo = {
        id: clientId,
        rooms: new Set(),
        lastActivity: Date.now(),
        isAuthenticated: false,
      };

      this.clients.set(clientId, clientInfo);
      logger.info(`Client connected: ${clientId}`);

      // Authentication
      socket.on('authenticate', (data: { userId: string; token?: string }) => {
        try {
          // In production, verify the token here
          clientInfo.userId = data.userId;
          clientInfo.isAuthenticated = true;
          clientInfo.lastActivity = Date.now();

          // Join user-specific room
          socket.join(`user:${data.userId}`);
          clientInfo.rooms.add(`user:${data.userId}`);

          socket.emit('authenticated', { success: true, userId: data.userId });
          logger.info(`Client ${clientId} authenticated as user ${data.userId}`);
        } catch (error) {
          logger.error(`Authentication failed for client ${clientId}:`, error);
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      // Join room
      socket.on('join_room', (data: { room: string }) => {
        try {
          const roomName = data.room;
          socket.join(roomName);
          clientInfo.rooms.add(roomName);
          clientInfo.lastActivity = Date.now();

          // Update room info
          if (!this.rooms.has(roomName)) {
            this.rooms.set(roomName, {
              name: roomName,
              clients: new Set(),
              createdAt: Date.now(),
              lastActivity: Date.now(),
            });
          }
          
          const roomInfo = this.rooms.get(roomName)!;
          roomInfo.clients.add(clientId);
          roomInfo.lastActivity = Date.now();

          socket.emit('joined_room', { room: roomName });
          logger.info(`Client ${clientId} joined room ${roomName}`);
        } catch (error) {
          logger.error(`Failed to join room for client ${clientId}:`, error);
          socket.emit('join_room_error', { error: 'Failed to join room' });
        }
      });

      // Leave room
      socket.on('leave_room', (data: { room: string }) => {
        try {
          const roomName = data.room;
          socket.leave(roomName);
          clientInfo.rooms.delete(roomName);
          clientInfo.lastActivity = Date.now();

          // Update room info
          const roomInfo = this.rooms.get(roomName);
          if (roomInfo) {
            roomInfo.clients.delete(clientId);
            roomInfo.lastActivity = Date.now();
            
            // Remove room if empty
            if (roomInfo.clients.size === 0) {
              this.rooms.delete(roomName);
            }
          }

          socket.emit('left_room', { room: roomName });
          logger.info(`Client ${clientId} left room ${roomName}`);
        } catch (error) {
          logger.error(`Failed to leave room for client ${clientId}:`, error);
          socket.emit('leave_room_error', { error: 'Failed to leave room' });
        }
      });

      // Subscribe to specific events
      socket.on('subscribe', (data: { events: string[] }) => {
        try {
          data.events.forEach(eventType => {
            socket.join(`event:${eventType}`);
            clientInfo.rooms.add(`event:${eventType}`);
          });
          clientInfo.lastActivity = Date.now();

          socket.emit('subscribed', { events: data.events });
          logger.info(`Client ${clientId} subscribed to events: ${data.events.join(', ')}`);
        } catch (error) {
          logger.error(`Failed to subscribe client ${clientId} to events:`, error);
          socket.emit('subscribe_error', { error: 'Failed to subscribe to events' });
        }
      });

      // Unsubscribe from events
      socket.on('unsubscribe', (data: { events: string[] }) => {
        try {
          data.events.forEach(eventType => {
            socket.leave(`event:${eventType}`);
            clientInfo.rooms.delete(`event:${eventType}`);
          });
          clientInfo.lastActivity = Date.now();

          socket.emit('unsubscribed', { events: data.events });
          logger.info(`Client ${clientId} unsubscribed from events: ${data.events.join(', ')}`);
        } catch (error) {
          logger.error(`Failed to unsubscribe client ${clientId} from events:`, error);
          socket.emit('unsubscribe_error', { error: 'Failed to unsubscribe from events' });
        }
      });

      // Ping/Pong for connection health
      socket.on('ping', () => {
        clientInfo.lastActivity = Date.now();
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        logger.info(`Client ${clientId} disconnected: ${reason}`);
        this.handleDisconnect(clientId);
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error(`Socket error for client ${clientId}:`, error);
      });
    });

    this.isInitialized = true;
    logger.info('WebSocket service initialized successfully');
  }

  private initializeRedisSubscriptions(): void {
    // Subscribe to Redis event channels
    Object.values(EVENT_CHANNELS).forEach(channel => {
      redisService.subscribe(channel, (message) => {
        this.broadcastEvent(channel, message);
      });
    });

    logger.info('Redis subscriptions initialized');
  }

  private handleDisconnect(clientId: string): void {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;

    // Remove client from all rooms
    clientInfo.rooms.forEach(roomName => {
      const roomInfo = this.rooms.get(roomName);
      if (roomInfo) {
        roomInfo.clients.delete(clientId);
        roomInfo.lastActivity = Date.now();
        
        // Remove room if empty
        if (roomInfo.clients.size === 0) {
          this.rooms.delete(roomName);
        }
      }
    });

    // Remove client
    this.clients.delete(clientId);
  }

  private startHeartbeat(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes

      // Remove inactive clients
      for (const [clientId, clientInfo] of this.clients.entries()) {
        if (now - clientInfo.lastActivity > timeout) {
          logger.info(`Removing inactive client: ${clientId}`);
          this.handleDisconnect(clientId);
          this.io.sockets.sockets.get(clientId)?.disconnect(true);
        }
      }

      // Clean up empty rooms
      for (const [roomName, roomInfo] of this.rooms.entries()) {
        if (roomInfo.clients.size === 0) {
          this.rooms.delete(roomName);
        }
      }
    }, 60000); // Check every minute
  }

  // Public methods for broadcasting events

  public broadcastToRoom(room: string, event: string, data: any): void {
    try {
      this.io.to(room).emit(event, {
        type: event,
        data,
        timestamp: Date.now(),
      });
      logger.debug(`Broadcasted event ${event} to room ${room}`);
    } catch (error) {
      logger.error(`Failed to broadcast to room ${room}:`, error);
    }
  }

  public broadcastToUser(userId: string, event: string, data: any): void {
    try {
      this.io.to(`user:${userId}`).emit(event, {
        type: event,
        data,
        timestamp: Date.now(),
        userId,
      });
      logger.debug(`Broadcasted event ${event} to user ${userId}`);
    } catch (error) {
      logger.error(`Failed to broadcast to user ${userId}:`, error);
    }
  }

  public broadcastToEvent(eventType: string, data: any): void {
    try {
      this.io.to(`event:${eventType}`).emit(eventType, {
        type: eventType,
        data,
        timestamp: Date.now(),
      });
      logger.debug(`Broadcasted event ${eventType} to subscribers`);
    } catch (error) {
      logger.error(`Failed to broadcast event ${eventType}:`, error);
    }
  }

  public broadcastEvent(channel: string, data: any): void {
    try {
      // Map Redis channels to WebSocket events
      const eventMap: Record<string, string> = {
        [EVENT_CHANNELS.UBI_CLAIM]: 'ubi_claim',
        [EVENT_CHANNELS.UBI_REGISTRATION]: 'ubi_registration',
        [EVENT_CHANNELS.PROPOSAL_CREATED]: 'proposal_created',
        [EVENT_CHANNELS.PROPOSAL_VOTED]: 'proposal_voted',
        [EVENT_CHANNELS.PROPOSAL_EXECUTED]: 'proposal_executed',
        [EVENT_CHANNELS.MARKETPLACE_PURCHASE]: 'marketplace_purchase',
        [EVENT_CHANNELS.P2P_TRADE]: 'p2p_trade',
        [EVENT_CHANNELS.BRIDGE_TRANSACTION]: 'bridge_transaction',
        [EVENT_CHANNELS.FRAUD_REPORTED]: 'fraud_reported',
        [EVENT_CHANNELS.SYSTEM_ALERT]: 'system_alert',
      };

      const eventType = eventMap[channel] || channel;
      this.broadcastToEvent(eventType, data);
    } catch (error) {
      logger.error(`Failed to broadcast event from channel ${channel}:`, error);
    }
  }

  public broadcastToAll(event: string, data: any): void {
    try {
      this.io.emit(event, {
        type: event,
        data,
        timestamp: Date.now(),
      });
      logger.debug(`Broadcasted event ${event} to all clients`);
    } catch (error) {
      logger.error(`Failed to broadcast to all clients:`, error);
    }
  }

  // Specific event broadcasters

  public broadcastUbiClaim(userId: string, amount: string, type: string): void {
    this.broadcastToUser(userId, 'ubi_claim', {
      userId,
      amount,
      type,
      timestamp: Date.now(),
    });
  }

  public broadcastProposalUpdate(proposalId: string, update: any): void {
    this.broadcastToEvent('proposal_update', {
      proposalId,
      update,
      timestamp: Date.now(),
    });
  }

  public broadcastVoteCast(proposalId: string, voter: string, voteType: string): void {
    this.broadcastToEvent('vote_cast', {
      proposalId,
      voter,
      voteType,
      timestamp: Date.now(),
    });
  }

  public broadcastSystemAlert(level: string, message: string, data?: any): void {
    this.broadcastToAll('system_alert', {
      level,
      message,
      data,
      timestamp: Date.now(),
    });
  }

  // Statistics and monitoring

  public getStats(): {
    connectedClients: number;
    authenticatedClients: number;
    activeRooms: number;
    totalRooms: number;
    uptime: number;
  } {
    const connectedClients = this.clients.size;
    const authenticatedClients = Array.from(this.clients.values()).filter(c => c.isAuthenticated).length;
    const activeRooms = Array.from(this.rooms.values()).filter(r => r.clients.size > 0).length;
    const totalRooms = this.rooms.size;

    return {
      connectedClients,
      authenticatedClients,
      activeRooms,
      totalRooms,
      uptime: process.uptime(),
    };
  }

  public getClientInfo(clientId: string): ClientInfo | null {
    return this.clients.get(clientId) || null;
  }

  public getRoomInfo(roomName: string): RoomInfo | null {
    return this.rooms.get(roomName) || null;
  }

  public getAllRooms(): RoomInfo[] {
    return Array.from(this.rooms.values());
  }

  public getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values());
  }

  // Health check
  public healthCheck(): boolean {
    return this.isInitialized && this.io.engine.clientsCount >= 0;
  }

  // Cleanup
  public disconnect(): void {
    try {
      this.io.close();
      this.clients.clear();
      this.rooms.clear();
      this.isInitialized = false;
      logger.info('WebSocket service disconnected');
    } catch (error) {
      logger.error('Failed to disconnect WebSocket service:', error);
    }
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
