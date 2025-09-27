# Mintyn Protocol - Solana Smart Contracts

A comprehensive suite of Solana programs providing UBI distribution, digital marketplace, governance, and P2P exchange functionality.

## 🏗️ Architecture Overview

The Mintyn Protocol consists of four interconnected Solana programs:

### 1. **UBI Program** (`mintyn-ubi-distribution`)
- **Purpose**: Universal Basic Income distribution system
- **Features**: Welcome bonuses, initial UBI, monthly recurring payments, anti-fraud measures
- **Program ID**: `CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN`

### 2. **Marketplace Program** (`mintyn-marketplace`)
- **Purpose**: Digital product marketplace with escrow functionality
- **Features**: Product listing, secure purchases, creator royalties, dispute resolution
- **Program ID**: `MktpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN`

### 3. **Governance Program** (`mintyn-governance`)
- **Purpose**: Decentralized governance with token-weighted voting
- **Features**: Proposal creation, voting, delegation, time-locked execution
- **Program ID**: `GovnE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN`

### 4. **P2P Exchange Program** (`mintyn-p2p-exchange`)
- **Purpose**: Peer-to-peer cryptocurrency exchange with fiat integration
- **Features**: Order book, escrow trading, reputation system, dispute resolution
- **Program ID**: `P2PE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN`

## 🚀 Quick Start

### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Install Node.js dependencies
npm install
```

### Deploy All Programs

```bash
# Deploy to devnet
npm run deploy:devnet

# Deploy to mainnet
npm run deploy:mainnet
```

### Deploy Individual Programs

```bash
# UBI Program
cd mintyn-ubi-distribution && npm run deploy:devnet

# Marketplace Program
cd mintyn-marketplace && npm run deploy:devnet

# Governance Program
cd mintyn-governance && npm run deploy:devnet

# P2P Exchange Program
cd mintyn-p2p-exchange && npm run deploy:devnet
```

## 📊 Program Details

### UBI Program Features

- **Welcome Bonus**: $200 immediate distribution upon registration
- **Initial UBI**: One-time $2,000 distribution after verification
- **Monthly UBI**: Recurring $1,000 monthly payments
- **Anti-Fraud**: Identity verification, risk scoring, activity monitoring
- **Admin Controls**: User verification, suspension, amount updates

### Marketplace Program Features

- **Product Listing**: Digital and physical products with metadata
- **Escrow System**: Secure payment holding until delivery confirmation
- **Creator Royalties**: Configurable royalty payments to original creators
- **Dispute Resolution**: Admin-mediated dispute handling
- **Verification System**: Creator verification and reputation tracking

### Governance Program Features

- **Proposal Creation**: Community-driven proposal system
- **Token-Weighted Voting**: Voting power based on token holdings
- **Delegation**: Ability to delegate voting power to other users
- **Time-Locked Execution**: Delayed execution for security
- **Quorum Requirements**: Minimum participation thresholds

### P2P Exchange Program Features

- **Order Book**: Buy/sell order management with price discovery
- **Multi-Currency Support**: USD, EUR, GBP, and other fiat currencies
- **Payment Methods**: Bank transfer, PayPal, Wise, and more
- **Reputation System**: User rating and trust scoring
- **Escrow Trading**: Secure token holding during fiat transactions

## 🔐 Security Features

### Common Security Measures

- **PDA-based Account Derivation**: Secure, deterministic account creation
- **Access Control**: Role-based permissions and authorization
- **Arithmetic Overflow Protection**: Safe math operations
- **Input Validation**: Comprehensive parameter checking
- **Event Emission**: Complete audit trail through events

### Program-Specific Security

#### UBI Program
- Identity hash uniqueness enforcement
- Verification score requirements
- Time-based distribution limits
- Risk scoring and automatic flagging

#### Marketplace Program
- Escrow-based payment protection
- Creator royalty enforcement
- Product authenticity verification
- Dispute mediation system

#### Governance Program
- Proposal threshold requirements
- Quorum validation
- Execution delay protection
- Delegation verification

#### P2P Exchange Program
- Multi-party escrow systems
- Reputation-based trading limits
- Payment proof requirements
- Dispute resolution mechanisms

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Individual Program Tests

```bash
# UBI Program
cd mintyn-ubi-distribution && npm test

# Marketplace Program
cd mintyn-marketplace && npm test

# Governance Program
cd mintyn-governance && npm test

# P2P Exchange Program
cd mintyn-p2p-exchange && npm test
```

### Test Coverage

Each program includes comprehensive tests covering:
- Happy path scenarios
- Edge cases and error conditions
- Security validations
- State transitions
- Event emissions

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Solana CLI installed and configured
- [ ] Sufficient SOL balance for deployment
- [ ] Network configuration verified
- [ ] All dependencies installed
- [ ] Programs successfully compiled

### Post-Deployment

- [ ] Program accounts initialized
- [ ] Token mints created (where applicable)
- [ ] Admin permissions configured
- [ ] Frontend environment variables updated
- [ ] Integration tests passed
- [ ] Monitoring systems configured

## 🌐 Network Configuration

### Devnet Deployment

```bash
# Set Solana CLI to devnet
solana config set --url https://api.devnet.solana.com

# Request airdrop for testing
solana airdrop 5

# Deploy programs
npm run deploy:devnet
```

### Mainnet Deployment

```bash
# Set Solana CLI to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Ensure sufficient SOL balance
solana balance

# Deploy programs
npm run deploy:mainnet
```

## 📚 API Documentation

### UBI Program

```typescript
// Initialize user and get welcome bonus
await program.methods.initializeUser(identityHash, referralCode)

// Claim initial UBI ($2000)
await program.methods.claimInitialUbi()

// Claim monthly UBI ($1000)
await program.methods.claimMonthlyUbi()
```

### Marketplace Program

```typescript
// List a product
await program.methods.listProduct(name, description, price, category)

// Purchase a product
await program.methods.purchaseProduct(quantity)

// Confirm delivery
await program.methods.confirmDelivery()
```

### Governance Program

```typescript
// Create proposal
await program.methods.createProposal(title, description, instructions)

// Cast vote
await program.methods.castVote(voteType, weight)

// Execute proposal
await program.methods.executeProposal()
```

### P2P Exchange Program

```typescript
// Create trading order
await program.methods.createOrder(orderType, amount, price, currency)

// Accept order
await program.methods.acceptOrder(tradeAmount)

// Confirm payment
await program.methods.confirmPaymentReceived()
```

## 🔧 Environment Variables

### Required Environment Variables

```bash
# Solana Configuration
SOLANA_NETWORK=devnet
RPC_URL=https://api.devnet.solana.com
ADMIN_KEYPAIR_PATH=~/.config/solana/id.json

# Program IDs (auto-generated during deployment)
NEXT_PUBLIC_UBI_PROGRAM_ID=CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN
NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID=MktpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN
NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID=GovnE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN
NEXT_PUBLIC_P2P_EXCHANGE_PROGRAM_ID=P2PE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN
```

## 🚨 Troubleshooting

### Common Issues

#### Insufficient SOL Balance
```bash
# Check balance
solana balance

# Request airdrop (devnet only)
solana airdrop 5
```

#### Program Build Failures
```bash
# Clean and rebuild
anchor clean
anchor build
```

#### Deployment Failures
```bash
# Check program size
ls -la target/deploy/

# Verify network configuration
solana config get
```

#### Transaction Failures
- Ensure sufficient SOL for transaction fees
- Check account initialization requirements
- Verify signer permissions

### Getting Help

- **Documentation**: Check individual program README files
- **Tests**: Review test files for usage examples
- **Logs**: Enable verbose logging with `RUST_LOG=debug`
- **Community**: Join our Discord for support

## 📈 Monitoring and Analytics

### Key Metrics to Track

#### UBI Program
- Total users registered
- Total UBI distributed
- Fraud detection alerts
- Distribution success rates

#### Marketplace Program
- Total products listed
- Sales volume and revenue
- Dispute resolution rates
- Creator earnings

#### Governance Program
- Active proposals
- Voting participation rates
- Proposal success rates
- Token distribution

#### P2P Exchange Program
- Trading volume
- Active orders
- User reputation scores
- Dispute rates

### Monitoring Tools

- **Solana Explorer**: Track transactions and accounts
- **Custom Dashboards**: Monitor program-specific metrics
- **Event Listeners**: Real-time activity monitoring
- **Alert Systems**: Automated notifications for issues

## 🔄 Upgrade and Maintenance

### Program Upgrades

```bash
# Upgrade program
anchor upgrade <program-id> target/deploy/<program>.so

# Verify upgrade
solana program show <program-id>
```

### Maintenance Tasks

- Regular security audits
- Performance optimization
- Bug fixes and patches
- Feature enhancements
- Documentation updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core program development
- [x] Security implementation
- [x] Testing framework
- [x] Deployment scripts

### Phase 2 (Next)
- [ ] Advanced governance features
- [ ] Cross-program integrations
- [ ] Enhanced fraud detection
- [ ] Mobile SDK development

### Phase 3 (Future)
- [ ] Layer 2 scaling solutions
- [ ] Cross-chain bridges
- [ ] AI-powered features
- [ ] Enterprise integrations

---

**Built with ❤️ by the Mintyn Team**

For more information, visit our [website](https://mintyn.com) or join our [Discord community](https://discord.gg/mintyn).














