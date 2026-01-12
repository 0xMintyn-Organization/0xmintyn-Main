# Advanced Logging Implementation Guide

## Overview
This document describes the comprehensive logging system implemented to track all server operations, diagnose crashes, and monitor performance.

## Features Implemented

### 1. **Request Correlation & Context Tracking**
- ✅ Unique Request ID for every request (stored in `X-Request-ID` header)
- ✅ AsyncLocalStorage for maintaining context across async operations
- ✅ Automatic context injection in all logs
- ✅ User ID and IP tracking in logs

### 2. **Comprehensive Request/Response Logging**
- ✅ Incoming request logging (method, URL, headers, body size, memory)
- ✅ Response logging (status, duration, size, memory delta)
- ✅ Performance warnings for slow requests (>1000ms)
- ✅ Memory warnings for high usage (>500MB)
- ✅ Separate HTTP log file

### 3. **Database Query Logging**
- ✅ Automatic logging of all Mongoose queries
- ✅ Query details (model, operation, conditions, options)
- ✅ Execution time tracking
- ✅ Slow query warnings (>100ms)
- ✅ Error logging with stack traces
- ✅ Separate database log file

### 4. **System Monitoring**
- ✅ Memory usage tracking (heap, RSS, external)
- ✅ CPU usage monitoring
- ✅ Uptime tracking
- ✅ Request/error statistics
- ✅ Average response time calculation
- ✅ Error rate calculation
- ✅ Periodic system stats logging (every minute)

### 5. **Crash Detection & Reporting**
- ✅ Uncaught exception handlers with detailed context
- ✅ Unhandled promise rejection handlers
- ✅ Crash reports with:
  - Error details (name, message, stack)
  - System state (memory, uptime, PID)
  - Node.js version
  - Timestamp
- ✅ Separate exception and rejection log files

### 6. **Health Check Endpoints**
- ✅ `/api/v1/health` - Basic health check
- ✅ `/api/v1/health/detailed` - Comprehensive diagnostics
- ✅ `/api/v1/health/crash-report` - Current system state

### 7. **Structured Logging**
- ✅ JSON format for production (easy parsing)
- ✅ Colorized console output for development
- ✅ Log levels: error, warn, info, debug, verbose
- ✅ Separate log files by type:
  - `error.log` - Errors only
  - `warn.log` - Warnings
  - `combined.log` - All logs
  - `http.log` - HTTP requests
  - `database.log` - Database operations
  - `performance.log` - Performance metrics
  - `exceptions.log` - Uncaught exceptions
  - `rejections.log` - Unhandled rejections

## Log Files Location
All logs are stored in: `Backend/logs/`

### Log File Descriptions

1. **error.log** - Only error level logs
2. **warn.log** - Warning level logs
3. **combined.log** - All log levels
4. **http.log** - HTTP request/response logs
5. **database.log** - Database query logs
6. **performance.log** - Performance metrics and slow operations
7. **exceptions.log** - Uncaught exceptions with full context
8. **rejections.log** - Unhandled promise rejections

## Usage Examples

### Basic Logging
```typescript
import logger from './utils/logger';

// Error logging
logger.error('Operation failed', {
    userId: user._id,
    operation: 'createProduct',
    error: error.message
});

// Info logging
logger.info('User logged in', {
    userId: user._id,
    email: user.email,
    ip: req.ip
});

// Debug logging
logger.debug('Processing request', {
    requestId: req.headers['x-request-id'],
    body: req.body
});
```

### Operation Tracking
```typescript
// Track operations
logger.operation('createProduct', {
    productId: product._id,
    sellerId: seller._id,
    price: product.price
});
```

### HTTP Logging
```typescript
// HTTP-specific logging
logger.http('Request processed', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: '150ms'
});
```

### Database Logging
```typescript
// Database operations are automatically logged
// But you can add custom database logs:
logger.database('Custom DB operation', {
    operation: 'bulkUpdate',
    affectedRows: 100
});
```

### Performance Logging
```typescript
// Performance metrics
logger.performance('Slow operation detected', {
    operation: 'complexQuery',
    duration: '2500ms',
    threshold: '1000ms'
});
```

### Crash Reporting
```typescript
// Crash logging (usually automatic, but can be manual)
logger.crash(error, {
    context: 'paymentProcessing',
    userId: user._id,
    orderId: order._id
});
```

## Request ID Tracking

Every request gets a unique ID that appears in all related logs:

```typescript
// Request ID is automatically added to all logs
// You can access it via:
import { getRequestContext } from './utils/logger';
const context = getRequestContext();
console.log(context.requestId); // e.g., "req-1234567890-abc123"
```

## Health Check Endpoints

### Basic Health Check
```bash
GET /api/v1/health
```
Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "connected": true
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### Detailed Diagnostics
```bash
GET /api/v1/health/detailed
```
Returns comprehensive system information including:
- System stats (memory, CPU, uptime)
- Database status and latency
- Application info
- Performance metrics
- Health checks

### Crash Report
```bash
GET /api/v1/health/crash-report
```
Returns current system state for crash analysis.

## Environment Variables

```bash
# Log level (error, warn, info, debug, verbose, silly)
LOG_LEVEL=info

# Node environment (affects console logging)
NODE_ENV=production
```

## Log Rotation

- Maximum file size: 10MB per log file
- Maximum files: 10 files per log type
- Automatic rotation when size limit reached
- Old files are automatically deleted

## Crash Diagnosis

When a crash occurs, check these files in order:

1. **exceptions.log** - Uncaught exceptions
2. **rejections.log** - Unhandled promise rejections
3. **error.log** - Recent errors before crash
4. **combined.log** - Full context of operations

Each crash log includes:
- Full error stack trace
- System memory state
- Process uptime
- Node.js version
- Timestamp
- Request context (if available)

## Performance Monitoring

Monitor these metrics:

1. **Average Response Time** - Tracked in system stats
2. **Slow Requests** - Logged in performance.log (>1000ms)
3. **Slow Queries** - Logged in performance.log (>100ms)
4. **Memory Usage** - Tracked and logged every minute
5. **Error Rate** - Calculated from total requests/errors

## Best Practices

1. **Use appropriate log levels:**
   - `error` - For errors that need attention
   - `warn` - For warnings that might indicate issues
   - `info` - For important events
   - `debug` - For detailed debugging information

2. **Include context:**
   ```typescript
   logger.error('Operation failed', {
       userId: user._id,
       operation: 'createOrder',
       orderId: order._id,
       error: error.message
   });
   ```

3. **Use operation tracking for important events:**
   ```typescript
   logger.operation('orderCreated', {
       orderId: order._id,
       userId: user._id,
       total: order.total
   });
   ```

4. **Don't log sensitive data:**
   - Never log passwords, tokens, or credit card numbers
   - Mask sensitive information if needed

## Monitoring & Alerts

Set up monitoring for:
- High error rates (>5%)
- Slow average response times (>500ms)
- High memory usage (>1GB)
- Database connection failures
- Uncaught exceptions

## Troubleshooting

### Server keeps restarting
1. Check `exceptions.log` for uncaught exceptions
2. Check `rejections.log` for unhandled rejections
3. Check `error.log` for recent errors
4. Review system stats in detailed health check

### Performance issues
1. Check `performance.log` for slow operations
2. Check `database.log` for slow queries
3. Review system stats for memory/CPU issues

### Missing logs
1. Verify `logs/` directory exists and is writable
2. Check `LOG_LEVEL` environment variable
3. Verify disk space availability

## Integration with Monitoring Tools

Logs are in JSON format, making them easy to integrate with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic
- Splunk
- CloudWatch

## Summary

This logging system provides:
- ✅ Complete request/response tracking
- ✅ Database operation monitoring
- ✅ System health monitoring
- ✅ Crash detection and reporting
- ✅ Performance tracking
- ✅ Request correlation
- ✅ Structured, parseable logs
- ✅ Automatic log rotation

All logs include request IDs, timestamps, and context for easy debugging and crash diagnosis.
