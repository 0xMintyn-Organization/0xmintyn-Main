# Admin Guide - UBI Platform

This guide is for **administrators only**. These functions require special permissions and access to the authority wallet.

## ⚠️ Important Security Notes

- **Never commit wallet private keys to version control**
- **Always use environment variables for sensitive data**
- **Test on Devnet before Mainnet operations**
- **Keep your authority wallet secure and backed up**

## 🔑 Prerequisites

1. **Authority Wallet Setup**
   - You need access to the authority wallet that controls the UBI program
   - Wallet file should be at: `~/.config/solana/my-mintyn-wallet.json` (in WSL/Linux)
   - Or configured via environment variables

2. **Required Tools**
   - Node.js 18+
   - npm 9+
   - Solana CLI (optional, for advanced operations)

3. **Network Configuration**
   - Default RPC endpoint: set `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable
   - For Mainnet, update RPC URLs in scripts

## 📊 Treasury Management

### Check Treasury Balance

Quick check of current treasury status:

```bash
npm run admin:check-treasury
```

**Output includes:**
- Treasury address
- Current balance in tokens
- Number of supported users
- Health status (LOW/MEDIUM/HEALTHY)
- Explorer link

**Example Output:**
```
🔍 Checking Treasury Balance...

📋 Treasury Address: GTsRbdRGvkgEwR1pBNFbdUXto7uxEkPdkep8PhB1FAY6
🔗 Explorer: https://explorer.solana.com/address/...

✅ Treasury Status: ACTIVE
💰 Balance: 1,000,051.9 tokens
👥 Supported Users: 50,002
✅ Status: HEALTHY
```

### Fund Treasury

#### Interactive Funding

```bash
npm run admin:fund-treasury
```

This will prompt you for:
- Amount to transfer
- Confirmation

#### Quick Funding (Predefined Amounts)

```bash
# Fund with 1 million tokens
npm run admin:fund-treasury:1m

# Fund with 500K tokens
npm run admin:fund-treasury:500k

# Fund with 100K tokens
npm run admin:fund-treasury:100k
```

**What happens:**
1. Checks authority wallet balance
2. Creates/verifies authority token account
3. Transfers tokens from authority to treasury
4. Confirms transaction
5. Shows updated treasury balance

**Requirements:**
- Authority wallet must have sufficient token balance
- Authority wallet must have SOL for transaction fees (~0.000005 SOL per transaction)

## 🚀 Program Initialization

### Initialize UBI Program

**⚠️ Only run this once!** The program can only be initialized once.

```bash
npm run admin:initialize
```

**What this does:**
1. Creates the `ubi_program` PDA account
2. Creates the `treasury` PDA account
3. Sets initial program state
4. Configures program parameters

**Before running:**
- Ensure you have sufficient SOL in authority wallet (~0.1 SOL recommended)
- Verify you're on the correct network (Devnet/Mainnet)
- Check that program hasn't been initialized already

**Check if already initialized:**
```bash
npm run admin:check-treasury
# If treasury exists, program is already initialized
```

## 🔍 Monitoring & Maintenance

### Regular Checks

**Daily:**
- Check treasury balance: `npm run admin:check-treasury`
- Monitor supported users count
- Check for any errors in logs

**Weekly:**
- Review treasury health status
- Plan funding if balance is getting low
- Review user registration trends

**Monthly:**
- Full system audit
- Review smart contract performance
- Update documentation if needed

### Treasury Health Thresholds

| Status | Balance Range | Action Required |
|--------|---------------|-----------------|
| **HEALTHY** | > 1,000 tokens | None - Monitor |
| **MEDIUM** | 100 - 1,000 tokens | Consider funding soon |
| **LOW** | < 100 tokens | **Fund immediately!** |

### Supported Users Calculation

Each registered user requires **20 tokens** in the treasury.

```
Supported Users = Treasury Balance / 20
```

**Example:**
- 1,000,000 tokens = 50,000 supported users
- 100,000 tokens = 5,000 supported users
- 10,000 tokens = 500 supported users

## 🛠️ Advanced Operations

### Manual Script Execution

If you need more control, you can run scripts directly:

```bash
# Check treasury
node scripts/check-treasury.js

# Fund treasury with custom amount
node scripts/auto-fund-treasury.js <amount>

# Initialize program
ts-node scripts/initialize-ubi-program.ts
```

### Using WSL (Windows)

If you're on Windows using WSL:

```bash
# Navigate to project
cd "/mnt/c/Users/Raja/Desktop/Work/Projects/UBI Platform/0xmintyn-Main/Frontend"

# Run admin commands
npm run admin:check-treasury
```

### Environment Variables

You can override defaults by setting environment variables:

```bash
# Custom RPC URL
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com npm run admin:check-treasury

# Custom wallet path
WALLET_PATH=/path/to/wallet.json npm run admin:fund-treasury:1m
```

## 📱 UI Admin Panel

You can also manage treasury through the web interface:

1. Navigate to: `app.equalmint.com/test-ubi`
2. Scroll to "Automated Treasury Management" section
3. Use the UI to:
   - Check treasury status
   - Fund treasury manually
   - View treasury analytics

**Note:** UI operations require Phantom wallet connection with authority wallet.

## 🐛 Troubleshooting

### Common Issues

#### 1. "Insufficient funds" error

**Problem:** Authority wallet doesn't have enough tokens or SOL

**Solution:**
```bash
# Check authority balance
solana balance <authority-address>

# Airdrop SOL (Devnet only)
solana airdrop 1 <authority-address>
```

#### 2. "Account not found" error

**Problem:** Treasury or program not initialized

**Solution:**
```bash
npm run admin:initialize
```

#### 3. "Transaction failed" error

**Problem:** Network issues or insufficient fees

**Solution:**
- Check network connection
- Ensure sufficient SOL for fees
- Try again after a few seconds

#### 4. "Wallet not found" error

**Problem:** Wallet file path incorrect

**Solution:**
- Verify wallet path in script
- Check WSL path mapping if on Windows
- Ensure wallet file has correct permissions

### Getting Help

1. Check script output for detailed error messages
2. Review Solana Explorer for transaction details
3. Check program logs
4. Contact development team with:
   - Error message
   - Transaction signature (if available)
   - Steps to reproduce

## 📋 Quick Reference

### Essential Commands

```bash
# Check status
npm run admin:check-treasury

# Fund treasury
npm run admin:fund-treasury:1m

# Initialize (first time only)
npm run admin:initialize
```

### Important Addresses

- **UBI Program ID:** `8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy`
- **Mintyn Mint:** `4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL`
- **Treasury PDA:** `GTsRbdRGvkgEwR1pBNFbdUXto7uxEkPdkep8PhB1FAY6`

### Explorer Links

- **Devnet Explorer:** https://explorer.solana.com/?cluster=devnet
- **Treasury Account:** https://explorer.solana.com/address/GTsRbdRGvkgEwR1pBNFbdUXto7uxEkPdkep8PhB1FAY6?cluster=devnet

## ✅ Best Practices

1. **Always check balance before funding**
2. **Keep treasury above 100K tokens for safety**
3. **Monitor daily during active periods**
4. **Document all admin operations**
5. **Test on Devnet before Mainnet**
6. **Keep wallet backups secure**
7. **Use environment variables for sensitive data**
8. **Review transaction signatures on Explorer**

---

**Last Updated:** [Current Date]
**Version:** 1.0.0

