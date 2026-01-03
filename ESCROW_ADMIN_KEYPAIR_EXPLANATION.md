# Why We Need Admin Keypair (Not Just Address)

## The Problem

The escrow contract requires the **admin to SIGN** transactions for:
- `releaseEscrow()` - Admin must sign to release funds
- `refundEscrow()` - Admin must sign to refund funds

## Difference

### Wallet Address (What You Have)
- ✅ Public key - can receive funds
- ❌ **Cannot sign transactions**
- Example: Like a bank account number - anyone can send money to it, but you need the PIN to withdraw

### Private Key/Keypair (What We Need)
- ✅ Can sign transactions
- ✅ Required by the escrow contract
- Example: Like a bank PIN/password - needed to authorize transactions

## The Escrow Contract Requirement

Looking at the contract code:

```rust
// release_escrow.rs - Line 10
pub admin: Signer<'info>,  // Admin MUST sign to release
```

```rust
// refund_escrow.rs - Line 10  
pub admin: Signer<'info>,  // Admin MUST sign to refund
```

The `Signer<'info>` type means the admin **must sign** the transaction. Without the private key, the transaction will fail.

## Solution Options

### Option 1: Use Admin Keypair (Current Approach) ✅
- Store private key securely in environment variables
- Backend signs transactions automatically
- Most secure if properly configured

### Option 2: Manual Admin Signing (Not Recommended)
- Admin would need to manually sign each transaction
- Not automated
- Not scalable

### Option 3: Change Contract (Not Possible)
- Would require redeploying the contract
- Current contract is already deployed

## Security Best Practices

1. **Never commit private keys to git**
2. **Use environment variables** (already done)
3. **Restrict access** to backend server
4. **Use separate admin wallet** for production
5. **Consider hardware wallets** for production

## Environment Setup

You need to add to your `.env` file:

```bash
# Option 1: Private key as base64 encoded array
ADMIN_PRIVATE_KEY=<base64_encoded_secret_key_array>

# Option 2: Path to keypair JSON file
ADMIN_KEYPAIR_PATH=/path/to/admin-keypair.json
```

## How to Get Admin Keypair

If you have the admin wallet address but not the keypair:

1. **If you have the wallet in Phantom**: Export the private key (⚠️ SECURITY RISK)
2. **Create a new admin wallet**: Generate a new keypair specifically for backend operations
3. **Update escrow contract**: Would require redeploying (not recommended)

**Recommendation**: Use a separate admin wallet for backend operations, not your main wallet.


