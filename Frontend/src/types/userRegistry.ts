import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

/**
 * User Registry Program Types
 * Generated from IDL for type safety
 */

export interface UserRegistry {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: any[];
  accounts: any[];
  errors: any[];
  types: any[];
}

export interface UserAccount {
  userWallet: PublicKey;
  platformUserId: Uint8Array; // [u8; 64]
  role: Uint8Array; // [u8; 20]
  registeredAt: BN;
  updatedAt: BN;
  bump: number;
}

export interface UserRegistryState {
  authority: PublicKey;
  totalUsers: BN;
  bump: number;
}

