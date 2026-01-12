import mongoose from 'mongoose';
import logger from '../utils/logger';
import { performance } from 'perf_hooks';

// Monkey patch mongoose to log all queries
const originalExec = mongoose.Query.prototype.exec;
const originalSave = mongoose.Document.prototype.save;

// Log query execution
mongoose.Query.prototype.exec = function(callback?: any) {
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
    
    const result = originalExec.call(this, (err: any, doc: any) => {
        const duration = performance.now() - startTime;
        
        if (err) {
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
        } else {
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
        }
        
        if (callback) callback(err, doc);
    });
    
    return result;
};

// Log document saves
mongoose.Document.prototype.save = function(options?: any, callback?: any) {
    const startTime = performance.now();
    const doc = this as any;
    const modelName = doc.constructor.modelName || 'Unknown';
    const docId = doc._id || 'new';
    
    logger.database(`Saving document ${modelName}`, {
        model: modelName,
        documentId: docId.toString(),
        operation: 'save'
    });
    
    const result = originalSave.call(this, options, (err: any, savedDoc: any) => {
        const duration = performance.now() - startTime;
        
        if (err) {
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
        } else {
            logger.database(`Saved document ${modelName}`, {
                model: modelName,
                documentId: docId.toString(),
                duration: `${duration.toFixed(2)}ms`
            });
        }
        
        if (callback) callback(err, savedDoc);
    });
    
    return result;
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
