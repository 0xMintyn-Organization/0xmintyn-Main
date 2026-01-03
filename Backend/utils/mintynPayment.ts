/**
 * Backend Mintyn Token Payment Utilities
 * Handles Mintyn token transfers for course enrollment
 */

import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
  createTransferInstruction,
} from "@solana/spl-token";

// Constants
export const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
export const MINTYN_DECIMALS = 9;

export const NETWORK = process.env.SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "devnet"
    ? process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
    : process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Admin wallet address for platform fees (5%)
// Supports both ADMIN_WALLET_ADDRESS and NEXT_PUBLIC_ADMIN_WALLET_ADDRESS
export const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || "";

/**
 * Get user's Mintyn token balance
 */
export async function getMintynBalance(
  userWallet: PublicKey,
  connection: Connection
): Promise<{ balance: number; tokenAccount: PublicKey | null }> {
  try {
    const ata = await getAssociatedTokenAddress(MINTYN_MINT, userWallet);
    
    try {
      const account = await getAccount(connection, ata);
      const mint = await getMint(connection, MINTYN_MINT);
      const balance = Number(account.amount) / Math.pow(10, mint.decimals);
      return { balance, tokenAccount: ata };
    } catch {
      // ATA doesn't exist, search for other token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userWallet, {
        mint: MINTYN_MINT,
      });
      
      if (tokenAccounts.value.length > 0) {
        const account = tokenAccounts.value[0];
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount || 0;
        return { balance, tokenAccount: account.pubkey };
      }
      
      return { balance: 0, tokenAccount: ata };
    }
  } catch (error) {
    console.error("Error getting Mintyn balance:", error);
    return { balance: 0, tokenAccount: null };
  }
}

/**
 * Check if user has enough Mintyn tokens
 */
export async function checkMintynBalance(
  userWallet: PublicKey,
  requiredAmount: number,
  connection?: Connection
): Promise<{ hasEnough: boolean; balance: number; required: number; tokenAccount: PublicKey | null }> {
  const conn = connection || new Connection(RPC_URL, "confirmed");
  
  try {
    const { balance, tokenAccount } = await getMintynBalance(userWallet, conn);
    const hasEnough = balance >= requiredAmount;
    
    return {
      hasEnough,
      balance,
      required: requiredAmount,
      tokenAccount,
    };
  } catch (error) {
    console.error("Error checking Mintyn balance:", error);
    return {
      hasEnough: false,
      balance: 0,
      required: requiredAmount,
      tokenAccount: null,
    };
  }
}

/**
 * Verify and submit a signed transaction for Mintyn token transfer with fee split
 * This function receives a signed transaction from the frontend and submits it
 */
export async function submitSignedTransaction(
  signedTransactionBase64: string,
  userWalletAddress: string,
  instructorWalletAddress: string,
  totalAmount: number
): Promise<{ 
  signature: string; 
  instructorAmount: number;
  adminAmount: number;
}> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Validate admin wallet address
    if (!ADMIN_WALLET_ADDRESS) {
      throw new Error("Admin wallet address not configured. Please set ADMIN_WALLET_ADDRESS in environment variables.");
    }
    
    // Parse the signed transaction
    const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64');
    let transaction: Transaction | VersionedTransaction;
    
    try {
      // Try parsing as VersionedTransaction first
      transaction = VersionedTransaction.deserialize(transactionBuffer);
    } catch {
      // Fall back to legacy Transaction
      transaction = Transaction.from(transactionBuffer);
    }
    
    // Verify transaction signer matches user wallet
    const userWallet = new PublicKey(userWalletAddress);
    const instructorWallet = new PublicKey(instructorWalletAddress);
    const adminWallet = new PublicKey(ADMIN_WALLET_ADDRESS);
    
    // Calculate fee split
    const adminFeePercentage = 0.05; // 5%
    const instructorFeePercentage = 0.95; // 95%
    
    const adminAmount = totalAmount * adminFeePercentage;
    const instructorAmount = totalAmount * instructorFeePercentage;
    
    // Get mint info for verification
    const mint = await getMint(connection, MINTYN_MINT);
    
    // Verify transaction structure (should have 2 transfer instructions)
    if (transaction instanceof Transaction) {
      const instructions = transaction.instructions;
      if (instructions.length < 2) {
        throw new Error("Transaction should contain at least 2 transfer instructions (instructor + admin)");
      }
    }
    
    // Submit the signed transaction
    let signature: string;
    
    if (transaction instanceof VersionedTransaction) {
      signature = await connection.sendTransaction(transaction, {
        skipPreflight: false,
        maxRetries: 3,
      });
    } else {
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
    }
    
    // Wait for confirmation
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    
    console.log("✅ Mintyn tokens transferred successfully with fee split!");
    console.log("Transaction signature:", signature);
    console.log(`Total Amount: ${totalAmount} 0XM`);
    console.log(`Instructor (95%): ${instructorAmount} 0XM → ${instructorWalletAddress}`);
    console.log(`Admin (5%): ${adminAmount} 0XM → ${ADMIN_WALLET_ADDRESS}`);
    
    return {
      signature,
      instructorAmount,
      adminAmount,
    };
  } catch (error: any) {
    console.error("❌ Error submitting signed transaction:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("Insufficient")) {
      throw new Error(errorMessage);
    }
    
    throw new Error(errorMessage || "Failed to submit transaction. Please try again.");
  }
}
