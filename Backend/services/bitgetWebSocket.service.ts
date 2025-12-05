import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface BitgetTickerPayload {
  instId: string;
  last: string;
  open24h: string;
  high24h: string;
  low24h: string;
  bestBid: string;
  bestAsk: string;
  ts: number;
}

interface LiveTicker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  timestamp: number;
}

const WS_URL = 'wss://ws.bitget.com/v2/ws/public';
const SUBSCRIBE_PAYLOAD = {
  op: 'subscribe',
  args: [
    {
      instType: 'SPOT',
      channel: 'ticker',
      instId: 'BTCUSDT',
    },
  ],
};

class BitgetWebSocketService extends EventEmitter {
  private ws?: WebSocket;
  private heartbeat?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectDelay = 5000;
  private latestTicker: LiveTicker | null = null;

  constructor() {
    super();
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(WS_URL);
    this.ws.on('open', () => this.onOpen());
    this.ws.on('message', (data) => this.onMessage(data.toString()));
    this.ws.on('close', () => this.onClose());
    this.ws.on('error', (error) => this.onError(error));
  }

  private onOpen() {
    this.emit('status', { online: true });
    this.subscribeTicker();
    this.startHeartbeat();
  }

  private onMessage(raw: string) {
    try {
      const payload = JSON.parse(raw);
      if (payload.ping) {
        this.ws?.send(JSON.stringify({ op: 'pong', ts: payload.ping }));
        return;
      }
      if (payload.data && Array.isArray(payload.data)) {
        const first = payload.data[0] as BitgetTickerPayload;
        const nextTicker: LiveTicker = {
          symbol: first.instId,
          price: Number(first.last),
          bid: Number(first.bestBid),
          ask: Number(first.bestAsk),
          open: Number(first.open24h),
          high: Number(first.high24h),
          low: Number(first.low24h),
          timestamp: first.ts,
        };
        this.latestTicker = nextTicker;
        this.emit('ticker', nextTicker);
      }
    } catch (error) {
      this.emit('error', error);
      console.error('Bitget WS parsing error', error);
    }
  }

  private onClose() {
    this.emit('status', { online: false });
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private onError(error: Error) {
    this.emit('error', error);
    console.error('Bitget WS error', error.message);
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private subscribeTicker() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(SUBSCRIBE_PAYLOAD));
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws?.send(JSON.stringify({ op: 'ping', ts: Date.now() }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, this.reconnectDelay);
  }

  public getLastTicker(): LiveTicker | null {
    return this.latestTicker;
  }
}

export const bitgetWebSocketService = new BitgetWebSocketService();
