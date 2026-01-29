# 🚨 URGENT: Initialize UBI Program on Devnet

## The Problem
Your program was tested on **localnet**, but your frontend connects to **devnet**. The program needs to be initialized on devnet before users can register.

## ✅ Quick Fix (Choose ONE method)

### Method 1: Use the Test Page (EASIEST - 2 minutes)

1. **Open your browser** and go to: `https://app.equalmint.com/test-ubi` (or your dev URL)
2. **Connect the authority/deployer wallet** (Phantom-specific instructions removed)
3. **Click "Check Status"** - should show "Not Initialized"
4. **Click "Initialize UBI Program"**
5. **Approve the transaction** using your chosen wallet
6. **Wait for confirmation** (10-30 seconds)
7. **Click "Check Status" again** - should show "✅ Initialized"
8. **Done!** Users can now claim UBI tokens

### Method 2: Use Browser Console (If test page doesn't work)

1. **Open your app** in browser
2. **Open Developer Console** (F12)
3. **Connect Phantom wallet** (must be authority)
4. **Paste and run this:**

```javascript
// Import the function
const { initializeUbiProgram } = await import('/src/utils/ubiContract.ts');

// Get your wallet address
const address = window.solana.publicKey.toString();
console.log("Initializing with address:", address);

// Initialize
try {
  const sig = await initializeUbiProgram(address, window.solana);
  console.log("✅ SUCCESS! Signature:", sig);
  alert("Program initialized! Signature: " + sig);
} catch (error) {
  console.error("❌ Error:", error);
  alert("Error: " + error.message);
}
```

### Method 3: Use Anchor Test (Command Line)

```bash
cd 0xmintyn_Blockchain_Development/Smart_Contract/ubi-smart-contract

# Update Anchor.toml to use devnet
# Change line 18 from: cluster = "localnet"
# To: cluster = "devnet"

# Then run:
anchor test --skip-local-validator
```

This will:
- Deploy to devnet
- Initialize the program
- Run tests

## 🔍 Verify It Worked

After initializing, check:

1. **Go to Solana Explorer:**
   ```
   https://explorer.solana.com/address/8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy?cluster=devnet
   ```

2. **Look for the UBI Program PDA account** - it should exist and have data

3. **Try claiming UBI** - the error should be gone!

## ⚠️ Important Notes

- **Network Mismatch**: Your tests ran on `localnet`, but frontend uses `devnet`
- **One-Time Setup**: Initialization only needs to happen once per network
- **Authority Required**: Only the program deployer/authority can initialize
- **Treasury Funding**: After initialization, fund the treasury with Mintyn tokens

## 🆘 Still Not Working?

If you still get errors after initializing:

1. **Check the console** for the exact error message
2. **Verify network**: Make sure frontend and program are on the same network (devnet)
3. **Check program ID**: Verify `8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy` matches your deployment
4. **Verify initialization**: Check Solana Explorer to see if the PDA account exists

## 📞 Need Help?

Share:
- The exact error message from console
- Whether initialization transaction succeeded
- The network you're using (devnet/mainnet)

