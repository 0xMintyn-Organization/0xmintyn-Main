import { Connection, PublicKey } from '@solana/web3.js';
import { getConnectionPool } from './solana/connection';
import { getBlockchainService } from './blockchain.service';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface BlockchainEvent {
  id: string;
  type: EventType;
  data: any;
  signature: string;
  slot: number;
  timestamp: number;
  program: string;
}

export type EventType = 
  | 'GOVERNANCE_VOTE_CAST'
  | 'GOVERNANCE_PROPOSAL_CREATED'
  | 'GOVERNANCE_PROPOSAL_EXECUTED'
  | 'UBI_CLAIMED'
  | 'UBI_DISTRIBUTED'
  | 'COUNTER_INCREMENTED'
  | 'COUNTER_DECREMENTED'
  | 'SPL_TOKEN_TRANSFERRED'
  | 'SOL_BALANCE_CHANGE'
  | 'TOKEN_BALANCE_CHANGE'
  | 'TRANSACTION_CONFIRMED'
  | 'TRANSACTION_FAILED';

export interface EventSubscription {
  id: string;
  eventTypes: EventType[];
  walletAddress?: string;
  callback: (event: BlockchainEvent) => void;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByProgram: Record<string, number>;
  lastEventTime: number;
  activeSubscriptions: number;
}

export class EventService extends EventEmitter {
  private connectionPool = getConnectionPool();
  private blockchainService = getBlockchainService();
  private eventSubscriptions = new Map<string, EventSubscription>();
  private clientConnections = new Set<WebSocket>();
  private programIds: Record<string, PublicKey>;
  private eventHistory: BlockchainEvent[] = [];
  private maxHistorySize = 1000;
  private stats: EventStats;

  constructor() {
    super();
    
    this.programIds = {
      governance: new PublicKey(process.env.GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111'),
      ubi: new PublicKey(process.env.UBI_PROGRAM_ID || '11111111111111111111111111111111'),
      counter: new PublicKey(process.env.COUNTER_PROGRAM_ID || 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS'),
      splToken: new PublicKey(process.env.SPL_TOKEN_PROGRAM_ID || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    };

    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<EventType, number>,
      eventsByProgram: {} as Record<string, number>,
      lastEventTime: 0,
      activeSubscriptions: 0,
    };

    this.setupProgramListeners();
    logger.info('Event Service initialized');
  }

  // Setup listeners for all programs
  private setupProgramListeners(): void {
    Object.entries(this.programIds).forEach(([programName, programId]) => {
      this.subscribeToProgram(programName, programId);
    });
  }

  // Program-specific event subscription
  private async subscribeToProgram(programName: string, programId: PublicKey): Promise<void> {
    try {
      const connection = this.connectionPool.getConnection();
      
      const subscriptionId = connection.onLogs(
        programId,
        (logs, context) => {
          this.handleProgramLogs(programName, logs, context);
        },
        'confirmed'
      );

      logger.info(`Subscribed to ${programName} program events (ID: ${subscriptionId})`);
    } catch (error) {
      logger.error(`Failed to subscribe to ${programName}:`, error);
    }
  }

  // Parse and broadcast program events
  private handleProgramLogs(programName: string, logs: any, context: any): void {
    try {
      const events = this.parseLogsForEvents(logs.logs, programName);
      
      events.forEach(event => {
        // Enrich event with context
        const enrichedEvent: BlockchainEvent = {
          ...event,
          program: programName,
          signature: logs.signature,
          slot: context.slot,
          timestamp: Date.now()
        };

        // Store event in history
        this.storeEvent(enrichedEvent);

        // Broadcast to connected clients
        this.broadcastEvent(enrichedEvent);

        // Trigger specific handlers
        this.handleSpecificEvent(enrichedEvent);
      });
    } catch (error) {
      logger.error('Event handling failed:', error);
    }
  }

  // Event parsing by program type
  private parseLogsForEvents(logs: string[], programName: string): Partial<BlockchainEvent>[] {
    const events: Partial<BlockchainEvent>[] = [];

    logs.forEach(log => {
      try {
        switch (programName) {
          case 'governance':
            const govEvents = this.parseGovernanceEvents(log);
            events.push(...govEvents);
            break;
          
          case 'ubi':
            const ubiEvents = this.parseUBIEvents(log);
            events.push(...ubiEvents);
            break;
          
          case 'counter':
            const counterEvents = this.parseCounterEvents(log);
            events.push(...counterEvents);
            break;
          
          case 'splToken':
            const tokenEvents = this.parseTokenEvents(log);
            events.push(...tokenEvents);
            break;
        }
      } catch (error) {
        logger.warn(`Failed to parse ${programName} event:`, error);
      }
    });

    return events;
  }

  // Governance event parsing
  private parseGovernanceEvents(log: string): Partial<BlockchainEvent>[] {
    const events: Partial<BlockchainEvent>[] = [];
    
    if (log.includes('VoteCast')) {
      const voteData = this.extractEventData(log, 'VoteCast');
      events.push({
        type: 'GOVERNANCE_VOTE_CAST',
        data: {
          proposalId: voteData.proposalId,
          voter: voteData.voter,
          vote: voteData.vote,
          votingPower: voteData.votingPower
        }
      });
    }
    
    if (log.includes('ProposalCreated')) {
      const proposalData = this.extractEventData(log, 'ProposalCreated');
      events.push({
        type: 'GOVERNANCE_PROPOSAL_CREATED',
        data: proposalData
      });
    }

    if (log.includes('ProposalExecuted')) {
      const executionData = this.extractEventData(log, 'ProposalExecuted');
      events.push({
        type: 'GOVERNANCE_PROPOSAL_EXECUTED',
        data: executionData
      });
    }

    return events;
  }

  // UBI event parsing
  private parseUBIEvents(log: string): Partial<BlockchainEvent>[] {
    const events: Partial<BlockchainEvent>[] = [];
    
    if (log.includes('UBIClaimed')) {
      const claimData = this.extractEventData(log, 'UBIClaimed');
      events.push({
        type: 'UBI_CLAIMED',
        data: {
          claimer: claimData.claimer,
          amount: claimData.amount,
          newBalance: claimData.newBalance
        }
      });
    }
    
    if (log.includes('UBIDistributed')) {
      const distributionData = this.extractEventData(log, 'UBIDistributed');
      events.push({
        type: 'UBI_DISTRIBUTED',
        data: distributionData
      });
    }

    return events;
  }

  // Counter event parsing
  private parseCounterEvents(log: string): Partial<BlockchainEvent>[] {
    const events: Partial<BlockchainEvent>[] = [];
    
    if (log.includes('CounterIncremented')) {
      const incrementData = this.extractEventData(log, 'CounterIncremented');
      events.push({
        type: 'COUNTER_INCREMENTED',
        data: {
          newValue: incrementData.newValue,
          timestamp: incrementData.timestamp
        }
      });
    }
    
    if (log.includes('CounterDecremented')) {
      const decrementData = this.extractEventData(log, 'CounterDecremented');
      events.push({
        type: 'COUNTER_DECREMENTED',
        data: decrementData
      });
    }

    return events;
  }

  // Token event parsing
  private parseTokenEvents(log: string): Partial<BlockchainEvent>[] {
    const events: Partial<BlockchainEvent>[] = [];
    
    if (log.includes('Transfer')) {
      const transferData = this.extractEventData(log, 'Transfer');
      events.push({
        type: 'SPL_TOKEN_TRANSFERRED',
        data: {
          from: transferData.from,
          to: transferData.to,
          amount: transferData.amount,
          mint: transferData.mint
        }
      });
    }

    return events;
  }

  // Extract event data from log (simplified implementation)
  private extractEventData(log: string, eventType: string): any {
    // This is a simplified implementation
    // In production, you would parse the actual log data structure
    try {
      const jsonMatch = log.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn(`Failed to parse event data for ${eventType}:`, error);
    }
    
    return {};
  }

  // Store event in history
  private storeEvent(event: BlockchainEvent): void {
    this.eventHistory.unshift(event);
    
    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }

    // Update stats
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;
    this.stats.eventsByProgram[event.program] = (this.stats.eventsByProgram[event.program] || 0) + 1;
    this.stats.lastEventTime = event.timestamp;
  }

  // Real-time event broadcasting
  private broadcastEvent(event: BlockchainEvent): void {
    const message = JSON.stringify({
      type: 'BLOCKCHAIN_EVENT',
      event: event,
      timestamp: Date.now()
    });

    // Broadcast to all connected WebSocket clients
    this.clientConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          logger.error('Failed to broadcast to client:', error);
          this.clientConnections.delete(client);
        }
      }
    });

    // Emit event for internal listeners
    this.emit('event', event);
  }

  // Specific event handlers
  private handleSpecificEvent(event: BlockchainEvent): void {
    switch (event.type) {
      case 'GOVERNANCE_VOTE_CAST':
        this.updateGovernanceStats(event.data);
        this.notifyGovernanceParticipants(event.data);
        break;
      
      case 'UBI_CLAIMED':
        this.updateUBIStats(event.data);
        this.trackUserActivity(event.data.claimer, 'ubi_claim');
        break;
      
      case 'COUNTER_INCREMENTED':
      case 'COUNTER_DECREMENTED':
        this.updateCounterCache(event.data);
        break;
      
      case 'SPL_TOKEN_TRANSFERRED':
        this.updateTokenBalanceCache(event.data);
        this.trackTransferActivity(event.data);
        break;
    }
  }

  // Update governance statistics
  private updateGovernanceStats(data: any): void {
    // Update governance statistics in cache/database
    logger.info('Updating governance stats:', data);
  }

  // Notify governance participants
  private notifyGovernanceParticipants(data: any): void {
    // Notify relevant participants about the vote
    logger.info('Notifying governance participants:', data);
  }

  // Update UBI statistics
  private updateUBIStats(data: any): void {
    // Update UBI statistics in cache/database
    logger.info('Updating UBI stats:', data);
  }

  // Track user activity
  private trackUserActivity(user: string, activity: string): void {
    // Track user activity for analytics
    logger.info(`User activity: ${user} - ${activity}`);
  }

  // Update counter cache
  private updateCounterCache(data: any): void {
    // Update counter cache
    logger.info('Updating counter cache:', data);
  }

  // Update token balance cache
  private updateTokenBalanceCache(data: any): void {
    // Update token balance cache
    logger.info('Updating token balance cache:', data);
  }

  // Track transfer activity
  private trackTransferActivity(data: any): void {
    // Track transfer activity for analytics
    logger.info('Transfer activity:', data);
  }

  // WebSocket client management
  addClient(ws: WebSocket, clientInfo: any = {}): void {
    this.clientConnections.add(ws);
    this.stats.activeSubscriptions = this.clientConnections.size;
    
    ws.on('close', () => {
      this.clientConnections.delete(ws);
      this.stats.activeSubscriptions = this.clientConnections.size;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleClientMessage(ws, data);
      } catch (error) {
        logger.error('Invalid client message:', error);
      }
    });

    // Send welcome message with current stats
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      stats: this.getCurrentStats(),
      timestamp: Date.now()
    }));
  }

  // Client message handling
  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'SUBSCRIBE_TO_EVENTS':
        this.subscribeClientToEvents(ws, message.eventTypes, message.walletAddress);
        break;
      
      case 'GET_EVENT_HISTORY':
        this.sendEventHistory(ws, message.filters);
        break;
      
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;
    }
  }

  // Subscribe client to specific events
  private subscribeClientToEvents(ws: WebSocket, eventTypes: EventType[], walletAddress?: string): void {
    const subscription: EventSubscription = {
      id: `client_${Date.now()}_${Math.random()}`,
      eventTypes,
      walletAddress,
      callback: (event) => {
        // Only send events that match the subscription
        if (eventTypes.includes(event.type)) {
          if (!walletAddress || this.isEventRelevantToWallet(event, walletAddress)) {
            ws.send(JSON.stringify({
              type: 'BLOCKCHAIN_EVENT',
              event,
              timestamp: Date.now()
            }));
          }
        }
      }
    };

    this.eventSubscriptions.set(subscription.id, subscription);
    
    ws.send(JSON.stringify({
      type: 'SUBSCRIPTION_CREATED',
      subscriptionId: subscription.id,
      eventTypes,
      walletAddress
    }));
  }

  // Check if event is relevant to wallet
  private isEventRelevantToWallet(event: BlockchainEvent, walletAddress: string): boolean {
    const data = event.data;
    return (
      data.voter === walletAddress ||
      data.claimer === walletAddress ||
      data.sender === walletAddress ||
      data.recipient === walletAddress ||
      data.authority === walletAddress ||
      data.from === walletAddress ||
      data.to === walletAddress
    );
  }

  // Send event history to client
  private sendEventHistory(ws: WebSocket, filters: any): void {
    let filteredEvents = this.eventHistory;

    // Apply filters
    if (filters.walletAddress) {
      filteredEvents = filteredEvents.filter(event => 
        this.isEventRelevantToWallet(event, filters.walletAddress)
      );
    }

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.eventTypes.includes(event.type)
      );
    }

    if (filters.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    ws.send(JSON.stringify({
      type: 'EVENT_HISTORY',
      events: filteredEvents,
      total: filteredEvents.length
    }));
  }

  // Get current statistics
  getCurrentStats(): EventStats {
    return { ...this.stats };
  }

  // Get event history
  getEventHistory(filters?: {
    walletAddress?: string;
    eventTypes?: EventType[];
    limit?: number;
  }): BlockchainEvent[] {
    let filteredEvents = this.eventHistory;

    if (filters) {
      if (filters.walletAddress) {
        filteredEvents = filteredEvents.filter(event => 
          this.isEventRelevantToWallet(event, filters.walletAddress!)
        );
      }

      if (filters.eventTypes && filters.eventTypes.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          filters.eventTypes!.includes(event.type)
        );
      }

      if (filters.limit) {
        filteredEvents = filteredEvents.slice(0, filters.limit);
      }
    }

    return filteredEvents;
  }

  // Health check
  healthCheck(): {
    healthy: boolean;
    stats: EventStats;
    connectedClients: number;
    activeSubscriptions: number;
  } {
    return {
      healthy: true,
      stats: this.getCurrentStats(),
      connectedClients: this.clientConnections.size,
      activeSubscriptions: this.eventSubscriptions.size
    };
  }

  // Cleanup
  cleanup(): void {
    this.clientConnections.forEach(client => {
      client.close();
    });
    this.clientConnections.clear();
    this.eventSubscriptions.clear();
    this.removeAllListeners();
    logger.info('Event Service cleaned up');
  }
}

// Singleton instance
let eventService: EventService | null = null;

export const getEventService = (): EventService => {
  if (!eventService) {
    eventService = new EventService();
  }
  return eventService;
};

export default EventService;
