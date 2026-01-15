import mongoose from 'mongoose';
import logger from '../utils/logger';
import { performance } from 'perf_hooks';

// Monkey patch mongoose to log all queries
const originalExec = mongoose.Query.prototype.exec;
const originalSave = mongoose.Document.prototype.save;

// Log query execution - Updated for Mongoose v7+ (promise-based only)
mongoose.Query.prototype.exec = function() {
    const startTime = performance.now();
    const query = this as any;
    const modelName = query.model?.modelName || 'Unknown';
    const operation = query.op || 'find';
    const conditions = query.getQuery();
    const options = query.getOptions();
    
    const logData = {
        model: modelName,
        operation,
        conditions: JSON.stringify(conditions),
        options: JSON.stringify(options),
        collection: query.model?.collection?.name || 'unknown'
    };
    
    logger.database(`Executing ${operation} on ${modelName}`, logData);
    
    // Call original exec (returns a promise in Mongoose v7+)
    const promise = originalExec.call(this);
    
    // Handle promise result
    promise
        .then((doc: any) => {
            const duration = performance.now() - startTime;
            const resultCount = Array.isArray(doc) ? doc.length : (doc ? 1 : 0);
            
            logger.database(`Completed ${operation} on ${modelName}`, {
                ...logData,
                resultCount,
                duration: `${duration.toFixed(2)}ms`
            });
            
            // Warn on slow queries
            if (duration > 100) {
                logger.performance(`Slow Query: ${operation} on ${modelName}`, {
                    ...logData,
                    duration: `${duration.toFixed(2)}ms`,
                    threshold: '100ms'
                });
            }
        })
        .catch((err: any) => {
            const duration = performance.now() - startTime;
            
            logger.database(`Database Error on ${operation}`, {
                ...logData,
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code,
                    stack: err.stack
                },
                duration: `${duration.toFixed(2)}ms`
            });
        });
    
    return promise;
};

// Log document saves - Updated for Mongoose v7+ (promise-based)
mongoose.Document.prototype.save = function(options?: any) {
    const startTime = performance.now();
    const doc = this as any;
    const modelName = doc.constructor.modelName || 'Unknown';
    const docId = doc._id || 'new';
    
    logger.database(`Saving document ${modelName}`, {
        model: modelName,
        documentId: docId.toString(),
        operation: 'save'
    });
    
    // Call original save (returns a promise in Mongoose v7+)
    const promise = originalSave.call(this, options);
    
    // Handle promise result
    promise
        .then((savedDoc: any) => {
            const duration = performance.now() - startTime;
            logger.database(`Saved document ${modelName}`, {
                model: modelName,
                documentId: docId.toString(),
                duration: `${duration.toFixed(2)}ms`
            });
        })
        .catch((err: any) => {
            const duration = performance.now() - startTime;
            logger.database(`Save Error on ${modelName}`, {
                model: modelName,
                documentId: docId.toString(),
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code,
                    stack: err.stack
                },
                duration: `${duration.toFixed(2)}ms`
            });
        });
    
    return promise;
};

// Log connection events
mongoose.connection.on('connected', () => {
    logger.database('MongoDB Connection Established', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
    });
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB Connection Disconnected');
});

mongoose.connection.on('error', (error: any) => {
    logger.database('MongoDB Connection Error', {
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
    });
});

mongoose.connection.on('reconnected', () => {
    logger.database('MongoDB Reconnected');
});

export default logger;
