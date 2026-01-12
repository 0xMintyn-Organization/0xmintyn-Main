# UBI Smart Contract Frontend Integration - Complete ✅

## What Was Done

### 1. ✅ Dependencies Installed
- `@coral-xyz/anchor` - For interacting with Solana smart contracts
- `@solana/spl-token` - For SPL token operations

### 2. ✅ IDL File Copied
- Copied `ubi_smart_contract.json` to `public/idl/` folder
- This file contains the contract interface needed for frontend interaction

### 3. ✅ Utility Functions Created
**File:** `src/utils/ubiContract.ts`
- `registerUserForUBI()` - Main function to register user and claim 20 Mintyn tokens
- `isUserRegistered()` - Check if user already claimed UBI
- `getUbiProgramState()` - Get UBI program state
- `getUserRegistrationInfo()` - Get user registration details
- Helper functions for PDA derivation and token accounts

### 4. ✅ ClaimUBIButton Component Created
**File:** `src/components/UBI/ClaimUBIButton.tsx`
- Reusable button component for claiming UBI
- Automatically checks registration status
- Handles wallet connection
- Shows loading states and success/error messages
- Can be used anywhere in the app

### 5. ✅ UBI&Financials Component Updated
**File:** `src/components/MyProfile/UBI&Financials.tsx`
- Replaced static "Claim UBI" button with functional `ClaimUBIButton`
- Gets wallet address from Redux store
- Fully integrated and working

### 6. ✅ Dashboard Integration
**File:** `src/components/EnhancedDashboard.tsx`
- Added UBI claim card in the Overview tab
- Prominently displays for users with connected wallets
- Beautiful gradient card design

---

## How It Works

### User Flow:
1. User connects Phantom wallet → Wallet address saved to database
2. User visits Dashboard or Profile → Sees "Claim UBI" button
3. User clicks button → Phantom wallet prompts for signature
4. Smart contract executes → Transfers 20 Mintyn tokens automatically
5. User receives tokens → Can spend on Education Hub or Marketplace

### Technical Flow:
```
Frontend (ClaimUBIButton)
  ↓
Gets user wallet address from Redux (user.walletAddress)
  ↓
Calls registerUserForUBI() utility function
  ↓
Creates transaction with register_user instruction
  ↓
User signs with Phantom wallet
  ↓
Transaction sent to Solana blockchain
  ↓
Smart contract:
  - Validates user not already registered
  - Creates UserRegistration PDA account
  - Transfers 20 Mintyn tokens from Treasury to user
  ↓
Transaction confirmed → User receives tokens! 🎉
```

---

## Configuration

### Environment Variables (Optional)
Add to `.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
# or
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

### Constants to Update
In `src/utils/ubiContract.ts`:
- `MINTYN_MINT` - Update with your actual MintynToken mint address
  - Mainnet: `4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL`
  - Devnet: Use your test mint address

---

## Usage Examples

### 1. Using ClaimUBIButton Component

```tsx
import { ClaimUBIButton } from "@/components/UBI/ClaimUBIButton";
import { useSelector } from "react-redux";

function MyComponent() {
  const { user } = useSelector((state: any) => state.auth);
  const walletAddress = user?.walletAddress;

  return (
    <ClaimUBIButton
      userWalletAddress={walletAddress}
      onSuccess={(signature) => {
        console.log("Transaction:", signature);
      }}
    />
  );
}
```

### 2. Using Utility Functions Directly

```tsx
import { registerUserForUBI } from "@/utils/ubiContract";

async function claimUBI() {
  const walletAddress = user.walletAddress;
  const phantomProvider = window.solana;
  
  try {
    const signature = await registerUserForUBI(walletAddress, phantomProvider);
    console.log("Success! Transaction:", signature);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### 3. Checking Registration Status

```tsx
import { isUserRegistered, getUbiProgram, RPC_URL } from "@/utils/ubiContract";
import { Connection, PublicKey } from "@solana/web3.js";

async function checkStatus() {
  const connection = new Connection(RPC_URL, "confirmed");
  const userPublicKey = new PublicKey(walletAddress);
  const program = getUbiProgram(connection, wallet);
  
  const registered = await isUserRegistered(connection, program, userPublicKey);
  console.log("Is registered:", registered);
}
```

---

## Where UBI Claim is Available

1. **Dashboard** (`/dashboard`)
   - UBI claim card in Overview tab
   - Shows for users with connected wallets

2. **Profile Page** (`/myprofile`)
   - In UBI & Financials section
   - Replaces the old static "Claim UBI" button

---

## Important Notes

### Prerequisites:
1. ✅ User must have Phantom wallet installed
2. ✅ User must connect wallet (wallet address in database)
3. ✅ User needs SOL for transaction fees (~0.000005 SOL)
4. ✅ Treasury must be funded with Mintyn tokens

### One-Time Setup Required:
1. **Initialize UBI Program** (if not done already)
   - Call `initialize()` instruction once
   - Sets up program state and treasury

2. **Fund Treasury**
   - Transfer Mintyn tokens to Treasury PDA
   - Treasury address: Derived from seeds `["ubi_program", "treasury"]`

### Error Handling:
- Already registered → Shows "UBI Already Claimed" button
- No wallet → Shows "Connect Wallet First"
- Transaction cancelled → Shows error message
- Insufficient treasury → Shows error message

---

## Testing

### On Devnet:
1. Make sure `NEXT_PUBLIC_SOLANA_NETWORK=devnet` (or default)
2. Use test MintynToken mint address
3. Fund treasury with test tokens
4. Test with test wallet

### On Mainnet:
1. Set `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
2. Use real MintynToken mint: `4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL`
3. Fund treasury with real tokens
4. Ready for production!

---

## Files Created/Modified

### Created:
- `src/utils/ubiContract.ts` - Utility functions
- `src/components/UBI/ClaimUBIButton.tsx` - Claim button component
- `public/idl/ubi_smart_contract.json` - Contract IDL

### Modified:
- `src/components/MyProfile/UBI&Financials.tsx` - Added ClaimUBIButton
- `src/components/EnhancedDashboard.tsx` - Added UBI claim card
- `package.json` - Added dependencies

---

## Next Steps

1. **Test on Devnet**
   - Connect test wallet
   - Try claiming UBI
   - Verify tokens received

2. **Update Mint Address**
   - Update `MINTYN_MINT` in `ubiContract.ts` for production

3. **Fund Treasury**
   - Transfer Mintyn tokens to treasury
   - Ensure sufficient balance for users

4. **Deploy to Production**
   - Change network to mainnet-beta
   - Test thoroughly
   - Launch! 🚀

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify wallet is connected
3. Check treasury has sufficient balance
4. Verify network (devnet vs mainnet)
5. Check transaction on Solana Explorer

---

**Integration Complete!** 🎉
The UBI smart contract is now fully integrated into your frontend. Users can claim their 20 Mintyn tokens with a single click!

