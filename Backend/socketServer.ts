import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import logger from './utils/logger';

export const initSocketServer = (server: http.Server) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CLIENT_URL 
                ? process.env.CLIENT_URL.split(',')
                : ['https://app.equalmint.com', 'http://209.74.89.249:3000'],
            credentials: true,
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Socket client connected: ${socket.id}`);
        logger.debug(`Total connected clients: ${io.sockets.sockets.size}`);

        // Listen for "notification" event from frontend 
        socket.on('notification', (data) => {
            logger.info('📢 Notification received:', { socketId: socket.id, data });
            // Broadcast message to all connected clients
            io.emit('newNotification', data);
        });

        // Listen for "disconnect" event from frontend
        socket.on('disconnect', (reason) => {
            logger.info(`🔌 Socket client disconnected: ${socket.id}`, { reason });
            logger.debug(`Total connected clients: ${io.sockets.sockets.size}`);
        });

        // Handle connection errors
        socket.on('error', (error) => {
            logger.error('Socket error:', { socketId: socket.id, error });
        });
    });

    // Handle Socket.IO server errors
    io.on('error', (error) => {
        logger.error('Socket.IO server error:', error);
    });

    logger.info('✅ Socket.IO server initialized');
    
    return io;
};