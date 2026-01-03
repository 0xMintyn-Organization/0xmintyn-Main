# Wallet Fields Migration Script

This script adds wallet-related fields to all existing users in the database without overwriting existing values.

## Fields Added

- `walletAddress` - Solana wallet address (default: null)
- `walletProvider` - Wallet provider name (default: null)
- `walletConnectedAt` - Timestamp when wallet was connected (default: null)
- `walletPrivateKey` - Encrypted private key (default: null)

## How It Works

- Only adds fields to users that don't have them (undefined)
- Preserves existing values (won't overwrite)
- Sets missing fields to `null` (not empty string)

## Running the Migration

### Option 1: Using npm script (Recommended)

```bash
cd Backend
npm run migrate:wallet-fields
```

### Option 2: Using ts-node directly

```bash
cd Backend
npx ts-node scripts/addWalletFieldsToUsers.ts
```

### Option 3: After building TypeScript

```bash
cd Backend
npm run build
node build/scripts/addWalletFieldsToUsers.js
```

## Prerequisites

1. Make sure your `.env` file has the correct `DB_URI` or `MONGODB_URI`
2. Ensure you have a backup of your database (recommended)
3. Make sure the backend server is NOT running (to avoid connection conflicts)

## What to Expect

The script will:
1. Connect to MongoDB
2. Find all users
3. Check each user for missing wallet fields
4. Add null values only to missing fields
5. Show a summary of updated vs skipped users

## Example Output

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
📊 Found 150 users to process
✅ Updated user: user1@example.com - Added fields: walletAddress, walletProvider, walletConnectedAt
⏭️  Skipped user: user2@example.com - Already has all wallet fields
...

📈 Migration Summary:
   Total users: 150
   Updated: 120
   Skipped: 30
   ✅ Migration completed successfully!
```

## Troubleshooting

- **Connection Error**: Check your `DB_URI` in `.env` file
- **Module Not Found**: Make sure you're running from the `Backend` directory
- **TypeScript Errors**: Use `npx ts-node` or compile first with `npm run build`


