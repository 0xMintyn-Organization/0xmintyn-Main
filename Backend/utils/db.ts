import mongoose from 'mongoose';
import logger from './logger';
require('dotenv').config();

const dbURL: string = process.env.DB_URI || '';

let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async (): Promise<void> => {
    if (!dbURL) {
        logger.error('❌ Database URL is not defined. Please set DB_URI in environment variables.');
        return;
    }

    try {
        const connection = await mongoose.connect(dbURL);
        logger.info(`✅ MongoDB connected successfully to ${connection.connection.host}`);
        logger.info(`📊 Database: ${connection.connection.name}`);
        
        // Reset retry count on successful connection
        retryCount = 0;

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
            retryCount = 0;
            setTimeout(connectDB, RETRY_DELAY);
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('✅ MongoDB reconnected successfully');
            retryCount = 0;
        });

    } catch (err: any) {
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
            logger.error(`❌ Failed to connect to MongoDB after ${MAX_RETRIES} attempts. Stopping retries.`);
            logger.error('Error details:', err);
            // Don't exit - let the application continue and retry later
            return;
        }

        logger.warn(`⚠️ MongoDB connection attempt ${retryCount}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY / 1000} seconds...`);
        logger.error('Connection error:', err.message);
        
        setTimeout(() => {
            connectDB();
        }, RETRY_DELAY);
    }
};

export { connectDB };