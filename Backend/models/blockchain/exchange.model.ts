import mongoose, { Document, Schema } from 'mongoose';

// Exchange Config Schema
export interface ExchangeConfigDocument extends Document {
  programAddress: string;
  admin: string;
  feeRate: number; // basis points
  feeRecipient: string;
  totalOrders: number;
  totalVolume: string;
  isActive: boolean;
  supportedTokens: string[];
  lastSyncedAt: Date;
}

const ExchangeConfigSchema = new Schema<ExchangeConfigDocument>({
  programAddress: { type: String, required: true, unique: true },
  admin: { type: String, required: true, index: true },
  feeRate: { type: Number, required: true },
  feeRecipient: { type: String, required: true, index: true },
  totalOrders: { type: Number, default: 0 },
  totalVolume: { type: String, default: '0' },
  isActive: { type: Boolean, default: true, index: true },
  supportedTokens: [{ type: String }],
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'exchange_configs'
});

// Exchange Order Schema
export interface ExchangeOrderDocument extends Document {
  programAddress: string;
  orderId: number;
  maker: string;
  giveMint: string;
  giveAmount: string;
  receiveMint: string;
  receiveAmount: string;
  filledAmount: string;
  orderType: number; // 0: Buy, 1: Sell
  isActive: boolean;
  expiryTime: Date;
  createdAt: Date;
  updatedAt: Date;
  // Calculated fields
  price: number; // receiveAmount / giveAmount
  remainingAmount: string; // giveAmount - filledAmount
  fillPercentage: number; // (filledAmount / giveAmount) * 100
  // Trading pair info
  baseMint: string;
  quoteMint: string;
  side: 'buy' | 'sell';
  // Fill history
  fills: Array<{
    taker: string;
    fillAmount: string;
    fillPrice: number;
    feeAmount: string;
    txHash: string;
    timestamp: Date;
  }>;
  // Status tracking
  cancelledAt?: Date;
  cancelledBy?: string;
  fullyFilledAt?: Date;
  lastSyncedAt: Date;
}

const ExchangeOrderSchema = new Schema<ExchangeOrderDocument>({
  programAddress: { type: String, required: true, index: true },
  orderId: { type: Number, required: true, index: true },
  maker: { type: String, required: true, index: true },
  giveMint: { type: String, required: true, index: true },
  giveAmount: { type: String, required: true },
  receiveMint: { type: String, required: true, index: true },
  receiveAmount: { type: String, required: true },
  filledAmount: { type: String, default: '0' },
  orderType: { type: Number, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  expiryTime: { type: Date, required: true, index: true },
  price: { type: Number, required: true, index: true },
  remainingAmount: { type: String, required: true },
  fillPercentage: { type: Number, default: 0, index: true },
  baseMint: { type: String, required: true, index: true },
  quoteMint: { type: String, required: true, index: true },
  side: { type: String, enum: ['buy', 'sell'], required: true, index: true },
  fills: [{
    taker: { type: String, required: true },
    fillAmount: { type: String, required: true },
    fillPrice: { type: Number, required: true },
    feeAmount: { type: String, required: true },
    txHash: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true }
  }],
  cancelledAt: { type: Date, sparse: true },
  cancelledBy: { type: String, sparse: true },
  fullyFilledAt: { type: Date, sparse: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'exchange_orders'
});

// Trade Schema
export interface TradeDocument extends Document {
  programAddress: string;
  orderId: number;
  maker: string;
  taker: string;
  baseMint: string;
  quoteMint: string;
  side: 'buy' | 'sell'; // from maker's perspective
  fillAmount: string;
  price: number;
  feeAmount: string;
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  // Market data
  makerFee: string;
  takerFee: string;
  totalValue: string; // fillAmount * price
}

const TradeSchema = new Schema<TradeDocument>({
  programAddress: { type: String, required: true, index: true },
  orderId: { type: Number, required: true, index: true },
  maker: { type: String, required: true, index: true },
  taker: { type: String, required: true, index: true },
  baseMint: { type: String, required: true, index: true },
  quoteMint: { type: String, required: true, index: true },
  side: { type: String, enum: ['buy', 'sell'], required: true, index: true },
  fillAmount: { type: String, required: true },
  price: { type: Number, required: true, index: true },
  feeAmount: { type: String, required: true },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  makerFee: { type: String, required: true },
  takerFee: { type: String, required: true },
  totalValue: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'trades'
});

// Order Book Schema (for market depth aggregation)
export interface OrderBookDocument extends Document {
  baseMint: string;
  quoteMint: string;
  bids: Array<{
    price: number;
    amount: string;
    orderCount: number;
  }>;
  asks: Array<{
    price: number;
    amount: string;
    orderCount: number;
  }>;
  lastUpdated: Date;
}

const OrderBookSchema = new Schema<OrderBookDocument>({
  baseMint: { type: String, required: true, index: true },
  quoteMint: { type: String, required: true, index: true },
  bids: [{
    price: { type: Number, required: true },
    amount: { type: String, required: true },
    orderCount: { type: Number, required: true }
  }],
  asks: [{
    price: { type: Number, required: true },
    amount: { type: String, required: true },
    orderCount: { type: Number, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'order_books'
});

// Market Stats Schema
export interface MarketStatsDocument extends Document {
  baseMint: string;
  quoteMint: string;
  period: '1h' | '24h' | '7d' | '30d';
  volume: string;
  high: number;
  low: number;
  open: number;
  close: number;
  change: number; // percentage
  trades: number;
  lastUpdated: Date;
}

const MarketStatsSchema = new Schema<MarketStatsDocument>({
  baseMint: { type: String, required: true, index: true },
  quoteMint: { type: String, required: true, index: true },
  period: { type: String, enum: ['1h', '24h', '7d', '30d'], required: true, index: true },
  volume: { type: String, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  open: { type: Number, required: true },
  close: { type: Number, required: true },
  change: { type: Number, required: true },
  trades: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'market_stats'
});

// Exchange Events Schema
export interface ExchangeEventDocument extends Document {
  programAddress: string;
  eventType: 'OrderCreated' | 'OrderFilled' | 'OrderCancelled' | 'OrderUpdated' | 'ExchangeInitialized';
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  maker?: string;
  taker?: string;
  orderId?: number;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

const ExchangeEventSchema = new Schema<ExchangeEventDocument>({
  programAddress: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['OrderCreated', 'OrderFilled', 'OrderCancelled', 'OrderUpdated', 'ExchangeInitialized'],
    index: true 
  },
  txHash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  blockTime: { type: Date, required: true, index: true },
  maker: { type: String, sparse: true, index: true },
  taker: { type: String, sparse: true, index: true },
  orderId: { type: Number, sparse: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date, sparse: true },
  error: { type: String, sparse: true }
}, {
  timestamps: true,
  collection: 'exchange_events'
});

// Indexes
ExchangeConfigSchema.index({ isActive: 1, totalOrders: 1 });

ExchangeOrderSchema.index({ programAddress: 1, orderId: 1 }, { unique: true });
ExchangeOrderSchema.index({ maker: 1, isActive: 1 });
ExchangeOrderSchema.index({ baseMint: 1, quoteMint: 1, side: 1, isActive: 1 });
ExchangeOrderSchema.index({ isActive: 1, expiryTime: 1 });
ExchangeOrderSchema.index({ side: 1, price: 1, isActive: 1 });

TradeSchema.index({ maker: 1, blockTime: -1 });
TradeSchema.index({ taker: 1, blockTime: -1 });
TradeSchema.index({ baseMint: 1, quoteMint: 1, blockTime: -1 });
TradeSchema.index({ blockTime: -1, price: 1 });

OrderBookSchema.index({ baseMint: 1, quoteMint: 1 }, { unique: true });

MarketStatsSchema.index({ baseMint: 1, quoteMint: 1, period: 1 }, { unique: true });

ExchangeEventSchema.index({ eventType: 1, blockTime: -1 });
ExchangeEventSchema.index({ maker: 1, eventType: 1 });
ExchangeEventSchema.index({ processed: 1, blockTime: 1 });

// Create models
export const ExchangeConfig = mongoose.model<ExchangeConfigDocument>('ExchangeConfig', ExchangeConfigSchema);
export const ExchangeOrder = mongoose.model<ExchangeOrderDocument>('ExchangeOrder', ExchangeOrderSchema);
export const Trade = mongoose.model<TradeDocument>('Trade', TradeSchema);
export const OrderBook = mongoose.model<OrderBookDocument>('OrderBook', OrderBookSchema);
export const MarketStats = mongoose.model<MarketStatsDocument>('MarketStats', MarketStatsSchema);
export const ExchangeEvent = mongoose.model<ExchangeEventDocument>('ExchangeEvent', ExchangeEventSchema);

// Utility functions
export class ExchangeModelUtils {
  static async updateOrderBook(baseMint: string, quoteMint: string) {
    // Get active buy orders (bids)
    const buyOrders = await ExchangeOrder.aggregate([
      {
        $match: {
          baseMint,
          quoteMint,
          side: 'buy',
          isActive: true,
          expiryTime: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: '$price',
          amount: { $sum: { $toDecimal: '$remainingAmount' } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }, // Highest price first
      { $limit: 50 }
    ]);

    // Get active sell orders (asks)
    const sellOrders = await ExchangeOrder.aggregate([
      {
        $match: {
          baseMint,
          quoteMint,
          side: 'sell',
          isActive: true,
          expiryTime: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: '$price',
          amount: { $sum: { $toDecimal: '$remainingAmount' } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }, // Lowest price first
      { $limit: 50 }
    ]);

    const bids = buyOrders.map(order => ({
      price: order._id,
      amount: order.amount.toString(),
      orderCount: order.orderCount
    }));

    const asks = sellOrders.map(order => ({
      price: order._id,
      amount: order.amount.toString(),
      orderCount: order.orderCount
    }));

    await OrderBook.findOneAndUpdate(
      { baseMint, quoteMint },
      { bids, asks, lastUpdated: new Date() },
      { upsert: true }
    );

    return { bids, asks };
  }

  static async updateMarketStats(baseMint: string, quoteMint: string, period: '1h' | '24h' | '7d' | '30d') {
    const now = new Date();
    const periodMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(now.getTime() - periodMap[period]);

    const trades = await Trade.find({
      baseMint,
      quoteMint,
      blockTime: { $gte: startTime }
    }).sort({ blockTime: 1 });

    if (trades.length === 0) {
      return null;
    }

    const volume = trades.reduce((sum, trade) => sum + BigInt(trade.totalValue), 0n);
    const prices = trades.map(trade => trade.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const open = prices[0];
    const close = prices[prices.length - 1];
    const change = open !== 0 ? ((close - open) / open) * 100 : 0;

    const stats = {
      baseMint,
      quoteMint,
      period,
      volume: volume.toString(),
      high,
      low,
      open,
      close,
      change,
      trades: trades.length,
      lastUpdated: new Date()
    };

    await MarketStats.findOneAndUpdate(
      { baseMint, quoteMint, period },
      stats,
      { upsert: true }
    );

    return stats;
  }

  static async getUserTradingStats(user: string) {
    const makerTrades = await Trade.countDocuments({ maker: user });
    const takerTrades = await Trade.countDocuments({ taker: user });
    const totalTrades = makerTrades + takerTrades;

    const makerVolume = await Trade.aggregate([
      { $match: { maker: user } },
      { $group: { _id: null, total: { $sum: { $toDecimal: '$totalValue' } } } }
    ]);

    const takerVolume = await Trade.aggregate([
      { $match: { taker: user } },
      { $group: { _id: null, total: { $sum: { $toDecimal: '$totalValue' } } } }
    ]);

    const activeOrders = await ExchangeOrder.countDocuments({ 
      maker: user, 
      isActive: true,
      expiryTime: { $gte: new Date() }
    });

    const totalOrders = await ExchangeOrder.countDocuments({ maker: user });

    return {
      totalTrades,
      makerTrades,
      takerTrades,
      makerVolume: makerVolume[0]?.total?.toString() || '0',
      takerVolume: takerVolume[0]?.total?.toString() || '0',
      activeOrders,
      totalOrders
    };
  }

  static async getMarketOverview(limit: number = 20) {
    // Get all unique trading pairs
    const pairs = await Trade.aggregate([
      {
        $group: {
          _id: { baseMint: '$baseMint', quoteMint: '$quoteMint' },
          trades: { $sum: 1 },
          volume: { $sum: { $toDecimal: '$totalValue' } }
        }
      },
      { $sort: { volume: -1 } },
      { $limit: limit }
    ]);

    const marketData = await Promise.all(
      pairs.map(async (pair) => {
        const stats24h = await MarketStats.findOne({
          baseMint: pair._id.baseMint,
          quoteMint: pair._id.quoteMint,
          period: '24h'
        });

        const orderBook = await OrderBook.findOne({
          baseMint: pair._id.baseMint,
          quoteMint: pair._id.quoteMint
        });

        return {
          baseMint: pair._id.baseMint,
          quoteMint: pair._id.quoteMint,
          volume24h: stats24h?.volume || '0',
          change24h: stats24h?.change || 0,
          high24h: stats24h?.high || 0,
          low24h: stats24h?.low || 0,
          lastPrice: stats24h?.close || 0,
          bestBid: orderBook?.bids[0]?.price || 0,
          bestAsk: orderBook?.asks[0]?.price || 0
        };
      })
    );

    return marketData;
  }

  static async getTopTraders(timeframe: 'day' | 'week' | 'month' = 'month', limit: number = 10) {
    const now = new Date();
    const timeframeMap = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(now.getTime() - timeframeMap[timeframe]);

    const topTraders = await Trade.aggregate([
      { $match: { blockTime: { $gte: startTime } } },
      {
        $group: {
          _id: null,
          makers: { $addToSet: '$maker' },
          takers: { $addToSet: '$taker' }
        }
      },
      {
        $project: {
          allTraders: { $setUnion: ['$makers', '$takers'] }
        }
      },
      { $unwind: '$allTraders' },
      {
        $lookup: {
          from: 'trades',
          let: { trader: '$allTraders' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gte: ['$blockTime', startTime] },
                    {
                      $or: [
                        { $eq: ['$maker', '$$trader'] },
                        { $eq: ['$taker', '$$trader'] }
                      ]
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                volume: { $sum: { $toDecimal: '$totalValue' } },
                trades: { $sum: 1 }
              }
            }
          ],
          as: 'tradeStats'
        }
      },
      { $unwind: '$tradeStats' },
      {
        $project: {
          trader: '$allTraders',
          volume: '$tradeStats.volume',
          trades: '$tradeStats.trades'
        }
      },
      { $sort: { volume: -1 } },
      { $limit: limit }
    ]);

    return topTraders;
  }
}





















