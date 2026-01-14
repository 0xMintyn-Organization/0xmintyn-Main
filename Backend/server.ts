import { app } from "./app";
import { connectDB } from "./utils/db";
import { initSocketServer } from "./socketServer";
import logger from "./utils/logger";
require('dotenv').config();
import http from 'http';

// Create HTTP server
const server = http.createServer(app);

// Increase timeout for large file uploads (5 minutes)
server.timeout = 5 * 60 * 1000; // 5 minutes
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

// Initialize Socket.IO
initSocketServer(server);

// Get port from environment or use default
const PORT = process.env.PORT || 8000;

// Handle uncaught exceptions with detailed crash report
process.on('uncaughtException', (error: Error) => {
    logger.crash(error, {
        type: 'uncaughtException',
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
    
    // Give time for logs to be written
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Handle unhandled promise rejections with detailed crash report
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    logger.crash(error, {
        type: 'unhandledRejection',
        reason: reason,
        promise: promise.toString(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
    
    // Close server gracefully
    server.close(() => {
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });
});

// Handle SIGTERM (Docker/Kubernetes termination signal)
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated!');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, async () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Connect to database
    try {
        await connectDB();
        logger.info('✅ Database connection established');
    } catch (error: any) {
        logger.error('❌ Failed to connect to database:', error);
        // Don't exit - let the retry logic handle it
    }
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);