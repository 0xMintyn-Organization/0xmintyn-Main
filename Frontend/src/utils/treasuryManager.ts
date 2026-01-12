/**
 * Automated Treasury Management
 * Handles automatic funding and monitoring of UBI treasury
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  getMint,
} from "@solana/spl-token";
import { MINTYN_MINT, UBI_PROGRAM_ID, RPC_URL } from "./ubiContract";

// Treasury PDA seeds
const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
const TREASURY_SEED = Buffer.from("treasury");

/**
 * Get Treasury PDA address
 */
export function getTreasuryAddress(): PublicKey {
  const [treasury] = PublicKey.findProgramAddressSync(
    [UBI_PROGRAM_SEED, TREASURY_SEED],
    UBI_PROGRAM_ID
  );
  return treasury;
}

/**
 * Get current treasury balance
 */
export async function getTreasuryBalance(): Promise<number> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const treasury = getTreasuryAddress();
    const treasuryAccount = await getAccount(connection, treasury);
    const mintInfo = await getMint(connection, MINTYN_MINT);
    const balance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
    return balance;
  } catch (error) {
    console.error("Error getting treasury balance:", error);
    return 0;
  }
}

/**
 * Get authority's token account balance
 */
export async function getAuthorityBalance(authorityPublicKey: PublicKey): Promise<number> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const authorityTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      authorityPublicKey
    );
    const account = await getAccount(connection, authorityTokenAccount);
    const mintInfo = await getMint(connection, MINTYN_MINT);
    const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
    return balance;
  } catch (error) {
    console.error("Error getting authority balance:", error);
    return 0;
  }
}

/**
 * Calculate how many users can be supported with current treasury balance
 */
export async function getSupportedUsers(): Promise<number> {
  const balance = await getTreasuryBalance();
  return Math.floor(balance / 20); // 20 tokens per user
}

/**
 * Check if treasury needs funding (below threshold)
 */
export async function needsFunding(threshold: number = 100_000): Promise<boolean> {
  const balance = await getTreasuryBalance();
  return balance < threshold;
}

/**
 * Automated Treasury Funding
 * Transfers specified amount from authority to treasury
 */
export async function fundTreasury(
  authorityPublicKey: PublicKey,
  amount: number, // Amount in tokens (not smallest units)
  phantomProvider: any
): Promise<string> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const treasury = getTreasuryAddress();
    
    console.log("🤖 Automated Treasury Funding");
    console.log("Amount:", amount, "tokens");
    console.log("Treasury Address:", treasury.toString());
    
    // Get authority's token account
    const authorityTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      authorityPublicKey
    );
    
    // Check authority balance
    const authorityBalance = await getAuthorityBalance(authorityPublicKey);
    if (authorityBalance < amount) {
      throw new Error(
        `Insufficient balance. You have ${authorityBalance.toLocaleString()} tokens, need ${amount.toLocaleString()}`
      );
    }
    
    // Get mint info for decimals
    const mintInfo = await getMint(connection, MINTYN_MINT);
    const transferAmount = BigInt(Math.floor(amount * Math.pow(10, mintInfo.decimals)));
    
    // Get current treasury balance
    const treasuryBalanceBefore = await getTreasuryBalance();
    console.log("Treasury balance before:", treasuryBalanceBefore.toLocaleString(), "tokens");
    
    // Create transfer instruction
    const transferIx = createTransferInstruction(
      authorityTokenAccount,
      treasury,
      authorityPublicKey,
      transferAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Build transaction
    const transaction = new Transaction().add(transferIx);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;
    
    // Sign and send
    console.log("📤 Signing and sending transaction...");
    const signedTx = await phantomProvider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
    
    console.log("📝 Transaction sent:", signature);
    console.log("⏳ Waiting for confirmation...");
    
    // Confirm
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    
    // Verify
    const treasuryBalanceAfter = await getTreasuryBalance();
    const transferred = treasuryBalanceAfter - treasuryBalanceBefore;
    
    console.log("✅ Transfer Complete!");
    console.log("Treasury balance after:", treasuryBalanceAfter.toLocaleString(), "tokens");
    console.log("Transferred:", transferred.toLocaleString(), "tokens");
    console.log("Can support:", Math.floor(treasuryBalanceAfter / 20).toLocaleString(), "users");
    
    return signature;
  } catch (error: any) {
    console.error("❌ Error funding treasury:", error);
    throw new Error(`Failed to fund treasury: ${error.message}`);
  }
}

/**
 * Auto-fund treasury if balance is below threshold
 * Transfers specified amount to bring balance to target
 */
export async function autoFundTreasury(
  authorityPublicKey: PublicKey,
  targetBalance: number, // Target treasury balance in tokens
  phantomProvider: any
): Promise<string | null> {
  try {
    const currentBalance = await getTreasuryBalance();
    
    if (currentBalance >= targetBalance) {
      console.log("✅ Treasury already has sufficient balance:", currentBalance.toLocaleString());
      return null; // No funding needed
    }
    
    const needed = targetBalance - currentBalance;
    console.log(`💰 Treasury needs ${needed.toLocaleString()} tokens`);
    console.log(`📤 Auto-funding ${needed.toLocaleString()} tokens...`);
    
    return await fundTreasury(authorityPublicKey, needed, phantomProvider);
  } catch (error: any) {
    console.error("❌ Auto-funding failed:", error);
    throw error;
  }
}

/**
 * Get treasury status report
 */
export async function getTreasuryStatus() {
  const balance = await getTreasuryBalance();
  const supportedUsers = await getSupportedUsers();
  const treasury = getTreasuryAddress();
  
  return {
    treasuryAddress: treasury.toString(),
    currentBalance: balance,
    supportedUsers,
    status: balance < 100_000 ? "LOW" : balance < 500_000 ? "MEDIUM" : "HEALTHY",
    recommendation: balance < 100_000 
      ? "Fund treasury immediately" 
      : balance < 500_000 
      ? "Consider funding soon" 
      : "Treasury is healthy",
  };
}


