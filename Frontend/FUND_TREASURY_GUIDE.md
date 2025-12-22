# How to Fund Treasury with 1 Million Tokens

## The Problem
Your Phantom wallet only has **0.1 tokens**, but the **10 million tokens** are in the **mint authority wallet**, not in your Phantom wallet.

## Solution: Use Command Line Script

The automated script uses the mint authority keypair (`~/.config/solana/my-mintyn-wallet.json`) which has all 10 million tokens.

### Step 1: Open WSL (Ubuntu-22.04)

### Step 2: Navigate to Frontend Directory
```bash
cd "/mnt/c/Users/Raja/Desktop/Work/Projects/UBI Platform/0xmintyn-Main/Frontend"
```

### Step 3: Run the Funding Script

**Option A: Fund 1 Million Tokens (Default)**
```bash
npm run fund-treasury:1m
```

**Option B: Fund Custom Amount**
```bash
node scripts/auto-fund-treasury.js 1000000
```

**Option C: Other Quick Options**
```bash
npm run fund-treasury:100k   # Fund 100K tokens
npm run fund-treasury:500k   # Fund 500K tokens
npm run fund-treasury:1m     # Fund 1M tokens
```

### What the Script Does:
1. ✅ Loads the mint authority keypair from `~/.config/solana/my-mintyn-wallet.json`
2. ✅ Checks your balance (should be 10M tokens)
3. ✅ Derives the treasury PDA address
4. ✅ Transfers the specified amount to treasury
5. ✅ Shows confirmation and explorer link

### Expected Output:
```
🤖 Automated Treasury Funding Script
=====================================
Target Amount: 1,000,000 tokens
📋 Treasury Address: [treasury PDA address]
✅ Loaded keypair from: /home/raja/.config/solana/my-mintyn-wallet.json
📝 Authority Address: Wo8BUGvvituc1v6Ns1M5dERyDZiFQYuy85wqu1F9S1v
💰 Your Balance: 10,000,000 tokens
🏦 Treasury Current Balance: 31.9 tokens
📤 Creating transfer...
✅ SUCCESS!
Transferred: 1,000,000 tokens
Treasury Balance: 1,000,031.9 tokens
Can Support: 50,001 users
```

## Alternative: Transfer to Phantom First

If you want to use the UI instead, first transfer tokens from mint authority to your Phantom wallet:

### In WSL:
```bash
# Set Solana CLI to use mint authority wallet
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/my-mintyn-wallet.json

# Get your Phantom wallet address (from the UI)
PHANTOM_ADDRESS="YOUR_PHANTOM_WALLET_ADDRESS_HERE"

# Transfer 1M tokens to Phantom
spl-token transfer 4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL 1000000 $PHANTOM_ADDRESS
```

Then you can use the UI to fund the treasury.

## Important Notes:
- The mint authority wallet has **10 million tokens**
- The treasury needs tokens to distribute 20 tokens per user
- 1 million tokens = support for **50,000 users** (1,000,000 ÷ 20)
- The CLI script is the easiest way to fund large amounts


