# Solana Wallet Setup for Milestone Integration

1. **Copy your Solana keypair** from:
   - WSL: `~/.config/solana/id.json`
   - Windows: `%USERPROFILE%\.config\solana\id.json`

2. **Save it** as `Backend/config/solana-wallet.json` (same format: JSON array of 32 numbers).

3. **Optional env** in `.env`:
   ```
   ANCHOR_WALLET=config/solana-wallet.json
   ```
   If you skip this, the backend uses `config/solana-wallet.json` by default.

⚠️ **Never commit** `solana-wallet.json` – it contains your private key. It's already in `.gitignore`.
