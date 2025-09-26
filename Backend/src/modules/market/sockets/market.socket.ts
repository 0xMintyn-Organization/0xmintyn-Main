import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../../../../utils/logger';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../utils/market.constants';

// Extend Socket interface to include user data
interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    role: string;
    email: string;
    username: string;
  };
}

// Socket.io namespace for marketplace
export const setupMarketSocket = (io: SocketIOServer) => {
  const marketNamespace = io.of('/market');

  // Authentication middleware for socket connections
  marketNamespace.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Extract token from handshake
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logger.warn('Socket connection attempt without token', {
          socketId: socket.id,
          ip: socket.handshake.address
        });
        return next(new Error('Authentication required'));
      }

      // Verify JWT token (reuse existing auth logic)
      // This would typically use the same JWT verification as the REST API
      // For now, we'll implement a basic check
      // In production, you'd import and use the same JWT verification logic
      
      // Placeholder user data - replace with actual JWT verification
      socket.user = {
        _id: 'placeholder_user_id',
        role: 'user',
        email: 'user@example.com',
        username: 'user'
      };

      logger.info('Socket authenticated', {
        socketId: socket.id,
        userId: socket.user._id,
        role: socket.user.role
      });

      next();
    } catch (error) {
      logger.error('Socket authentication error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(new Error('Authentication failed'));
    }
  });

  // Handle socket connections
  marketNamespace.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?._id;
    const userRole = socket.user?.role;

    if (!userId) {
      logger.error('Socket connected without user data', {
        socketId: socket.id
      });
      socket.disconnect();
      return;
    }

    logger.info('Marketplace socket connected', {
      socketId: socket.id,
      userId,
      role: userRole
    });

    // Join user's personal room for notifications
    socket.join(SOCKET_ROOMS.USER(userId));

    // Handle presence updates
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (data) => {
      logger.info('Presence update received', {
        socketId: socket.id,
        userId,
        status: data.status
      });

      // Broadcast presence to relevant rooms
      socket.to(SOCKET_ROOMS.USER(userId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId,
        status: data.status,
        timestamp: new Date().toISOString()
      });
    });

    // Handle thread joining
    socket.on(SOCKET_EVENTS.THREAD_JOIN, (data) => {
      const { threadId } = data;
      
      logger.info('User joining thread', {
        socketId: socket.id,
        userId,
        threadId
      });

      // Join thread room
      socket.join(SOCKET_ROOMS.THREAD(threadId));

      // Notify other participants
      socket.to(SOCKET_ROOMS.THREAD(threadId)).emit(SOCKET_EVENTS.THREAD_JOIN, {
        userId,
        threadId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle thread leaving
    socket.on(SOCKET_EVENTS.THREAD_LEAVE, (data) => {
      const { threadId } = data;
      
      logger.info('User leaving thread', {
        socketId: socket.id,
        userId,
        threadId
      });

      // Leave thread room
      socket.leave(SOCKET_ROOMS.THREAD(threadId));

      // Notify other participants
      socket.to(SOCKET_ROOMS.THREAD(threadId)).emit(SOCKET_EVENTS.THREAD_LEAVE, {
        userId,
        threadId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing indicators
    socket.on(SOCKET_EVENTS.TYPING, (data) => {
      const { threadId, isTyping } = data;
      
      logger.debug('Typing indicator received', {
        socketId: socket.id,
        userId,
        threadId,
        isTyping
      });

      // Broadcast typing to other thread participants
      socket.to(SOCKET_ROOMS.THREAD(threadId)).emit(SOCKET_EVENTS.TYPING, {
        userId,
        threadId,
        isTyping,
        timestamp: new Date().toISOString()
      });
    });

    // Handle message sending
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (data) => {
      const { threadId, text, attachments } = data;
      
      logger.info('Message send attempt', {
        socketId: socket.id,
        userId,
        threadId,
        textLength: text?.length || 0,
        attachmentsCount: attachments?.length || 0
      });

      try {
        // Validate message data
        if (!threadId || !text) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Here you would save the message to the database
        // For now, we'll just broadcast it
        const messageData = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          threadId,
          senderId: userId,
          text,
          attachments: attachments || [],
          timestamp: new Date().toISOString()
        };

        // Broadcast message to thread participants
        marketNamespace.to(SOCKET_ROOMS.THREAD(threadId)).emit(SOCKET_EVENTS.MESSAGE_NEW, messageData);

        logger.info('Message broadcasted', {
          messageId: messageData.id,
          threadId,
          senderId: userId
        });

      } catch (error) {
        logger.error('Error handling message send', {
          socketId: socket.id,
          userId,
          threadId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle delivery sending
    socket.on(SOCKET_EVENTS.DELIVERY_SEND, (data) => {
      const { orderId, deliveryId } = data;
      
      logger.info('Delivery send notification', {
        socketId: socket.id,
        userId,
        orderId,
        deliveryId
      });

      // Broadcast delivery to order participants
      marketNamespace.to(SOCKET_ROOMS.ORDER(orderId)).emit(SOCKET_EVENTS.DELIVERY_NEW, {
        orderId,
        deliveryId,
        senderId: userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Marketplace socket disconnected', {
        socketId: socket.id,
        userId,
        reason
      });

      // Broadcast offline status
      socket.to(SOCKET_ROOMS.USER(userId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId,
        error: error.message || 'Unknown socket error'
      });
    });
  });

  // Utility functions for broadcasting to specific rooms
  const broadcastToUser = (userId: string, event: string, data: any) => {
    marketNamespace.to(SOCKET_ROOMS.USER(userId)).emit(event, data);
  };

  const broadcastToThread = (threadId: string, event: string, data: any) => {
    marketNamespace.to(SOCKET_ROOMS.THREAD(threadId)).emit(event, data);
  };

  const broadcastToOrder = (orderId: string, event: string, data: any) => {
    marketNamespace.to(SOCKET_ROOMS.ORDER(orderId)).emit(event, data);
  };

  const broadcastToShop = (shopId: string, event: string, data: any) => {
    marketNamespace.to(SOCKET_ROOMS.SHOP(shopId)).emit(event, data);
  };

  // Export utility functions for use in controllers
  return {
    broadcastToUser,
    broadcastToThread,
    broadcastToOrder,
    broadcastToShop,
    marketNamespace
  };
};

// Export socket setup function
export default setupMarketSocket;
