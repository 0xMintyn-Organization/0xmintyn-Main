/*
  Clean no-op UBI contract utilities
  -------------------------------
  This file replaces the previous Solana/Anchor implementation with a
  small, dependency-free stub that preserves exported names so other
  modules can import them without needing to be refactored.

  All functions return safe default values and do not perform network operations.
*/

export const UBI_PROGRAM_ID = "UBI_PROGRAM_DISABLED";
export const EQUALMINT_MINT = "EQUALMINT_MINT_DISABLED";
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";

export async function initializeUbiProgram(_authorityAddress?: string, _provider?: any): Promise<string> {
  return "ubi_feature_disabled";
}

export async function isUbiProgramInitialized(): Promise<boolean> {
  return false;
}

export async function registerUserForUBI(_userAddress?: string, _provider?: any): Promise<{ success: boolean; message: string }> {
  return { success: false, message: "UBI feature removed" };
}

export async function isUserRegistered(_userAddress?: string | null): Promise<boolean> {
  return false;
}

export async function getUbiProgram(): Promise<null> {
  return null;
}

export async function getUserTokenAccount(): Promise<null> {
  return null;
}

export async function getUbiProgramState(): Promise<null> {
  return null;
}

export async function getUserRegistrationInfo(): Promise<null> {
  return null;
}

export default {
  UBI_PROGRAM_ID,
  EQUALMINT_MINT,
  RPC_URL,
  initializeUbiProgram,
  isUbiProgramInitialized,
  registerUserForUBI,
  isUserRegistered,
  getUbiProgram,
  getUserTokenAccount,
  getUbiProgramState,
  getUserRegistrationInfo,
};


