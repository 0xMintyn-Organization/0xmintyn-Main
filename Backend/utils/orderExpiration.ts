/**
 * Order Expiration Handler
 * Automatically expires and cancels P2P trades that have passed their expiration time
 */

import cron from 'node-cron';
import P2PTradeModel from '../models/p2p/p2pTrade.model';
import { getExchangeNamespace } from '../socketServer';
import { logger } from './logger';

/**
 * Check and expire orders that have passed their expiration time
 */
export async function expireOrders() {
  try {
    const now = new Date();
    
    // Find all pending orders that have expired
    const expiredOrders = await P2PTradeModel.find({
      status: 'pending',
      expiresAt: { $lt: now },
    }).populate('buyerId', 'firstName lastName email').populate('sellerId', 'firstName lastName email');

    if (expiredOrders.length === 0) {
      logger.debug('No expired orders found');
      return;
    }

    logger.info(`Found ${expiredOrders.length} expired order(s), cancelling...`);

    // Cancel expired orders
    const updateResult = await P2PTradeModel.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: now },
      },
      {
        status: 'cancelled',
        cancelledAt: now,
        cancelledBy: 'system',
      }
    );

    logger.info(`Cancelled ${updateResult.modifiedCount} expired order(s)`);

    // Notify users via WebSocket
    const exchangeNamespace = getExchangeNamespace();
    if (exchangeNamespace) {
      for (const order of expiredOrders) {
        const buyerId = order.buyerId?._id ? String(order.buyerId._id) : String(order.buyerId);
        const sellerId = order.sellerId?._id ? String(order.sellerId._id) : String(order.sellerId);

        // Notify buyer
        exchangeNamespace.to(`user:${buyerId}`).emit('p2p:order:expired', {
          orderId: order._id.toString(),
          tradeNumber: order.tradeNumber,
          reason: 'Order expired',
          timestamp: now.toISOString(),
        });

        // Notify seller
        exchangeNamespace.to(`user:${sellerId}`).emit('p2p:order:expired', {
          orderId: order._id.toString(),
          tradeNumber: order.tradeNumber,
          reason: 'Order expired',
          timestamp: now.toISOString(),
        });

        // Also notify in the order room
        const roomName = `order:${order._id.toString()}`;
        exchangeNamespace.in(roomName).emit('p2p:order:updated', {
          orderId: order._id.toString(),
          status: 'cancelled',
          updates: {
            cancelledAt: now,
            cancelledBy: 'system',
            reason: 'Order expired',
          },
          timestamp: now.toISOString(),
        });
      }
    }
  } catch (error: any) {
    logger.error('Error expiring orders:', error);
  }
}

/**
 * Start the order expiration cron job
 * Runs every minute to check for expired orders
 */
export function startOrderExpirationJob() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    logger.debug('Running order expiration check...');
    await expireOrders();
  });

  logger.info('✅ Order expiration cron job started (runs every minute)');
}

