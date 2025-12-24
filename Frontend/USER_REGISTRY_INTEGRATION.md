# User Registry Frontend Integration

## ✅ Integration Complete

The User Registry smart contract has been fully integrated into the frontend!

## 📦 Components Created

### 1. **RegisterUserButton** (`components/UserRegistry/RegisterUserButton.tsx`)
- Dialog-based registration form
- Role selection (user, instructor, admin, influencer)
- Platform user ID input
- Automatic Phantom wallet connection
- Error handling and success notifications

### 2. **UserRegistryStatus** (`components/UserRegistry/UserRegistryStatus.tsx`)
- Displays on-chain registration status
- Shows user role, wallet address, registration date
- Auto-refresh functionality
- Beautiful card UI with badges

### 3. **UpdateRoleButton** (`components/UserRegistry/UpdateRoleButton.tsx`)
- Update user role on-chain
- Role selection dialog
- Only shows if wallet is connected

## 📍 Integration Location

**Profile Page**: `/myprofile`

The User Registry section has been added to the profile page, showing:
- Registration status card
- Register button (if not registered)
- Update role button (if registered)

## 🔧 Updated Files

1. **`src/utils/userRegistryContract.ts`**
   - Updated to work with Phantom wallet
   - Added RPC_URL and NETWORK configuration
   - Functions now accept wallet address and Phantom provider

2. **`src/app/(userdashboard)/myprofile/page.tsx`**
   - Added User Registry card section
   - Integrated all three components
   - Uses user data from Redux store

## 🚀 How to Use

### For Users:

1. **Go to Profile Page** (`/myprofile`)
2. **Connect Phantom Wallet** (if not already connected)
3. **Click "Register on Blockchain"**
4. **Enter your platform user ID** (auto-filled from account)
5. **Select your role** (user, instructor, admin, influencer)
6. **Confirm transaction** in Phantom wallet
7. **Done!** Your wallet is now linked on-chain

### For Instructors:

Same process, but select "instructor" as the role.

### Update Role:

1. Click "Update Role" button
2. Select new role
3. Confirm transaction
4. Role updated on-chain!

## 📋 Component Props

### RegisterUserButton
```typescript
<RegisterUserButton
  userWalletAddress={user?.walletAddress}
  platformUserId={user?._id}
  userRole={user?.role}
  onSuccess={(signature) => console.log(signature)}
/>
```

### UserRegistryStatus
```typescript
<UserRegistryStatus
  userWalletAddress={user?.walletAddress}
/>
```

### UpdateRoleButton
```typescript
<UpdateRoleButton
  userWalletAddress={user?.walletAddress}
  currentRole={user?.role}
  onSuccess={(signature) => console.log(signature)}
/>
```

## 🔗 Integration with UBI Contract

The User Registry can work alongside the UBI contract:

```typescript
// 1. Register user in User Registry
await registerUser(walletAddress, phantomProvider, platformUserId, "instructor");

// 2. Then register for UBI
await registerUserForUBI(walletAddress, phantomProvider);
```

## ⚠️ Important Notes

1. **Contract must be initialized** on devnet before first use
2. **Phantom wallet required** for all transactions
3. **Devnet SOL needed** for transaction fees
4. **Network**: Currently configured for devnet

## 🎯 Next Steps

1. **Initialize contract** on devnet (one-time)
2. **Test registration** flow
3. **Test instructor registration**
4. **Connect with UBI contract** (optional)
5. **Add to other pages** if needed (dashboard, etc.)

## 📚 Files Reference

- **Utility Functions**: `src/utils/userRegistryContract.ts`
- **Components**: `src/components/UserRegistry/`
- **Profile Integration**: `src/app/(userdashboard)/myprofile/page.tsx`
- **Contract**: `0xmintyn_Blockchain_Development/Smart_Contract/user-registry/`

## 🐛 Troubleshooting

**"Wallet not connected"**
- Install Phantom wallet
- Connect wallet in browser
- Refresh page

**"Transaction failed"**
- Check if you have enough SOL for fees
- Verify contract is initialized
- Check network (should be devnet)

**"Already registered"**
- User is already on-chain
- Use UpdateRoleButton to change role
- Check UserRegistryStatus for details

---

**Integration is complete and ready to use!** 🎉

