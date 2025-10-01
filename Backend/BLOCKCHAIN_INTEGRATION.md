# Mintyn Blockchain Integration

This document provides a comprehensive overview of the blockchain integration for the Mintyn platform, including smart contract clients, API endpoints, and background services.

## Architecture Overview

The blockchain integration consists of several key components:

1. **Solana Client Manager** - Manages connections to Solana RPC endpoints with failover and rate limiting
2. **Smart Contract Clients** - TypeScript clients for interacting with each program
3. **MongoDB Schemas** - Database models that mirror smart contract account structures
4. **Redis Caching** - Performance optimization and real-time data caching
5. **Background Workers** - Automated blockchain data synchronization and event processing
6. **API Endpoints** - RESTful and WebSocket endpoints for frontend integration

## Smart Contract Programs

### 1. UBI Distribution Program
- **Program ID**: `CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN`
- **Features**: 
  - User registration with identity verification
  - Welcome bonus distribution
  - Initial UBI claim ($2000 equivalent)
  - Monthly UBI claims ($1000 equivalent)
  - Fraud detection and reporting
  - Admin controls for user management

### 2. Digital Marketplace Program
- **Program ID**: `FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS`
- **Features**:
  - NFT listing and purchasing
  - Escrow-based transactions
  - Category-based organization
  - Price history tracking
  - Fee collection

### 3. Governance Program
- **Program ID**: `FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS`
- **Features**:
  - Proposal creation and voting
  - Token-weighted voting system
  - Proposal execution
  - Treasury management
  - Configurable governance parameters

### 4. P2P Exchange Program
- **Program ID**: `FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS`
- **Features**:
  - Order book management
  - Trade execution
  - Fee collection
  - Market depth tracking
  - Order matching

### 5. Cross-Chain Bridge Program
- **Program ID**: `FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS`
- **Features**:
  - Multi-chain asset bridging
  - Guardian-based security
  - Daily limits and controls
  - Cross-chain transaction tracking

## API Endpoints

### UBI Endpoints (`/api/v1/blockchain/ubi`)

#### Public Endpoints
- `GET /config` - Get UBI configuration
- `GET /treasury` - Get treasury information
- `GET /user/:publicKey` - Get user profile
- `GET /user/:publicKey/balance` - Get user token balance
- `GET /user/:publicKey/eligibility` - Check claim eligibility
- `GET /stats` - Get system statistics

#### User Endpoints (Authenticated)
- `POST /initialize-user` - Initialize new user
- `POST /claim-initial` - Claim initial UBI
- `POST /claim-monthly` - Claim monthly UBI
- `POST /report-fraud` - Report fraudulent activity

#### Admin Endpoints (Admin Authentication Required)
- `POST /admin/fund-treasury` - Fund treasury
- `POST /admin/verify-user` - Verify user identity
- `POST /admin/suspend-user` - Suspend/unsuspend user
- `POST /admin/toggle-program` - Toggle program active state
- `POST /admin/update-amounts` - Update UBI amounts
- `GET /fraud-alerts` - Get fraud alerts

### Marketplace Endpoints (`/api/v1/blockchain/marketplace`)

#### Public Endpoints
- `GET /listings` - Get marketplace listings with search/filter
- `GET /listings/active` - Get active listings
- `GET /listings/trending` - Get trending listings
- `GET /listings/:id` - Get specific listing
- `GET /listings/seller/:publicKey` - Get listings by seller
- `GET /listings/category/:category` - Get listings by category
- `GET /stats` - Get marketplace statistics
- `GET /sales` - Get sales history

#### User Endpoints (Authenticated)
- `POST /listings` - Create new listing
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Cancel listing
- `POST /purchase` - Purchase item
- `POST /view/:id` - Record listing view
- `POST /favorite/:id` - Toggle favorite
- `GET /recommendations/:user` - Get recommendations
- `GET /user/:publicKey/stats` - Get user marketplace stats
- `GET /user/:publicKey/activity` - Get user activity

### Governance Endpoints (`/api/v1/blockchain/governance`)

#### Public Endpoints
- `GET /config` - Get governance configuration
- `GET /proposals` - Get proposals with search/filter
- `GET /proposals/active` - Get active proposals
- `GET /proposals/:id` - Get specific proposal
- `GET /proposals/:id/votes` - Get proposal votes
- `GET /user/:publicKey/voting-power` - Get user voting power
- `GET /user/:publicKey/proposals` - Get user's proposals
- `GET /user/:publicKey/votes` - Get user's votes
- `GET /user/:publicKey/profile` - Get voter profile
- `GET /stats` - Get governance statistics

#### User Endpoints (Authenticated)
- `POST /proposals` - Create new proposal
- `POST /vote` - Cast vote
- `POST /proposals/:id/execute` - Execute proposal

#### Admin Endpoints (Admin Authentication Required)
- `POST /admin/cancel-proposal` - Cancel proposal
- `POST /admin/update-config` - Update governance config

### System Endpoints (`/api/v1/blockchain`)

- `GET /health` - System health check
- `GET /overview` - System overview
- `GET /user/:publicKey/overview` - User overview across all programs
- `GET /programs` - Get all programs info
- `GET /connection/stats` - Connection statistics
- `GET /cache/stats` - Cache statistics
- `POST /cache/clear` - Clear cache (admin)
- `GET /worker/status` - Worker status
- `POST /worker/start` - Start worker (admin)
- `POST /worker/stop` - Stop worker (admin)
- `GET /analytics/daily` - Daily analytics
- `GET /analytics/trends` - Trend analysis
- `GET /events/channels` - WebSocket event channels
- `POST /batch` - Batch operations

## MongoDB Schemas

### UBI Models
- `UbiConfig` - Program configuration
- `UserProfile` - User profiles with claim history
- `FraudDetection` - Fraud detection records
- `Treasury` - Treasury information with transaction history
- `UbiEvent` - Blockchain events

### Marketplace Models
- `MarketplaceConfig` - Marketplace configuration
- `MarketplaceListing` - NFT listings with metadata
- `MarketplaceSale` - Sale records
- `UserActivity` - User activity tracking
- `MarketplaceEvent` - Marketplace events

### Governance Models
- `GovernanceConfig` - Governance configuration
- `Proposal` - Proposals with voting history
- `Vote` - Individual votes
- `VoterProfile` - Voter statistics
- `GovernanceEvent` - Governance events

### Exchange Models
- `ExchangeConfig` - Exchange configuration
- `ExchangeOrder` - Trading orders
- `Trade` - Trade records
- `OrderBook` - Aggregated order book data
- `MarketStats` - Market statistics
- `ExchangeEvent` - Exchange events

### Bridge Models
- `BridgeConfig` - Bridge configuration
- `BridgeRequest` - Bridge requests
- `GuardianSignature` - Guardian signatures
- `SupportedToken` - Supported tokens
- `BridgeStats` - Bridge statistics
- `BridgeEvent` - Bridge events

## Redis Caching Strategy

### Cache Keys Pattern
- `mintyn:ubi:config:*` - UBI configuration
- `mintyn:ubi:profile:*` - User profiles
- `mintyn:ubi:fraud:*` - Fraud detection data
- `mintyn:marketplace:listing:*` - Individual listings
- `mintyn:marketplace:active_listings` - Active listings
- `mintyn:marketplace:stats` - Marketplace statistics
- `mintyn:governance:proposal:*` - Individual proposals
- `mintyn:governance:active_proposals` - Active proposals
- `mintyn:governance:voting_power:*` - User voting power
- `mintyn:exchange:orderbook:*` - Order book data
- `mintyn:exchange:stats:*` - Market statistics
- `mintyn:bridge:request:*` - Bridge requests
- `mintyn:bridge:stats` - Bridge statistics

### TTL Settings
- **Short TTL (60s)**: Real-time data (order books, active listings)
- **Default TTL (300s)**: User data, proposals, requests
- **Long TTL (3600s)**: Configuration data, statistics

### Rate Limiting
- API endpoints: 1000 requests per 15 minutes
- Authentication endpoints: 200 requests per 15 minutes
- Blockchain operations: 10 requests per second per endpoint

## Background Worker Services

### Synchronization Jobs
- **Sync Interval**: Every 5 minutes
- **Tasks**:
  - Sync UBI configuration and treasury data
  - Update active marketplace listings
  - Refresh governance proposals and voting status
  - Update exchange order books and market data
  - Monitor bridge requests and signatures

### Event Processing Jobs
- **Processing Interval**: Every minute
- **Tasks**:
  - Process unhandled blockchain events
  - Send notifications for user actions
  - Update database records from events
  - Trigger admin alerts for fraud reports

### Cache Warmup Jobs
- **Warmup Interval**: Every 6 hours
- **Tasks**:
  - Pre-populate frequently accessed data
  - Refresh configuration caches
  - Update analytics data

### Cleanup Jobs
- **Cleanup Interval**: Daily at 2 AM
- **Tasks**:
  - Remove expired cache keys
  - Archive old event records
  - Generate daily statistics
  - Database maintenance tasks

## WebSocket Events

### Real-time Channels
- `notifications` - User notifications
- `admin_alerts` - Administrative alerts
- `marketplace_updates` - Marketplace updates
- `governance_updates` - Governance updates
- `exchange_updates` - Trading updates
- `bridge_updates` - Bridge status updates

## Error Handling

### Blockchain Errors
- Connection failures with automatic retry
- Transaction failures with detailed error messages
- RPC rate limiting with exponential backoff
- Invalid account states with fallback to cache

### API Errors
- Standardized error response format
- Detailed error codes for frontend handling
- Request validation with clear error messages
- Authentication and authorization errors

## Security Considerations

### Private Key Handling
- Never store private keys in database
- Require private keys in request body for transactions
- Validate key ownership before operations
- Use secure key derivation for admin operations

### Admin Authentication
- Role-based access control for admin endpoints
- Multi-signature requirements for critical operations
- Audit logging for all admin actions
- Rate limiting for admin endpoints

### Data Validation
- Input validation for all blockchain parameters
- Public key format validation
- Amount and parameter range checking
- SQL injection prevention in database queries

## Performance Optimization

### Connection Management
- Connection pooling with multiple RPC endpoints
- Automatic failover to healthy endpoints
- Round-robin load balancing
- Connection health monitoring

### Caching Strategy
- Multi-tier caching (Redis + in-memory)
- Cache warming for frequently accessed data
- Intelligent cache invalidation
- Cache compression for large datasets

### Database Optimization
- Optimized indexes for query performance
- Connection pooling and query optimization
- Read replicas for analytics queries
- Data archival for old records

## Monitoring and Analytics

### Health Monitoring
- Real-time health checks for all services
- Performance metrics collection
- Error rate monitoring
- Resource usage tracking

### Business Analytics
- Daily/weekly/monthly statistics
- User behavior analysis
- Transaction volume tracking
- Program performance metrics

## Deployment

### Environment Configuration
- Copy `env.example.blockchain` to `.env`
- Configure all required environment variables
- Set up MongoDB and Redis instances
- Configure Solana RPC endpoints

### Installation
```bash
npm install
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## API Usage Examples

### Initialize UBI User
```javascript
const response = await fetch('/api/v1/blockchain/ubi/initialize-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    identityHash: 'unique-identity-hash',
    referralCode: 'optional-referral-code',
    privateKey: '[1,2,3,...]' // JSON array of bytes
  })
});
```

### Create Marketplace Listing
```javascript
const response = await fetch('/api/v1/blockchain/marketplace/listings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    sellerPrivateKey: '[1,2,3,...]',
    nftMint: 'NFT_MINT_ADDRESS',
    price: '1000000000', // In lamports
    title: 'My NFT',
    description: 'Description of the NFT',
    category: 'art'
  })
});
```

### Cast Governance Vote
```javascript
const response = await fetch('/api/v1/blockchain/governance/vote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    voterPrivateKey: '[1,2,3,...]',
    proposal: 'PROPOSAL_ADDRESS',
    vote: true, // true for yes, false for no
    votingPower: '1000000000'
  })
});
```

## Troubleshooting

### Common Issues
1. **RPC Connection Errors**: Check endpoint URLs and network connectivity
2. **Cache Miss**: Verify Redis connection and configuration
3. **Database Sync Issues**: Check worker service status and logs
4. **Authentication Failures**: Verify JWT tokens and user permissions

### Debug Mode
Set `NODE_ENV=development` and `DEBUG_LEVEL=debug` for detailed logging.

### Log Analysis
All blockchain operations are logged with transaction hashes for traceability.

## Support

For technical support and questions, please refer to the main project documentation or contact the development team.





















