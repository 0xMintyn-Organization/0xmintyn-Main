# 🚨 URGENT: Initialize UBI Program NOW

## The Problem
Your transaction is reverting because **the UBI program is NOT initialized on devnet**.

## ✅ SOLUTION - Do This RIGHT NOW (2 minutes)

### Step 1: Open Browser Console
1. Open your app: `http://localhost:3000` (or your dev URL)
2. Press **F12** to open Developer Console
3. Go to **Console** tab

### Step 2: Copy and Paste This Code
**IMPORTANT:** Replace `YOUR_AUTHORITY_WALLET_ADDRESS` with your actual wallet address (the one that deployed the program)

```javascript
(async () => {
  try {
    // Check if Phantom is installed
    if (!window.solana || !window.solana.isPhantom) {
      alert("Please install Phantom wallet!");
      return;
    }
    
    // Connect if not connected
    if (!window.solana.isConnected) {
      await window.solana.connect();
    }
    
    const authorityAddress = window.solana.publicKey.toString();
    console.log("✅ Connected:", authorityAddress);
    
    // Import the function
    const { initializeUbiProgram } = await import('/src/utils/ubiContract.ts');
    
    console.log("🚀 Initializing UBI Program...");
    console.log("This will create the program state account on devnet.");
    
    const signature = await initializeUbiProgram(authorityAddress, window.solana);
    
    console.log("✅ SUCCESS! Program initialized!");
    console.log("Transaction:", signature);
    alert("✅ Program initialized successfully!\n\nTransaction: " + signature + "\n\nUsers can now claim UBI tokens!");
    
    // Refresh the page to update status
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error: " + error.message);
  }
})();
```

### Step 3: Press Enter and Approve
1. Press **Enter** in the console
2. **Approve the transaction** in Phantom wallet
3. Wait for confirmation (10-30 seconds)
4. You should see "✅ SUCCESS!" message

### Step 4: Try Claiming UBI Again
1. Go back to your app
2. Click "Claim UBI" button
3. It should work now! 🎉

## 🔍 Verify It Worked

After initializing, check:

1. **Go to Solana Explorer:**
   ```
   https://explorer.solana.com/address/8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy?cluster=devnet
   ```

2. **Look for the UBI Program PDA account** - it should exist and have data

3. **Check the console** - should show "✅ Program initialized successfully!"

## ⚠️ Common Issues

### "Already initialized"
- Program is already initialized! Try claiming UBI now.

### "Insufficient funds"
- Your wallet needs SOL for transaction fees
- Get SOL from: https://faucet.solana.com

### "User rejected"
- You cancelled the transaction. Try again and approve.

### "Transaction failed"
- Check the console for the exact error
- Make sure you're using the correct authority wallet

## 📞 Still Not Working?

Share:
1. The exact error message from console
2. Whether the initialization transaction succeeded
3. Your wallet address (authority)

