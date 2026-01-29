# 🚨 QUICK FIX - Initialize UBI Program

## The Problem
Your program was tested on **localnet**, but frontend uses **devnet**. Program must be initialized on devnet.

## ✅ SOLUTION (Do This Now - 2 Minutes)

### Step 1: Open Browser Console
1. Open your app: `https://app.equalmint.com` (or your URL)
2. Press **F12** to open Developer Console
3. Go to **Console** tab

### Step 2: Connect Wallet & Initialize
Copy and paste this ENTIRE block into console:

```javascript
(async () => {
  try {
    // Check if Phantom is connected
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
    const signature = await initializeUbiProgram(authorityAddress, window.solana);
    
    console.log("✅ SUCCESS! Program initialized!");
    console.log("Transaction:", signature);
    alert("✅ Program initialized successfully!\n\nTransaction: " + signature + "\n\nUsers can now claim UBI tokens!");
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error: " + error.message);
  }
})();
```

### Step 3: Verify
1. Try clicking "Claim UBI" button again
2. It should work now!

## 🔍 If It Still Fails

Check the console error. Common issues:

1. **"User rejected"** - You cancelled the transaction. Try again and approve.

2. **"Insufficient funds"** - Your wallet needs SOL for transaction fees. Get some from: https://faucet.solana.com

3. **"Program not found"** - Program not deployed to devnet. Run:
   ```bash
   cd 0xmintyn_Blockchain_Development/Smart_Contract/ubi-smart-contract
   anchor deploy --provider.cluster devnet
   ```

4. **"Already initialized"** - Program is already initialized! Try claiming UBI now.

## 📞 Still Stuck?

Share the EXACT error message from console and I'll help fix it immediately.

