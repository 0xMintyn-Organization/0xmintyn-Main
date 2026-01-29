# 🚨 SIMPLE FIX: Initialize UBI Program

## The Problem
The dynamic import fails because TypeScript files aren't directly accessible in the browser.

## ✅ SOLUTION - Use This Instead

### Method 1: Use the Test Page (EASIEST)
1. Go to: `app.equalmint.com/test-ubi`
2. (Removed) Phantom wallet connection step
3. Click "Initialize UBI Program" button
4. Approve the transaction
5. Done! ✅

### Method 2: Use Browser Console Script

1. **Open Browser Console** (F12 → Console tab)

2. **Copy the ENTIRE contents of this file:**
   - File: `0xmintyn-Main/Frontend/public/initialize-ubi.js`
   - Or copy from below:

```javascript
// Copy this ENTIRE script into browser console
(async () => {
  try {
    console.log("🚀 Starting UBI Program Initialization...");
    
    if (!window.solana?.isPhantom) {
      alert("❌ Please install Phantom wallet!");
      return;
    }
    
    if (!window.solana.isConnected) {
      await window.solana.connect();
    }
    
    const authorityAddress = window.solana.publicKey.toString();
    console.log("✅ Connected:", authorityAddress);
    
    const { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } = await import('@solana/web3.js');
    const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } = await import('@solana/spl-token');
    
    const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
    const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
    const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
    const TREASURY_SEED = Buffer.from("treasury");
    
    const connection = new Connection(RPC_URL, "confirmed");
    const authorityPublicKey = new PublicKey(authorityAddress);
    
    const [ubiProgram] = PublicKey.findProgramAddressSync([UBI_PROGRAM_SEED], UBI_PROGRAM_ID);
    const accountInfo = await connection.getAccountInfo(ubiProgram);
    if (accountInfo !== null) {
      alert("⚠️ Already initialized!");
      return;
    }
    
    const [treasury] = PublicKey.findProgramAddressSync([UBI_PROGRAM_SEED, TREASURY_SEED], UBI_PROGRAM_ID);
    const authorityTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, authorityPublicKey);
    
    let createAuthorityTokenAccountIx = null;
    try {
      await getAccount(connection, authorityTokenAccount);
    } catch {
      createAuthorityTokenAccountIx = createAssociatedTokenAccountInstruction(
        authorityPublicKey, authorityTokenAccount, authorityPublicKey, MINTYN_MINT
      );
    }
    
    const idlResponse = await fetch('/idl/ubi_smart_contract.json');
    const idl = await idlResponse.json();
    const initializeIx = idl.instructions.find((ix) => ix.name === "initialize");
    const discriminator = Buffer.from(initializeIx.discriminator);
    
    const accountMetas = initializeIx.accounts.map((acc) => {
      let pubkey;
      switch (acc.name) {
        case "authority": pubkey = authorityPublicKey; break;
        case "mintyn_mint": pubkey = MINTYN_MINT; break;
        case "authority_token_account": pubkey = authorityTokenAccount; break;
        case "ubi_program": pubkey = ubiProgram; break;
        case "treasury": pubkey = treasury; break;
        case "token_program": pubkey = TOKEN_PROGRAM_ID; break;
        case "system_program": pubkey = SystemProgram.programId; break;
      }
      return { pubkey, isSigner: acc.signer || false, isWritable: acc.writable || false };
    });
    
    const initializeInstruction = new TransactionInstruction({
      programId: UBI_PROGRAM_ID,
      keys: accountMetas,
      data: discriminator,
    });
    
    const transaction = new Transaction();
    if (createAuthorityTokenAccountIx) transaction.add(createAuthorityTokenAccountIx);
    transaction.add(initializeInstruction);
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;
    
    const signedTx = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 3 });
    
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    
    console.log("✅ SUCCESS! Transaction:", signature);
    alert("✅ Initialized! Tx: " + signature);
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error: " + error.message);
  }
})();
```

3. **Paste into console and press Enter**

4. **Approve the transaction in Phantom**

5. **Wait for success message**

## 🎯 RECOMMENDED: Use Test Page
The easiest way is to just visit `/test-ubi` and use the button there. It's already set up and working!

