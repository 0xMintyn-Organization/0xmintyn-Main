/**
 * Mintyn Token Payment Utilities
 * Handles Mintyn token transfers for course enrollment
 */

import {
  Connection,
  PublicKey,
  Transaction,
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

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

// Admin wallet address for platform fees (5%)
export const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || "";

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
 * Transfer Mintyn tokens with fee split (5% to admin, 95% to instructor)
 */
export async function transferMintynTokensWithFeeSplit(
  fromWallet: PublicKey,
  instructorWallet: PublicKey,
  adminWallet: PublicKey,
  totalAmount: number, // Total amount in tokens (not raw units)
  phantomProvider: any
): Promise<{ 
  signature: string; 
  instructorSignature?: string;
  adminSignature?: string;
  instructorAmount: number;
  adminAmount: number;
}> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Verify wallet connection
    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }
    
    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== fromWallet.toString()) {
      throw new Error("Connected wallet doesn't match. Please connect the correct wallet.");
    }
    
    // Calculate fee split
    const adminFeePercentage = 0.05; // 5%
    const instructorFeePercentage = 0.95; // 95%
    
    const adminAmount = totalAmount * adminFeePercentage;
    const instructorAmount = totalAmount * instructorFeePercentage;
    
    // Get mint info
    const mint = await getMint(connection, MINTYN_MINT);
    
    // Convert amounts to raw units
    const rawTotalAmount = BigInt(Math.floor(totalAmount * Math.pow(10, mint.decimals)));
    const rawAdminAmount = BigInt(Math.floor(adminAmount * Math.pow(10, mint.decimals)));
    const rawInstructorAmount = BigInt(Math.floor(instructorAmount * Math.pow(10, mint.decimals)));
    
    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, fromWallet);
    const instructorTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, instructorWallet);
    const adminTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, adminWallet);
    
    // Check sender balance
    let fromAccount;
    try {
      fromAccount = await getAccount(connection, fromTokenAccount);
      if (Number(fromAccount.amount) < Number(rawTotalAmount)) {
        throw new Error(`Insufficient balance. You have ${Number(fromAccount.amount) / Math.pow(10, mint.decimals)} 0XM, but need ${totalAmount} 0XM.`);
      }
    } catch (error: any) {
      if (error.message.includes("Insufficient balance")) {
        throw error;
      }
      throw new Error("Token account not found. Please ensure you have Mintyn tokens.");
    }
    
    // Check/create recipient token accounts
    const transaction = new Transaction();
    
    // Check instructor account
    try {
      await getAccount(connection, instructorTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromWallet,
          instructorTokenAccount,
          instructorWallet,
          MINTYN_MINT
        )
      );
    }
    
    // Check admin account
    try {
      await getAccount(connection, adminTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromWallet,
          adminTokenAccount,
          adminWallet,
          MINTYN_MINT
        )
      );
    }
    
    // If we need to create accounts, send that transaction first
    if (transaction.instructions.length > 0) {
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet;
      
      const signedTx = await phantomProvider.signTransaction(transaction);
      await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signedTx.serialize(), "confirmed");
    }
    
    // Create transfer instructions for both recipients
    const transferTransaction = new Transaction();
    
    // Transfer to instructor (95%)
    transferTransaction.add(
      createTransferInstruction(
        fromTokenAccount,
        instructorTokenAccount,
        fromWallet,
        rawInstructorAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    // Transfer to admin (5%)
    transferTransaction.add(
      createTransferInstruction(
        fromTokenAccount,
        adminTokenAccount,
        fromWallet,
        rawAdminAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    // Build transaction (don't send yet - backend will submit)
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transferTransaction.recentBlockhash = blockhash;
    transferTransaction.feePayer = fromWallet;
    
    // Sign transaction with Phantom wallet
    const signedTx = await phantomProvider.signTransaction(transferTransaction);
    
    // Serialize the signed transaction to base64 for backend submission
    const signedTransactionBase64 = Buffer.from(signedTx.serialize()).toString('base64');
    
    // Note: We don't send the transaction here - backend will submit it
    // This allows backend to verify and log the transaction properly
    
    console.log("✅ Transaction signed successfully!");
    console.log(`Total Amount: ${totalAmount} 0XM`);
    console.log(`Instructor (95%): ${instructorAmount} 0XM → ${instructorWallet.toString()}`);
    console.log(`Admin (5%): ${adminAmount} 0XM → ${adminWallet.toString()}`);
    console.log("Transaction will be submitted by backend...");
    
    return {
      signature: "", // Will be set by backend after submission
      instructorAmount,
      adminAmount,
      signedTransaction: signedTransactionBase64,
    };
  } catch (error: any) {
    console.error("❌ Error transferring Mintyn tokens with fee split:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      throw new Error("Transaction was cancelled.");
    }
    if (errorMessage.includes("Insufficient")) {
      throw new Error(errorMessage);
    }
    
    throw new Error(errorMessage || "Failed to transfer Mintyn tokens. Please try again.");
  }
}

/**
 * Transfer Mintyn tokens from user to instructor (legacy - single transfer)
 */
export async function transferMintynTokens(
  fromWallet: PublicKey,
  toWallet: PublicKey,
  amount: number, // Amount in tokens (not raw units)
  phantomProvider: any
): Promise<{ signature: string; fromTokenAccount: PublicKey; toTokenAccount: PublicKey }> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Verify wallet connection
    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }
    
    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== fromWallet.toString()) {
      throw new Error("Connected wallet doesn't match. Please connect the correct wallet.");
    }
    
    // Get mint info
    const mint = await getMint(connection, MINTYN_MINT);
    
    // Convert amount to raw units (with decimals)
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, mint.decimals)));
    
    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, fromWallet);
    const toTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, toWallet);
    
    // Check sender balance
    let fromAccount;
    try {
      fromAccount = await getAccount(connection, fromTokenAccount);
      if (Number(fromAccount.amount) < Number(rawAmount)) {
        throw new Error(`Insufficient balance. You have ${Number(fromAccount.amount) / Math.pow(10, mint.decimals)} 0XM, but need ${amount} 0XM.`);
      }
    } catch (error: any) {
      if (error.message.includes("Insufficient balance")) {
        throw error;
      }
      throw new Error("Token account not found. Please ensure you have Mintyn tokens.");
    }
    
    // Check if recipient token account exists, create if not
    let toAccount;
    try {
      toAccount = await getAccount(connection, toTokenAccount);
    } catch {
      // Create recipient token account
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        fromWallet, // Payer
        toTokenAccount, // ATA address
        toWallet, // Owner
        MINTYN_MINT // Mint
      );
      
      const transaction = new Transaction().add(createATAInstruction);
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet;
      
      const signedTx = await phantomProvider.signTransaction(transaction);
      await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signedTx.serialize(), "confirmed");
    }
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromWallet,
      rawAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Build and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet;
    
    const signedTx = await phantomProvider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    
    console.log("✅ Mintyn tokens transferred successfully!");
    console.log("Transaction signature:", signature);
    console.log(`Amount: ${amount} 0XM`);
    console.log(`From: ${fromWallet.toString()}`);
    console.log(`To: ${toWallet.toString()}`);
    
    return {
      signature,
      fromTokenAccount,
      toTokenAccount,
    };
  } catch (error: any) {
    console.error("❌ Error transferring Mintyn tokens:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      throw new Error("Transaction was cancelled.");
    }
    if (errorMessage.includes("Insufficient")) {
      throw new Error(errorMessage);
    }
    
    throw new Error(errorMessage || "Failed to transfer Mintyn tokens. Please try again.");
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

