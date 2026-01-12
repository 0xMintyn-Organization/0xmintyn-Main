# Setup Admin Wallet Using Seed Phrase

## You Have the Recovery Phrase ✅

Your admin wallet recovery phrase:
```
flower thrive dose shallow gift boring shell tip glove open book curve
```

## Step 1: Install Required Packages

```bash
cd Backend
npm install bip39 ed25519-hd-key
# OR
yarn add bip39 ed25519-hd-key
```

## Step 2: Add to .env File

Add this to your `Backend/.env` file:

```bash
# Admin wallet recovery phrase (12 words)
ADMIN_SEED_PHRASE="flower thrive dose shallow gift boring shell tip glove open book curve"

# Admin wallet address (public key) - you can get this from Phantom wallet
ADMIN_WALLET_ADDRESS="<your_admin_wallet_address_from_phantom>"
```

## Step 3: Get Your Admin Wallet Address

1. Open Phantom wallet
2. Make sure you're on the account that has this recovery phrase
3. Copy the wallet address (public key)
4. Add it to `.env` as `ADMIN_WALLET_ADDRESS`

## Step 4: Test

The code will automatically:
- ✅ Convert your seed phrase to a keypair
- ✅ Use it to sign escrow transactions
- ✅ Log "✅ Admin keypair loaded from seed phrase" when working

## Security ⚠️

- ❌ **NEVER commit** `.env` to git
- ❌ **NEVER share** your seed phrase
- ✅ Keep `.env` file secure on server only
- ✅ Add `.env` to `.gitignore`

## Verification

After setup, when escrow operations run, you should see:
```
✅ Admin keypair loaded from seed phrase
```

This confirms everything is working!


