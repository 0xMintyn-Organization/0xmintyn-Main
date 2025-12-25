import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import http from 'http';
import { logger } from './utils/logger';
import P2PMessageModel from './models/p2p/p2pMessage.model';
import P2PTradeModel from './models/p2p/p2pTrade.model';
import DOMPurify from 'isomorphic-dompurify';
import { RateLimiterMemory } from 'rate-limiter-flexible';

let exchangeNamespaceInstance: Namespace | null = null;

// Rate limiter for messages: 10 messages per minute per user
const messageRateLimiter = new RateLimiterMemory({
  points: 10, // Number of messages
  duration: 60, // Per 60 seconds
});

export const getExchangeNamespace = () => exchangeNamespaceInstance;

export const initSocketServer = (server: http.Server) => {
    // Get CORS origins from environment variables
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://209.74.89.249:3000',
        'https://advanced-lms-client.vercel.app',
    ];

    const io = new SocketIOServer(server, {
        cors: {
            origin: corsOrigins,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true, // Allow Engine.IO v3 clients
    });
    
    logger.info('🔌 Socket.io server initialized with CORS enabled', { origins: corsOrigins });

    // Default namespace for notifications
    io.on('connection', (socket: Socket) => {
        console.log('✅ Client connected to default namespace');

        socket.on('notification', (data) => {
            console.log('📢 Notification received:', data);
            io.emit('newNotification', data);
        });

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected from default namespace');
        });
    });

    // Exchange P2P namespace for real-time messaging
    // Note: Socket.io namespaces cannot contain colons, use hyphen instead
    const exchangeNamespace = io.of('/exchange-p2p');
    exchangeNamespaceInstance = exchangeNamespace; // Export for use in controllers
    
    console.log('✅ Exchange P2P namespace created: /exchange-p2p');

    exchangeNamespace.on('connection', (socket: Socket) => {
        logger.info(`✅ Client connected to exchange-p2p namespace: ${socket.id}`);

        let authenticatedUserId: string | null = null;
        const joinedRooms = new Set<string>();

        // Authenticate user
        socket.on('authenticate', (data: { userId: string }) => {
            if (!data.userId) {
                socket.emit('error', { message: 'User ID is required for authentication' });
                logger.error('❌ Authentication failed: No user ID provided');
                return;
            }
            authenticatedUserId = data.userId;
            // Join user-specific room for notifications
            const userRoom = `user:${data.userId}`;
            socket.join(userRoom);
            joinedRooms.add(userRoom);
            socket.emit('authenticated', { success: true, userId: data.userId });
            logger.info(`🔐 User authenticated: ${authenticatedUserId} (joined room: ${userRoom})`);
            
            // Notify that user is ready to receive messages
            socket.emit('ready', { userId: data.userId });
        });

        // Join order room
        socket.on('join-room', (data: { orderId: string }) => {
            if (!authenticatedUserId) {
                socket.emit('error', { message: 'Not authenticated' });
                logger.warn('⚠️ Join room failed: User not authenticated');
                return;
            }

            const roomName = `order:${data.orderId}`;
            socket.join(roomName);
            joinedRooms.add(roomName);
            logger.info(`📥 User ${authenticatedUserId} joined room: ${roomName}`);
        });

        // Leave order room
        socket.on('leave-room', (data: { orderId: string }) => {
            const roomName = `order:${data.orderId}`;
            socket.leave(roomName);
            joinedRooms.delete(roomName);
            logger.info(`📤 User ${authenticatedUserId} left room: ${roomName}`);
        });

        // Send message with rate limiting, validation, and persistence
        socket.on('p2p:message:send', async (data: {
            orderId: string;
            message: string;
            attachments?: Array<{ name: string; size: number; type: string }>;
        }) => {
            if (!authenticatedUserId) {
                socket.emit('error', { message: 'Not authenticated' });
                logger.error('❌ Message send failed: User not authenticated');
                return;
            }

            try {
                // Rate limiting check
                try {
                    await messageRateLimiter.consume(authenticatedUserId);
                } catch (rateLimiterRes) {
                    socket.emit('error', { 
                        message: 'Rate limit exceeded. Please wait before sending another message.',
                        code: 'RATE_LIMIT_EXCEEDED'
                    });
                    logger.warn(`⚠️ Rate limit exceeded for user ${authenticatedUserId}`);
                    return;
                }

                // Validation
                if (!data.orderId || !data.message) {
                    socket.emit('error', { message: 'Order ID and message are required' });
                    return;
                }

                const trimmedMessage = data.message.trim();
                if (trimmedMessage.length === 0) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                if (trimmedMessage.length > 1000) {
                    socket.emit('error', { message: 'Message cannot exceed 1000 characters' });
                    return;
                }

                // Verify user is part of this trade
                const trade = await P2PTradeModel.findById(data.orderId);
                if (!trade) {
                    socket.emit('error', { message: 'Trade not found' });
                    return;
                }

                const buyerId = trade.buyerId?._id ? String(trade.buyerId._id) : String(trade.buyerId);
                const sellerId = trade.sellerId?._id ? String(trade.sellerId._id) : String(trade.sellerId);
                const currentUserId = String(authenticatedUserId);

                if (buyerId !== currentUserId && sellerId !== currentUserId) {
                    socket.emit('error', { message: 'Unauthorized: You are not part of this trade' });
                    logger.warn(`⚠️ Unauthorized message attempt: User ${authenticatedUserId} tried to send message to trade ${data.orderId}`);
                    return;
                }

                // Sanitize message to prevent XSS attacks
                const sanitizedMessage = DOMPurify.sanitize(trimmedMessage, {
                    ALLOWED_TAGS: [], // No HTML tags allowed
                    ALLOWED_ATTR: [],
                });

                // Validate attachments if provided
                if (data.attachments && Array.isArray(data.attachments)) {
                    const maxFileSize = 10 * 1024 * 1024; // 10MB
                    const maxFiles = 5;
                    
                    if (data.attachments.length > maxFiles) {
                        socket.emit('error', { message: `Maximum ${maxFiles} attachments allowed` });
                        return;
                    }

                    for (const attachment of data.attachments) {
                        if (attachment.size > maxFileSize) {
                            socket.emit('error', { message: 'File size cannot exceed 10MB' });
                            return;
                        }
                    }
                }

                const roomName = `order:${data.orderId}`;
                
                // Auto-join room if not already joined (for convenience)
                if (!joinedRooms.has(roomName)) {
                    socket.join(roomName);
                    joinedRooms.add(roomName);
                    logger.info(`📥 Auto-joined room: ${roomName}`);
                }

                // Save message to database for persistence
                const savedMessage = await P2PMessageModel.create({
                    orderId: trade._id,
                    senderId: authenticatedUserId,
                    message: sanitizedMessage,
                    attachments: data.attachments || [],
                    isRead: false,
                });

                // Create message object for WebSocket broadcast
                const messageData = {
                    id: savedMessage._id.toString(),
                    orderId: data.orderId,
                    senderUserId: authenticatedUserId,
                    message: sanitizedMessage,
                    attachments: data.attachments || [],
                    createdAt: savedMessage.createdAt.toISOString(),
                    isRead: false,
                };

                // Get all sockets in the room to verify broadcasting
                const room = exchangeNamespace.adapter.rooms.get(roomName);
                const socketCount = room ? room.size : 0;
                logger.info(`📊 Room ${roomName} has ${socketCount} socket(s), authenticated user: ${authenticatedUserId}`);

                // Broadcast to ALL users in the room (including sender)
                // This ensures both buyer and seller receive the message in real-time
                exchangeNamespace.in(roomName).emit('p2p:message:new', messageData);

                logger.info(`💬 Message saved and broadcasted in room ${roomName} by user ${authenticatedUserId} to ${socketCount} socket(s)`);
            } catch (error: any) {
                logger.error('❌ Error processing message:', error);
                socket.emit('error', { message: 'Failed to send message. Please try again.' });
            }
        });

        // Handle order status updates
        socket.on('p2p:order:update', (data: {
            orderId: string;
            status: string;
            updates: Record<string, any>;
        }) => {
            if (!authenticatedUserId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            const roomName = `order:${data.orderId}`;
            exchangeNamespace.to(roomName).emit('p2p:order:updated', {
                orderId: data.orderId,
                status: data.status,
                updates: data.updates,
                updatedBy: authenticatedUserId,
                timestamp: new Date().toISOString(),
            });

            console.log(`🔄 Order ${data.orderId} status updated to ${data.status}`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            logger.info(`❌ Client disconnected from exchange-p2p: ${socket.id} (User: ${authenticatedUserId})`);
            joinedRooms.clear();
        });
    });

    logger.info('🔌 Socket.io server initialized with exchange-p2p namespace');
};