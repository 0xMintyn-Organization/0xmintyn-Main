import { app } from "./app";
import { connectDB } from "./utils/db";
import { initSocketServer } from "./socketServer";
import logger from "./utils/logger";
require('dotenv').config();
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const USE_HTTPS = process.env.USE_HTTPS === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, 'cert', 'key.pem');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, 'cert', 'cert.pem');

function createServer() {
  if (USE_HTTPS) {
    try {
      const key = fs.readFileSync(SSL_KEY_PATH);
      const cert = fs.readFileSync(SSL_CERT_PATH);
      return https.createServer({ key, cert }, app);
    } catch (e: any) {
      logger.warn('HTTPS requested but cert/key not found. Run: npm run certs');
      logger.warn('Falling back to HTTP. Cross-origin login will not work until API uses HTTPS.');
    }
  }
  return http.createServer(app);
}

const server = createServer();

// Increase timeout for large file uploads (5 minutes)
server.timeout = 5 * 60 * 1000; // 5 minutes
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

// Initialize Socket.IO
initSocketServer(server);

// Get port and host from environment or use defaults
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

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

const protocol = USE_HTTPS && server instanceof https.Server ? 'https' : 'http';
// Start server
server.listen(PORT, HOST, async () => {
    logger.info(`🚀 Server is running on ${protocol}://${HOST}:${PORT}`);
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