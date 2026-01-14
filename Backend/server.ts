import { app } from "./app";
import { connectDB } from "./utils/db";
require ('dotenv').config();
import http from 'http';
const server = http.createServer(app);

// Global error handlers for unhandled rejections and exceptions
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Log to error tracking service in production
  // Don't exit in production, let PM2 handle restarts
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Graceful shutdown
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Memory monitoring (log every 5 minutes)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const usage = process.memoryUsage();
    const formatMB = (bytes: number) => Math.round(bytes / 1024 / 1024);
    console.log('📊 Memory Usage:', {
      rss: `${formatMB(usage.rss)}MB`,
      heapTotal: `${formatMB(usage.heapTotal)}MB`,
      heapUsed: `${formatMB(usage.heapUsed)}MB`,
      external: `${formatMB(usage.external)}MB`,
    });
    
    // Warn if memory usage is high
    if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️ High heap memory usage detected!');
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

// create server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  connectDB();
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  
  switch (error.code) {
    case 'EACCES':
      console.error(`❌ Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});