import { Request, Response, NextFunction } from 'express';
import logger, { requestContext } from '../utils/logger';
import os from 'os';
import { performance } from 'perf_hooks';

// System monitoring data
let systemStats = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    responseTimeHistory: [] as number[],
    memoryUsage: process.memoryUsage(),
    lastUpdate: Date.now()
};

// Update system stats periodically
setInterval(() => {
    systemStats.memoryUsage = process.memoryUsage();
    systemStats.lastUpdate = Date.now();
    
    // Keep only last 100 response times for average
    if (systemStats.responseTimeHistory.length > 100) {
        systemStats.responseTimeHistory = systemStats.responseTimeHistory.slice(-100);
    }
    
    if (systemStats.responseTimeHistory.length > 0) {
        const sum = systemStats.responseTimeHistory.reduce((a, b) => a + b, 0);
        systemStats.averageResponseTime = sum / systemStats.responseTimeHistory.length;
    }
}, 5000); // Update every 5 seconds

// Request ID middleware - must be first
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || 
                     req.headers['x-correlation-id'] as string || 
                     `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Set request ID in response header
    res.setHeader('X-Request-ID', requestId);
    
    // Store in request context
    requestContext.run({ 
        requestId, 
        userId: (req.user as any)?._id || (req.user as any)?.id,
        ip: req.ip || req.socket.remoteAddress 
    }, () => {
        next();
    });
};

// Comprehensive request/response logging middleware
export const advancedRequestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    const requestId = requestContext.getStore()?.requestId || 'unknown';
    const startMemory = process.memoryUsage();
    
    // Increment request count
    systemStats.requestCount++;
    
    // Log incoming request
    logger.http('Incoming Request', {
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        query: req.query,
        params: req.params,
        headers: {
            'user-agent': req.get('user-agent'),
            'content-type': req.get('content-type'),
            'content-length': req.get('content-length'),
            'authorization': req.get('authorization') ? '***' : undefined
        },
        ip: req.ip || req.socket.remoteAddress,
        bodySize: req.get('content-length') || 0,
        memoryBefore: {
            heapUsed: Math.round(startMemory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(startMemory.heapTotal / 1024 / 1024),
            rss: Math.round(startMemory.rss / 1024 / 1024)
        }
    });
    
    // Capture response
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(body: any) {
        const duration = performance.now() - startTime;
        const endMemory = process.memoryUsage();
        const memoryDelta = {
            heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
            heapTotal: Math.round((endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024),
            rss: Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024)
        };
        
        // Track response time
        systemStats.responseTimeHistory.push(duration);
        
        // Log response
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration.toFixed(2)}ms`,
            responseSize: Buffer.byteLength(JSON.stringify(body || ''), 'utf8'),
            memoryDelta,
            memoryAfter: {
                heapUsed: Math.round(endMemory.heapUsed / 1024 / 1024),
                heapTotal: Math.round(endMemory.heapTotal / 1024 / 1024),
                rss: Math.round(endMemory.rss / 1024 / 1024)
            }
        };
        
        // Log based on status code
        if (res.statusCode >= 500) {
            systemStats.errorCount++;
            logger.error('Request Error Response', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request Client Error', logData);
        } else {
            logger.http('Request Success', logData);
        }
        
        // Performance warning for slow requests
        if (duration > 1000) {
            logger.performance('Slow Request Detected', {
                ...logData,
                threshold: '1000ms'
            });
        }
        
        // Memory warning
        const heapUsedMB = endMemory.heapUsed / 1024 / 1024;
        if (heapUsedMB > 500) {
            logger.warn('High Memory Usage', {
                heapUsedMB: Math.round(heapUsedMB),
                threshold: '500MB'
            });
        }
        
        return originalSend.call(this, body);
    };
    
    res.json = function(body: any) {
        return res.send(body);
    };
    
    next();
};

// Database query logging (to be used with mongoose)
export const logDatabaseQuery = (operation: string, collection: string, query: any, duration?: number, error?: any) => {
    const logData: any = {
        operation,
        collection,
        query: JSON.stringify(query),
        duration: duration ? `${duration.toFixed(2)}ms` : undefined
    };
    
    if (error) {
        logger.database('Database Error', {
            ...logData,
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack
            }
        });
    } else if (duration && duration > 100) {
        logger.performance('Slow Database Query', {
            ...logData,
            threshold: '100ms'
        });
    } else {
        logger.database('Database Query', logData);
    }
};

// System monitoring endpoint data
export const getSystemStats = () => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    return {
        ...systemStats,
        current: {
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: {
                seconds: Math.round(uptime),
                formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
            },
            eventLoop: {
                delay: 'N/A' // Would need additional library for precise measurement
            },
            os: {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
                freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
                loadAverage: os.loadavg()
            }
        },
        performance: {
            averageResponseTime: `${systemStats.averageResponseTime.toFixed(2)}ms`,
            totalRequests: systemStats.requestCount,
            totalErrors: systemStats.errorCount,
            errorRate: systemStats.requestCount > 0 
                ? `${((systemStats.errorCount / systemStats.requestCount) * 100).toFixed(2)}%`
                : '0%'
        }
    };
};

// Log system stats periodically
setInterval(() => {
    const stats = getSystemStats();
    logger.performance('System Stats', {
        memory: stats.current.memory,
        uptime: stats.current.uptime.formatted,
        requests: stats.performance.totalRequests,
        errors: stats.performance.totalErrors,
        avgResponseTime: stats.performance.averageResponseTime
    });
}, 60000); // Every minute
