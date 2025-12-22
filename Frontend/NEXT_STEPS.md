# ✅ UBI Program Initialized - Next Steps

## 🎉 Congratulations!
Your UBI program is now initialized on devnet. Here's what to do next:

## Step 1: Fund the Treasury (REQUIRED)

**Why?** The treasury needs Mintyn tokens to distribute to users. Without tokens, users can't claim UBI.

### Option A: Use Browser Console (Quick)

1. **Open Browser Console** (F12 → Console tab)
2. **Copy and paste this script:**

```javascript
(async () => {
  try {
    if (!window.solana?.isPhantom) { alert("Install Phantom!"); return; }
    if (!window.solana.isConnected) await window.solana.connect();
    
    const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
    const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount, createTransferInstruction, getMint } = await import('@solana/spl-token');
    
    const RPC_URL = "https://api.devnet.solana.com";
    const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
    const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
    const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
    const TREASURY_SEED = Buffer.from("treasury");
    
    const connection = new Connection(RPC_URL, "confirmed");
    const authorityPublicKey = new PublicKey(window.solana.publicKey.toString());
    
    // Derive treasury PDA
    const [treasury] = PublicKey.findProgramAddressSync([UBI_PROGRAM_SEED, TREASURY_SEED], UBI_PROGRAM_ID);
    console.log("Treasury PDA:", treasury.toString());
    
    // Get authority's token account
    const authorityTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, authorityPublicKey);
    
    // Check authority balance
    try {
      const authorityAccount = await getAccount(connection, authorityTokenAccount);
      const mintInfo = await getMint(connection, MINTYN_MINT);
      const balance = Number(authorityAccount.amount) / Math.pow(10, mintInfo.decimals);
      console.log("Your Mintyn balance:", balance, "tokens");
      
      if (balance < 100) {
        alert("⚠️ You need at least 100 Mintyn tokens to fund the treasury.\n\nCurrent balance: " + balance);
        return;
      }
    } catch (e) {
      alert("❌ You don't have a Mintyn token account. You need Mintyn tokens first!");
      return;
    }
    
    // Transfer amount (100 tokens = enough for 5 users)
    const transferAmount = 100_000_000_000; // 100 tokens with 9 decimals
    const mintInfo = await getMint(connection, MINTYN_MINT);
    
    console.log("📤 Transferring", transferAmount / Math.pow(10, mintInfo.decimals), "tokens to treasury...");
    
    // Create transfer instruction
    const transferIx = createTransferInstruction(
      authorityTokenAccount, // from
      treasury, // to
      authorityPublicKey, // authority
      transferAmount, // amount
      [], // multiSigners
      TOKEN_PROGRAM_ID
    );
    
    const transaction = new Transaction().add(transferIx);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;
    
    const signedTx = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 3 });
    
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    
    // Check treasury balance
    const treasuryAccount = await getAccount(connection, treasury);
    const treasuryBalance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
    
    console.log("✅ Treasury funded!");
    console.log("Treasury balance:", treasuryBalance, "tokens");
    alert("✅ Treasury funded with " + treasuryBalance + " tokens!\n\nThis is enough for " + Math.floor(treasuryBalance / 20) + " users to claim UBI.");
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);
  }
})();
```

3. **Press Enter and approve the transaction**
4. **Wait for confirmation**

### Option B: Use SPL Token CLI (If you have CLI access)

```bash
# Get treasury address first (from test page or console)
# Then transfer tokens:
spl-token transfer 4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL 100 <TREASURY_ADDRESS>
```

## Step 2: Test User Registration

1. **Go back to the test page** (`/test-ubi`)
2. **Click "Claim 20 Mintyn UBI"** button
3. **Approve the transaction** in Phantom
4. **Check your wallet** - you should receive 20 Mintyn tokens!

## Step 3: Test on Main App

1. **Go to your main dashboard** (`/dashboard` or wherever the Claim UBI button is)
2. **Click "Claim UBI"** button
3. **It should work now!** ✅

## Step 4: Verify Everything Works

### Check Treasury Balance:
- Go to Solana Explorer: `https://explorer.solana.com/address/<TREASURY_ADDRESS>?cluster=devnet`
- Should show the tokens you transferred

### Check Program State:
- The test page should show "Initialized" status
- You can check total registered users

## ⚠️ Important Notes

1. **Treasury Funding**: You need to fund the treasury BEFORE users can claim. Each user needs 20 tokens.

2. **Token Requirements**: 
   - You need Mintyn tokens in your wallet to fund the treasury
   - If you don't have Mintyn tokens, you'll need to mint them or get them from a faucet

3. **One-Time Per User**: Each wallet can only claim UBI once. This is by design.

4. **Network**: Make sure you're on devnet (for testing) or mainnet (for production)

## 🎯 Quick Checklist

- [x] Program initialized ✅
- [ ] Treasury funded with Mintyn tokens
- [ ] Test user registration works
- [ ] Main app "Claim UBI" button works
- [ ] Users can successfully claim tokens

## 🆘 Troubleshooting

### "Insufficient balance" error
- Treasury doesn't have enough tokens
- Fund the treasury with more Mintyn tokens

### "Already registered" error
- This wallet already claimed UBI
- Try with a different wallet

### "Transaction failed"
- Check console for exact error
- Make sure you have SOL for fees
- Verify network (devnet/mainnet)

## 📞 Need Help?

If something doesn't work:
1. Check the browser console for errors
2. Verify treasury has tokens
3. Check Solana Explorer for transaction status
4. Share the exact error message

