import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Request context storage (using AsyncLocalStorage for async context)
import { AsyncLocalStorage } from 'async_hooks';
export const requestContext = new AsyncLocalStorage<{ requestId: string; userId?: string; ip?: string }>();

// Helper to get current request context
export const getRequestContext = () => {
    return requestContext.getStore() || { requestId: 'system' };
};

// Define log format with request context
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format((info) => {
        // Add request context to all logs
        const context = getRequestContext();
        info.requestId = context.requestId;
        if (context.userId) info.userId = context.userId;
        if (context.ip) info.ip = context.ip;
        return info;
    })(),
    winston.format.json()
);

// Console format for development with better formatting
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, requestId, userId, ip, ...meta }) => {
        const context = [];
        if (requestId) context.push(`[${requestId.substring(0, 8)}]`);
        if (userId) context.push(`[User:${userId}]`);
        if (ip) context.push(`[IP:${ip}]`);
        
        let msg = `${timestamp} ${context.join(' ')} [${level}]: ${message}`;
        
        // Skip JSON block for API / performance logs – message already has the detail
        const skipMeta = meta.type === 'http' || meta.type === 'performance';
        if (!skipMeta) {
            const metaKeys = Object.keys(meta);
            const cleanMeta: any = {};
            metaKeys.forEach(key => {
                if (!['service', 'timestamp', 'level', 'message', 'type', 'context', 'environment', 'version'].includes(key)) {
                    cleanMeta[key] = meta[key];
                }
            });
            if (Object.keys(cleanMeta).length > 0) {
                msg += ` ${JSON.stringify(cleanMeta)}`;
            }
        }
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'equalmint-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Separate error log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        // Warning log
        new winston.transports.File({
            filename: path.join(logsDir, 'warn.log'),
            level: 'warn',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        // Combined log (all levels)
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        // HTTP requests log
        new winston.transports.File({
            filename: path.join(logsDir, 'http.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        // Database operations log
        new winston.transports.File({
            filename: path.join(logsDir, 'database.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        // Performance log
        new winston.transports.File({
            filename: path.join(logsDir, 'performance.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Enhanced logger methods with context
const createLoggerWithContext = () => {
    const context = getRequestContext();
    
    return {
        error: (message: string, meta?: any) => {
            logger.error(message, { ...meta, context });
        },
        warn: (message: string, meta?: any) => {
            logger.warn(message, { ...meta, context });
        },
        info: (message: string, meta?: any) => {
            logger.info(message, { ...meta, context });
        },
        debug: (message: string, meta?: any) => {
            logger.debug(message, { ...meta, context });
        },
        verbose: (message: string, meta?: any) => {
            logger.verbose(message, { ...meta, context });
        },
        // Specialized loggers
        http: (message: string, meta?: any) => {
            logger.info(message, { ...meta, type: 'http', context });
        },
        database: (message: string, meta?: any) => {
            logger.info(message, { ...meta, type: 'database', context });
        },
        performance: (message: string, meta?: any) => {
            logger.info(message, { ...meta, type: 'performance', context });
        },
        operation: (operation: string, meta?: any) => {
            logger.info(`Operation: ${operation}`, { ...meta, type: 'operation', operation, context });
        },
        crash: (error: Error, context?: any) => {
            logger.error('CRASH DETECTED', {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
                system: {
                    memory: process.memoryUsage(),
                    uptime: process.uptime(),
                    pid: process.pid,
                    nodeVersion: process.version,
                },
                context: context || getRequestContext(),
                timestamp: new Date().toISOString()
            });
        }
    };
};

// Export default logger with context support
const defaultLogger = createLoggerWithContext();

// Create a stream object for HTTP request logger
export const loggerStream = {
    write: (message: string) => {
        defaultLogger.http(message.trim());
    },
};

// Export both default logger and context-aware logger
export default defaultLogger;
export { createLoggerWithContext, requestContext };
