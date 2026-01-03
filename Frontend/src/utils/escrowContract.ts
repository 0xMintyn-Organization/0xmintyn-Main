/**
 * Escrow Contract Utilities
 * Handles escrow operations for marketplace orders
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { Program, AnchorProvider, Wallet, BN, BorshInstructionCoder } from "@coral-xyz/anchor";
import { MINTYN_MINT, MINTYN_DECIMALS, RPC_URL, getMintynBalance } from "./mintynPayment";
/**
 * Load IDL from public folder (matching governance pattern)
 */
let cachedIdl: any = null;

async function loadIDL(forceRefresh: boolean = false): Promise<any> {
  if (cachedIdl && !forceRefresh) return cachedIdl;
  
  // Clear cache if forcing refresh
  if (forceRefresh) {
    cachedIdl = null;
  }

  try {
    // Add cache-busting parameter to ensure fresh IDL is loaded
    const cacheBuster = `?v=${Date.now()}`;
    
    // Try loading from /idl/ directory first (like governance)
    let response = await fetch(`/idl/escrow_updated.json${cacheBuster}`);
    if (!response.ok) {
      // Fallback to root public folder
      response = await fetch(`/escrow-idl.json${cacheBuster}`);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load IDL: ${response.status}`);
    }
    
    const idl = await response.json();
    
    // Log account structure for debugging
    if (idl.accounts && idl.accounts.length > 0) {
      const firstAccount = idl.accounts[0];
      console.log("📋 IDL Account structure:", {
        name: firstAccount.name,
        hasType: !!firstAccount.type,
        typeKind: firstAccount.type?.kind,
        fieldsCount: firstAccount.type?.fields?.length,
        fullAccount: JSON.stringify(firstAccount, null, 2).substring(0, 500) // First 500 chars for debugging
      });
      
      // If type is missing, try to find it in types array
      if (!firstAccount.type && idl.types && Array.isArray(idl.types)) {
        const matchingType = idl.types.find((t: any) => t.name === firstAccount.name);
        if (matchingType) {
          console.log("⚠️  Account missing type, but found in types array:", matchingType.name);
          firstAccount.type = matchingType.type;
          console.log("✅ Manually linked account type");
        }
      }
    }
    
    // Validate IDL structure
    if (!idl || typeof idl !== 'object') {
      throw new Error("Invalid IDL format: IDL is not an object");
    }
    
    // Ensure IDL has address field (required by Anchor Program)
    if (!idl.address) {
      // If missing, add it from the program ID
      idl.address = ESCROW_PROGRAM_ID.toString();
      console.log("⚠️  IDL missing address field, added:", idl.address);
    }
    
    // Ensure metadata exists
    if (!idl.metadata) {
      idl.metadata = {
        name: "escrow_updated",
        version: "0.1.0",
        spec: "0.1.0"
      };
      console.log("⚠️  IDL missing metadata, added default");
    }
    
    // Ensure all required arrays exist
    if (!idl.instructions) idl.instructions = [];
    if (!idl.accounts) idl.accounts = [];
    if (!idl.errors) idl.errors = [];
    if (!idl.types) idl.types = [];
    
    console.log("✅ Escrow IDL loaded successfully:", idl.metadata?.name || "escrow_updated");
    console.log("   Address:", idl.address);
    console.log("   Instructions:", idl.instructions.length);
    console.log("   Accounts:", idl.accounts.length);
    cachedIdl = idl;
    return cachedIdl;
  } catch (error) {
    console.error("❌ Error loading Escrow IDL:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Escrow program IDL: ${errorMessage}. Please ensure the IDL file exists at /idl/escrow_updated.json or /escrow-idl.json`);
  }
}

// Escrow Program ID (from deployment)
export const ESCROW_PROGRAM_ID = new PublicKey("8acD4ZEnsvqq4iezDrfTBgGGqz1srjQTe816cVjmNnXt");

/**
 * Check if escrow program is deployed and ready
 */
export async function isEscrowProgramReady(connection?: Connection): Promise<boolean> {
  try {
    const conn = connection || new Connection(RPC_URL, "confirmed");
    
    // Check if program account exists
    const programInfo = await conn.getAccountInfo(ESCROW_PROGRAM_ID);
    
    if (!programInfo) {
      console.warn("Escrow program not found at:", ESCROW_PROGRAM_ID.toString());
      return false;
    }
    
    // Check if program is executable
    if (!programInfo.executable) {
      console.warn("Escrow program exists but is not executable");
      return false;
    }
    
    console.log("✅ Escrow program is deployed and ready");
    return true;
  } catch (error) {
    console.error("Error checking escrow program:", error);
    return false;
  }
}

/**
 * Get escrow program instance (matching governance pattern)
 */
export async function getEscrowProgram(provider: AnchorProvider, forceRefreshIdl: boolean = false): Promise<Program> {
  try {
    const idl = await loadIDL(forceRefreshIdl);
    
    if (!idl) {
      throw new Error("Failed to load IDL");
    }
    
    // Validate IDL structure
    if (!idl.instructions || !Array.isArray(idl.instructions)) {
      throw new Error("Invalid IDL structure: missing instructions");
    }
    
    // Log IDL structure for debugging
    console.log("📋 IDL loaded:", {
      name: idl.metadata?.name || idl.name,
      version: idl.metadata?.version || idl.version,
      instructions: idl.instructions?.length || 0,
      hasAddress: !!idl.address,
      programId: ESCROW_PROGRAM_ID.toString()
    });
    
    // Create program instance with error handling (like governance)
    try {
      // Ensure IDL address matches program ID
      if (idl.address && idl.address !== ESCROW_PROGRAM_ID.toString()) {
        console.warn(`⚠️  IDL address (${idl.address}) doesn't match program ID (${ESCROW_PROGRAM_ID.toString()}), using program ID`);
        idl.address = ESCROW_PROGRAM_ID.toString();
      }
      
      // Keep accounts array - needed for instruction encoding
      // Ensure all accounts have proper type definitions
      const idlForProgram = { ...idl };
      
      // Link account types if missing (should already be in IDL file, but ensure it)
      if (idlForProgram.accounts && idlForProgram.types) {
        idlForProgram.accounts.forEach((account: any) => {
          if (!account.type && account.name) {
            const matchingType = idlForProgram.types.find((t: any) => t.name === account.name);
            if (matchingType && matchingType.type) {
              account.type = matchingType.type;
              console.log(`✅ Linked account ${account.name} to its type definition`);
            }
          }
        });
      }
      
      // Create Program - keep accounts array for instruction encoding
      // The IDL file should have the type field properly set
      let program: Program;
      try {
        // @ts-ignore - TypeScript has issues with IDL type inference
        program = new Program(idlForProgram, ESCROW_PROGRAM_ID, provider);
        console.log("✅ Program created successfully");
      } catch (sizeError: any) {
        // If size calculation fails, this is a known Anchor browser bug
        // We'll need to manually encode instructions
        if (sizeError.message?.includes('size') || sizeError.message?.includes('undefined')) {
          console.warn("⚠️  Account size calculation failed - this is a known Anchor browser bug");
          console.warn("⚠️  Attempting to create Program without accounts array...");
          const minimalIdl = { ...idlForProgram };
          delete minimalIdl.accounts;
          // @ts-ignore
          program = new Program(minimalIdl, ESCROW_PROGRAM_ID, provider);
          // Mark program for manual instruction encoding
          (program as any)._needsManualEncoding = true;
          (program as any)._fullIdl = idlForProgram; // Keep full IDL for manual encoding
          console.log("✅ Program created without accounts array (will use manual encoding)");
        } else {
          throw sizeError;
        }
      }
      console.log("✅ Program instance created successfully");
      return program;
    } catch (programError: any) {
      console.error("⚠️  Error creating Program instance:");
      console.error("   Error type:", programError.constructor?.name);
      console.error("   Error message:", programError.message);
      console.error("   Error stack:", programError.stack);
      console.error("   IDL structure:", {
        address: idl.address,
        hasMetadata: !!idl.metadata,
        instructionsCount: idl.instructions?.length,
        accountsCount: idl.accounts?.length,
        errorsCount: idl.errors?.length,
        typesCount: idl.types?.length,
        programId: ESCROW_PROGRAM_ID.toString()
      });
      
      // Log the actual error details
      if (programError.cause) {
        console.error("   Error cause:", programError.cause);
      }
      if (programError.logs) {
        console.error("   Error logs:", programError.logs);
      }
      
      // Try to get more details about what's missing
      const errorMsg = programError.message || String(programError);
      throw new Error(
        `Failed to create Escrow Program instance: ${errorMsg}\n` +
        `IDL has ${idl.instructions?.length || 0} instructions, ${idl.accounts?.length || 0} accounts.\n` +
        `Program ID: ${ESCROW_PROGRAM_ID.toString()}\n` +
        `Please check the IDL file matches the deployed program.`
      );
    }
  } catch (error: any) {
    console.error("Error creating Program:", error);
    throw new Error(`Failed to initialize escrow program: ${error.message}`);
  }
}

/**
 * Convert MongoDB ObjectId (24 hex characters) to [u8; 12] array
 */
function objectIdToBytes(objectId: string): [number, number, number, number, number, number, number, number, number, number, number, number] {
  // MongoDB ObjectId is 24 hex characters = 12 bytes
  const bytes = Buffer.from(objectId, 'hex');
  if (bytes.length !== 12) {
    throw new Error(`Invalid ObjectId length: expected 12 bytes, got ${bytes.length}`);
  }
  return [
    bytes[0], bytes[1], bytes[2], bytes[3],
    bytes[4], bytes[5], bytes[6], bytes[7],
    bytes[8], bytes[9], bytes[10], bytes[11]
  ];
}

/**
 * Derive escrow PDA addresses (now includes offer_id for unique escrow per offer)
 * IMPORTANT: Must use the exact same bytes format as objectIdToBytes to match Anchor's PDA derivation
 */
export function deriveEscrowPDAs(buyer: PublicKey, seller: PublicKey, offerId: string): {
  escrowAccount: PublicKey;
  escrowVault: PublicKey;
} {
  // Convert MongoDB ObjectId to bytes using the same method as objectIdToBytes
  // This ensures the bytes match exactly what we pass to Anchor in instruction arguments
  const offerIdTuple = objectIdToBytes(offerId);
  // Convert tuple to Buffer for PDA derivation (Anchor uses raw bytes for seeds)
  const offerIdBuffer = Buffer.from(offerIdTuple);
  
  const [escrowAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyer.toBuffer(), seller.toBuffer(), offerIdBuffer],
    ESCROW_PROGRAM_ID
  );

  const [escrowVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyer.toBuffer(), seller.toBuffer(), offerIdBuffer, Buffer.from("vault")],
    ESCROW_PROGRAM_ID
  );

  return { escrowAccount, escrowVault };
}

/**
 * Check if user has enough balance for escrow
 */
export async function checkEscrowBalance(
  userWallet: PublicKey,
  requiredAmount: number,
  connection?: Connection
): Promise<{ hasEnough: boolean; balance: number; required: number }> {
  const conn = connection || new Connection(RPC_URL, "confirmed");
  
  try {
    const { balance } = await getMintynBalance(userWallet, conn);
    const hasEnough = balance >= requiredAmount;
    
    return {
      hasEnough,
      balance,
      required: requiredAmount,
    };
  } catch (error) {
    console.error("Error checking escrow balance:", error);
    return {
      hasEnough: false,
      balance: 0,
      required: requiredAmount,
    };
  }
}

/**
 * Create escrow - buyer deposits tokens
 * This is called from frontend when user accepts an offer
 */
export async function createEscrow(
  buyerWallet: PublicKey,
  sellerWallet: PublicKey,
  adminWallet: PublicKey,
  amount: number, // Amount in tokens (not raw units)
  offerId: string, // MongoDB ObjectId (24 hex characters)
  phantomProvider: any
): Promise<{ signature: string; escrowAccount: PublicKey }> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Verify escrow program is deployed
    const isReady = await isEscrowProgramReady(connection);
    if (!isReady) {
      throw new Error("Escrow program is not deployed or not ready. Please contact support.");
    }
    
    // Verify wallet connection
    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }
    
    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== buyerWallet.toString()) {
      throw new Error("Connected wallet doesn't match. Please connect the correct wallet.");
    }

    // Check balance first
    const balanceCheck = await checkEscrowBalance(buyerWallet, amount, connection);
    if (!balanceCheck.hasEnough) {
      throw new Error(
        `Insufficient balance. You have ${balanceCheck.balance.toFixed(2)} tokens but need ${amount.toFixed(2)} tokens.`
      );
    }

    // Convert amount to raw units (with decimals)
    const amountRaw = new BN(amount * Math.pow(10, MINTYN_DECIMALS));

    // Convert offer ID to bytes for contract
    // Use objectIdToBytes to get tuple format that Anchor expects
    const offerIdBytes = objectIdToBytes(offerId);

    // Derive PDAs (must use same bytes format as instruction argument)
    const { escrowAccount, escrowVault } = deriveEscrowPDAs(buyerWallet, sellerWallet, offerId);

    // Get token accounts
    const buyerTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      buyerWallet
    );

    // Check if buyer token account exists
    let buyerTokenAccountExists = true;
    try {
      await getAccount(connection, buyerTokenAccount);
    } catch {
      buyerTokenAccountExists = false;
    }

    // Create a Wallet adapter for Phantom
    const walletAdapter = {
      publicKey: phantomProvider.publicKey,
      signTransaction: async (tx: any) => {
        return await phantomProvider.signTransaction(tx);
      },
      signAllTransactions: async (txs: any[]) => {
        return await phantomProvider.signAllTransactions(txs);
      },
    };

    // Create provider
    const provider = new AnchorProvider(
      connection,
      walletAdapter as unknown as Wallet,
      { commitment: "confirmed" }
    );

    // Get program
    const program = await getEscrowProgram(provider);

    // Build transaction
    const transaction = new (await import("@solana/web3.js")).Transaction();

    // Create buyer token account if needed
    if (!buyerTokenAccountExists) {
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        buyerWallet,
        buyerTokenAccount,
        buyerWallet,
        MINTYN_MINT
      );
      transaction.add(createATAInstruction);
    }

    // Call create_escrow instruction
    // Check if we need manual encoding (workaround for Anchor browser bug)
    let signature: string;
    
    if ((program as any)._needsManualEncoding) {
      // Manual instruction encoding workaround for Anchor browser bug
      console.log("⚠️  Using manual instruction encoding workaround");
      const { TransactionInstruction } = await import("@solana/web3.js");
      const fullIdl = (program as any)._fullIdl;
      const instructionCoder = new BorshInstructionCoder(fullIdl);
      
      // Encode instruction data (include offer_id - must match IDL field name)
      // Use tuple format to match what Anchor expects
      const instructionData = instructionCoder.encode("create_escrow", {
        amount: amountRaw,
        offer_id: offerIdBytes, // Tuple format [number, ...]
      });
      
      if (!instructionData) {
        throw new Error("Failed to encode create_escrow instruction");
      }
      
      // Create instruction manually with correct account order from IDL
      const instruction = new TransactionInstruction({
        programId: ESCROW_PROGRAM_ID,
        keys: [
          { pubkey: buyerWallet, isSigner: true, isWritable: true },
          { pubkey: MINTYN_MINT, isSigner: false, isWritable: false },
          { pubkey: escrowAccount, isSigner: false, isWritable: true },
          { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: escrowVault, isSigner: false, isWritable: true },
          { pubkey: sellerWallet, isSigner: false, isWritable: false },
          { pubkey: adminWallet, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });
      
      transaction.add(instruction);
      
      // Sign and send transaction manually
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = buyerWallet;
      
      // Sign transaction with wallet
      const signedTx = await walletAdapter.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
      });
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
    } else {
      // Normal Anchor method call
      // Anchor expects [u8; 12] as a tuple - use offerIdBytes directly
      signature = await program.methods
        .createEscrow(amountRaw, offerIdBytes)
        .accounts({
          buyer: buyerWallet,
          mintynMint: MINTYN_MINT,
          escrowAccount: escrowAccount,
          buyerTokenAccount: buyerTokenAccount,
          escrowTokenAccount: escrowVault,
          seller: sellerWallet,
          admin: adminWallet,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }

    // .rpc() returns the transaction signature
    return {
      signature,
      escrowAccount,
    };
  } catch (error: any) {
    console.error("Error creating escrow:", error);
    throw new Error(error.message || "Failed to create escrow");
  }
}
