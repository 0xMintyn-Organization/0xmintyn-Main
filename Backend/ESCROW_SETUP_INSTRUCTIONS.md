# Escrow Admin Wallet Setup Instructions

## You Have a Recovery Phrase (Seed Phrase) ✅

Your admin wallet has a **12-word recovery phrase** (also called seed phrase or mnemonic). We can use this to derive the keypair.

## Setup Steps

### Step 1: Install Required Packages

The backend needs packages to convert seed phrase to keypair:

```bash
cd Backend
npm install bip39 ed25519-hd-key
# OR
yarn add bip39 ed25519-hd-key
```

### Step 2: Add Seed Phrase to .env

Add your recovery phrase to the backend `.env` file:

```bash
# Admin wallet recovery phrase (12 words)
ADMIN_SEED_PHRASE="flower thrive dose shallow gift boring shell tip glove open book curve"

# Admin wallet address (public key) - get this from your wallet
ADMIN_WALLET_ADDRESS="<your_admin_wallet_address>"
```

### Step 3: Get Your Admin Wallet Address

If you don't know your admin wallet address, you can:

1. **From Phantom Wallet**: 
   - Open your wallet
   - Copy the wallet address (public key)

2. **Or derive it from seed phrase** (for verification):
   ```javascript
   // This will be done automatically in the code
   // The address is derived from the seed phrase
   ```

### Step 4: Verify Setup

The code will automatically:
- ✅ Derive the keypair from your seed phrase
- ✅ Use it to sign escrow release/refund transactions
- ✅ Log confirmation when keypair is loaded

## Security ⚠️

**IMPORTANT:**
- ❌ **NEVER commit** `.env` file to git
- ❌ **NEVER share** your seed phrase
- ✅ Store `.env` securely on the server
- ✅ Use environment variables in production
- ✅ Restrict file permissions: `chmod 600 .env`

## Alternative Options

If you prefer not to use seed phrase, you can use:

### Option A: Private Key Array
```bash
ADMIN_PRIVATE_KEY="[123,45,67,...]" # Base64 encoded secret key array
```

### Option B: Keypair File
```bash
ADMIN_KEYPAIR_PATH="/path/to/admin-keypair.json"
```

## Verification

After setup, when you test escrow operations, you should see:
```
✅ Admin keypair loaded from seed phrase
```

This confirms the setup is working correctly.


