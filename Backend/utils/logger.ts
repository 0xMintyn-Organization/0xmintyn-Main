import winston from 'winston';

// Create logger configuration
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mintyn-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
    
    // File transports for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper functions
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: any) => {
  logger.error(message, { error: error?.message || error, stack: error?.stack });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Blockchain-specific logging helpers
export const logBlockchainTransaction = (operation: string, txHash?: string, meta?: any) => {
  logger.info(`Blockchain ${operation}`, { 
    operation, 
    txHash, 
    timestamp: new Date().toISOString(),
    ...meta 
  });
};

export const logUbiActivity = (activity: string, user?: string, amount?: string, meta?: any) => {
  logger.info(`UBI ${activity}`, { 
    activity, 
    user, 
    amount,
    timestamp: new Date().toISOString(),
    ...meta 
  });
};

export const logGovernanceActivity = (activity: string, proposalId?: string, voter?: string, meta?: any) => {
  logger.info(`Governance ${activity}`, { 
    activity, 
    proposalId, 
    voter,
    timestamp: new Date().toISOString(),
    ...meta 
  });
};

export default logger;




