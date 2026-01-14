import mongoose, { set } from 'mongoose';
require('dotenv').config();

const dbURL: string = process.env.DB_URI || '';

let reconnectTimer: NodeJS.Timeout | null = null;
let isConnecting = false;

const connectDB = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log('⏳ Database connection already in progress, skipping...');
        return;
    }

    try {
        isConnecting = true;
        
        // Clear any existing reconnect timer
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        await mongoose.connect(dbURL).then((data: any) => {
            console.log(`✅ MongoDB connected with ${data.connection.host}`);
            isConnecting = false;
        });
    } catch (err: any) {
        isConnecting = false;
        console.error(`❌ MongoDB connection error: ${err.message}`);
        
        // Only set reconnect timer if not already set
        if (!reconnectTimer) {
            console.log('🔄 Attempting to reconnect in 5 seconds...');
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectDB();
            }, 5000);
        }
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose disconnected from MongoDB');
    // Attempt to reconnect
    if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectDB();
        }, 5000);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
});

process.on('SIGINT', async () => {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
});

export { connectDB };