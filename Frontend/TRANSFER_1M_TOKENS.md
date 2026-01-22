# Transfer 1 Million Tokens to Treasury

## Quick Method (Using Script)

1. **Open terminal in the Frontend directory**
2. **Run the script:**
   ```bash
   node transfer-to-treasury.js
   ```

The script will:
- ✅ Derive treasury PDA address
- ✅ Load your wallet keypair
- ✅ Check your balance (must have ≥ 1M tokens)
- ✅ Transfer exactly 1,000,000 tokens to treasury
- ✅ Verify the transfer

## Manual Method (Using SPL Token CLI)

### Step 1: Get Treasury Address

The treasury PDA address is derived from:
- Seeds: `[b"ubi_program", b"treasury"]`
- Program ID: `8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy`

You can get it from the test page or calculate it.

### Step 2: Transfer Using CLI

```bash
# Make sure you're on devnet
solana config set --url https://api.mainnet-beta.solana.com

# Set your keypair (mint authority)
solana config set --keypair ~/.config/solana/id.json

# Transfer 1 million tokens
# Format: spl-token transfer <MINT> <AMOUNT> <DESTINATION>
# Amount: 1,000,000 tokens = 1,000,000,000,000,000 (with 9 decimals)
spl-token transfer 4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL 1000000000000000 <TREASURY_ADDRESS>
```

## Browser Console Method

If you prefer browser console:

```javascript
// Copy this entire script into browser console on /test-ubi page
(async () => {
  const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
  const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount, createTransferInstruction, getMint } = await import('@solana/spl-token');
  
  const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
  const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
  const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
  const TREASURY_SEED = Buffer.from("treasury");
  const TRANSFER_AMOUNT = 1_000_000_000_000_000; // 1M tokens
  
  const connection = new Connection(RPC_URL, "confirmed");
  const [treasury] = PublicKey.findProgramAddressSync([UBI_PROGRAM_SEED, TREASURY_SEED], UBI_PROGRAM_ID);
  const authorityPublicKey = new PublicKey(window.solana.publicKey.toString());
  const authorityTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, authorityPublicKey);
  
  // Check balance
  const account = await getAccount(connection, authorityTokenAccount);
  const mintInfo = await getMint(connection, MINTYN_MINT);
  const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
  console.log("Your balance:", balance);
  
  if (balance < 1_000_000) {
    alert("Insufficient balance! You have " + balance + " tokens");
    return;
  }
  
  // Transfer
  const transferIx = createTransferInstruction(authorityTokenAccount, treasury, authorityPublicKey, TRANSFER_AMOUNT, [], TOKEN_PROGRAM_ID);
  const transaction = new Transaction().add(transferIx);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = authorityPublicKey;
  
  const signedTx = await window.solana.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  
  const treasuryAccount = await getAccount(connection, treasury);
  const treasuryBalance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
  alert("✅ Transferred! Treasury now has " + treasuryBalance.toLocaleString() + " tokens");
})();
```

## After Transfer

- Treasury will have 1,000,000 tokens
- Can support 50,000 users (1M ÷ 20 = 50,000)
- Monitor balance and refill when needed


