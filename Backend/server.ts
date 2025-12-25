import { app } from "./app";
import { connectDB } from "./utils/db";
require('dotenv').config();
import http from 'http';
import { initSocketServer } from './socketServer';
import { startOrderExpirationJob } from './utils/orderExpiration';

const PORT = process.env.PORT || 8000;

// Connect to database first, then start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.io server
    initSocketServer(server);
    
    // Start order expiration cron job
    startOrderExpirationJob();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api/v1`);
      console.log(`🔌 Socket.io server initialized`);
      console.log(`⏰ Order expiration job started`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      switch (error.code) {
        case 'EADDRINUSE':
          console.error(`❌ Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();