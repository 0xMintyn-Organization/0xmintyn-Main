import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  connected: boolean;
  provider: string | null;
  publicKey: string | null;
  address: string | null;
  balance: number;
  network: string;
}

const initialState: WalletState = {
  connected: false,
  provider: null,
  publicKey: null,
  address: null,
  balance: 0,
  network: 'mainnet-beta', // Default Solana network
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    walletConnected: (state, action: PayloadAction<{
      provider: string;
      publicKey: string;
      address: string;
      balance: number;
      network?: string;
    }>) => {
      state.connected = true;
      state.provider = action.payload.provider;
      state.publicKey = action.payload.publicKey;
      state.address = action.payload.address;
      state.balance = action.payload.balance;
      state.network = action.payload.network || 'mainnet-beta';
    },
    
    walletDisconnected: (state) => {
      state.connected = false;
      state.provider = null;
      state.publicKey = null;
      state.address = null;
      state.balance = 0;
      state.network = 'mainnet-beta';
    },
    
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    
    updateNetwork: (state, action: PayloadAction<string>) => {
      state.network = action.payload;
    },
  },
});

export const { 
  walletConnected, 
  walletDisconnected, 
  updateBalance, 
  updateNetwork 
} = walletSlice.actions;

export default walletSlice.reducer;
