import mongoose, { set } from 'mongoose';
require('dotenv').config();

const dbURL: string = process.env.DB_URI || '';

const connectDB = async () => {
    try {
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected');
            return;
        }

        // Connection options to prevent timeout
        const options = {
            serverSelectionTimeoutMS: 10000, // Timeout after 10s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            connectTimeoutMS: 10000, // Connection timeout
            maxPoolSize: 10, // Maximum number of connections in pool
        };

        await mongoose.connect(dbURL, options).then((data: any) => {
            console.log(`✅ MongoDB connected successfully with ${data.connection.host}`);
            console.log(`📊 Database: ${data.connection.name}`);
        });
    } catch (err: any) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('🔗 Connection URL:', dbURL.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
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
    console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

export { connectDB };