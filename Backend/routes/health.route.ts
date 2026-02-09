import express, { Request, Response } from 'express';
import { getSystemStats } from '../middleware/advancedLogging';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { getSolanaMilestoneState } from '../controllers/milestone.controller';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const healthRouter = express.Router();

// Solana milestone state (under health to avoid route conflicts)
healthRouter.get('/solana-milestone/state', updateAccessTokenMiddleware, isAuthenticated, getSolanaMilestoneState);

// Basic health check
healthRouter.get('/health', async (req: Request, res: Response) => {
    try {
        const dbStatus = mongoose.connection.readyState;
        const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: dbStates[dbStatus] || 'unknown',
                connected: dbStatus === 1
            },
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
        
        const statusCode = health.database.connected ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error: any) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Detailed system diagnostics
healthRouter.get('/health/detailed', async (req: Request, res: Response) => {
    try {
        const systemStats = getSystemStats();
        const dbStatus = mongoose.connection.readyState;
        const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        // Test database connection
        let dbLatency = 0;
        try {
            const start = Date.now();
            await mongoose.connection.db?.admin().ping();
            dbLatency = Date.now() - start;
        } catch (error) {
            logger.warn('Database ping failed', { error });
        }
        
        const diagnostics = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            system: systemStats,
            database: {
                status: dbStates[dbStatus] || 'unknown',
                connected: dbStatus === 1,
                latency: `${dbLatency}ms`,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            },
            application: {
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                pid: process.pid
            },
            checks: {
                database: dbStatus === 1,
                memory: systemStats.current.memory.heapUsed < 1000, // Less than 1GB
                uptime: systemStats.current.uptime.seconds > 0,
                requests: systemStats.performance.totalRequests >= 0
            }
        };
        
        // Determine overall status
        const allChecksPass = Object.values(diagnostics.checks).every(check => check === true);
        diagnostics.status = allChecksPass ? 'ok' : 'degraded';
        
        const statusCode = allChecksPass ? 200 : 503;
        res.status(statusCode).json(diagnostics);
    } catch (error: any) {
        logger.error('Detailed health check failed', { 
            error: error.message,
            stack: error.stack 
        });
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Crash report endpoint (for external monitoring)
healthRouter.get('/health/crash-report', (req: Request, res: Response) => {
    try {
        const crashReport = {
            timestamp: new Date().toISOString(),
            system: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                pid: process.pid,
                nodeVersion: process.version
            },
            database: {
                status: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            },
            recentStats: getSystemStats()
        };
        
        res.status(200).json(crashReport);
    } catch (error: any) {
        logger.error('Crash report generation failed', { error: error.message });
        res.status(500).json({
            error: 'Failed to generate crash report',
            message: error.message
        });
    }
});

export default healthRouter;
