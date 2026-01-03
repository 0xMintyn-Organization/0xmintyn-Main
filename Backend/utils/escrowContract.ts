/**
 * Backend Escrow Contract Utilities
 * Handles escrow release and refund operations
 */

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { Program, AnchorProvider, Wallet, BN, BorshInstructionCoder, BorshAccountsCoder } from "@coral-xyz/anchor";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { MINTYN_MINT, MINTYN_DECIMALS, RPC_URL } from "./mintynPayment";
import fs from "fs";
import path from "path";

// Escrow Program ID
export const ESCROW_PROGRAM_ID = new PublicKey("8acD4ZEnsvqq4iezDrfTBgGGqz1srjQTe816cVjmNnXt");

// Admin wallet (for signing release/refund transactions)
let adminKeypair: Keypair | null = null;

/**
 * Load admin keypair from environment or file
 * Supports: seed phrase, private key, or keypair file
 */
function getAdminKeypair(): Keypair {
  if (adminKeypair) {
    return adminKeypair;
  }

  // Option 1: Seed phrase (recovery phrase) - 12 or 24 words
  const adminSeedPhrase = process.env.ADMIN_SEED_PHRASE;
  if (adminSeedPhrase) {
    try {
      // Check if required packages are installed
      let bip39: any, ed25519HdKey: any;
      try {
        bip39 = require("bip39");
        ed25519HdKey = require("ed25519-hd-key");
      } catch (e) {
        throw new Error(
          "Missing required packages. Run: npm install bip39 ed25519-hd-key"
        );
      }
      
      // Validate mnemonic
      if (!bip39.validateMnemonic(adminSeedPhrase)) {
        throw new Error("Invalid seed phrase. Please check your recovery phrase.");
      }
      
      // Derive seed from mnemonic
      const seed = bip39.mnemonicToSeedSync(adminSeedPhrase);
      
      // Derive keypair using Solana's derivation path: m/44'/501'/0'/0'
      const derivedSeed = ed25519HdKey.derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
      adminKeypair = Keypair.fromSeed(Buffer.from(derivedSeed));
      
      console.log("✅ Admin keypair loaded from seed phrase");
      console.log("   Admin wallet address:", adminKeypair.publicKey.toBase58());
      return adminKeypair;
    } catch (error: any) {
      console.error("❌ Error loading keypair from seed phrase:", error.message);
      throw new Error(
        `Failed to derive keypair from seed phrase: ${error.message}. ` +
        `Make sure 'bip39' and 'ed25519-hd-key' packages are installed: npm install bip39 ed25519-hd-key`
      );
    }
  }

  // Option 2: Private key as base64 encoded array
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  if (adminPrivateKey) {
    try {
      const keyArray = JSON.parse(adminPrivateKey);
      adminKeypair = Keypair.fromSecretKey(Uint8Array.from(keyArray));
      console.log("✅ Admin keypair loaded from ADMIN_PRIVATE_KEY");
      return adminKeypair;
    } catch {
      // Try as base64 string
      try {
        adminKeypair = Keypair.fromSecretKey(
          Buffer.from(adminPrivateKey, "base64")
        );
        console.log("✅ Admin keypair loaded from ADMIN_PRIVATE_KEY (base64)");
        return adminKeypair;
      } catch (error: any) {
        throw new Error(`Failed to parse ADMIN_PRIVATE_KEY: ${error.message}`);
      }
    }
  }

  // Option 3: Keypair file path
  const keypairPath = process.env.ADMIN_KEYPAIR_PATH || path.join(process.cwd(), "admin-keypair.json");
  if (fs.existsSync(keypairPath)) {
    try {
      const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
      adminKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      console.log("✅ Admin keypair loaded from file");
      return adminKeypair;
    } catch (error: any) {
      throw new Error(`Failed to load keypair from file: ${error.message}`);
    }
  }

  // No keypair found
  throw new Error(
    "Admin keypair not found. The escrow contract requires admin to SIGN transactions. " +
    "Set one of: ADMIN_SEED_PHRASE (12-word recovery phrase), ADMIN_PRIVATE_KEY (base64 encoded), or ADMIN_KEYPAIR_PATH (file path). " +
    "⚠️ WARNING: Never commit private keys or seed phrases to git. Store securely in environment variables."
  );
}

/**
 * Load IDL from file or use fallback
 */
function getEscrowIDL(): any {
  const idlPaths = [
    // Try frontend public IDL first (most likely to exist)
    path.join(process.cwd(), "..", "Frontend", "public", "idl", "escrow_updated.json"),
    // Try contract target directory
    path.join(process.cwd(), "..", "0xmintyn_Blockchain_Development", "Smart_Contract", "escrow_updated", "target", "idl", "escrow_updated.json"),
    // Try alternative path
    path.join(process.cwd(), "0xmintyn_Blockchain_Development", "Smart_Contract", "escrow_updated", "target", "idl", "escrow_updated.json"),
  ];
  
  for (const idlPath of idlPaths) {
    try {
      if (fs.existsSync(idlPath)) {
        const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
        // Ensure address field is set correctly (Anchor requires this)
        if (!idl.address || idl.address !== ESCROW_PROGRAM_ID.toString()) {
          idl.address = ESCROW_PROGRAM_ID.toString();
        }
        console.log(`✅ Loaded IDL from: ${idlPath}`);
        return idl;
      }
    } catch (error) {
      console.warn(`Could not load IDL from ${idlPath}:`, error);
    }
  }
  
  console.warn("⚠️  Could not load IDL from any path, using fallback");
  
  // Fallback IDL structure
  return {
    address: ESCROW_PROGRAM_ID.toString(), // Ensure address is set
    version: "0.1.0",
    name: "escrow_updated",
    instructions: [
      {
        name: "releaseEscrow",
        accounts: [],
        args: [],
      },
      {
        name: "refundEscrow",
        accounts: [],
        args: [],
      },
    ],
  };
}

/**
 * Get escrow program instance
 * Handles IDL accounts array issue (known Anchor bug)
 */
function getEscrowProgram(provider: AnchorProvider): Program {
  const idl = getEscrowIDL();
  
  // Ensure IDL has correct address field (Anchor requires this)
  if (!idl.address || idl.address !== ESCROW_PROGRAM_ID.toString()) {
    idl.address = ESCROW_PROGRAM_ID.toString();
  }
  
  // Create a copy to avoid mutating the original
  const idlCopy = JSON.parse(JSON.stringify(idl));
  
  // Ensure accounts have type field linked (IDL might have accounts without type)
  // This is required for Anchor to calculate account sizes
  if (idlCopy.accounts && idlCopy.types) {
    idlCopy.accounts = idlCopy.accounts.map((account: any) => {
      // If account doesn't have type field, link it to the type definition
      if (!account.type && account.name) {
        const matchingType = idlCopy.types.find((t: any) => t.name === account.name);
        if (matchingType && matchingType.type) {
          // Link the account to its type definition
          return {
            ...account,
            type: matchingType.type
          };
        } else {
          console.warn(`⚠️  No matching type found for account: ${account.name}`);
        }
      }
      return account;
    });
    const linkedCount = idlCopy.accounts.filter((a: any) => a.type).length;
    console.log(`✅ Linked ${linkedCount}/${idlCopy.accounts.length} account(s) to type definitions`);
  }
  
  // Try to create program with full IDL including accounts
  // We MUST keep accounts array - it's required for instruction encoding
  // Even if size calculation fails, the Program might still be usable for instruction encoding
  let program: Program;
  
  try {
    program = new Program(idlCopy as any, ESCROW_PROGRAM_ID, provider);
    console.log("✅ Program created successfully with full IDL");
    return program;
  } catch (error: any) {
    // If size calculation fails, the error is often thrown during AccountClient construction
    // but the Program might still be partially created and usable for instruction encoding
    if (error.message?.includes('size') || error.message?.includes('undefined') || error.message?.includes('_bn')) {
      console.warn("⚠️  Size calculation error during Program construction");
      console.warn("⚠️  This error is often non-fatal - Program may still work for instruction encoding");
      
      // The error might be thrown, but the Program object might still be created
      // Try to access the error object to see if Program was partially created
      // If not, we'll create it with minimal IDL and use manual encoding
      
      // Create minimal IDL for Program constructor (avoids size calculation)
      const minimalIdl = { ...idlCopy };
      delete minimalIdl.accounts;
      
      try {
        program = new Program(minimalIdl as any, ESCROW_PROGRAM_ID, provider);
        
        // Now manually inject the full IDL's instruction coder
        // We'll create a wrapper that intercepts .methods() calls
        const instructionCoder = new BorshInstructionCoder(idlCopy);
        
        // Store the full IDL and coders for manual use
        (program as any)._fullIdl = idlCopy;
        (program as any)._instructionCoder = instructionCoder;
        (program as any)._accountsCoder = new BorshAccountsCoder(idlCopy);
        (program as any)._useManualEncoding = true;
        
        console.log("✅ Program created with minimal IDL (will use manual encoding wrapper)");
        return program;
      } catch (fallbackError: any) {
        console.error("❌ Failed to create Program even with minimal IDL:", fallbackError.message);
        throw new Error(`Failed to create escrow program: ${fallbackError.message}`);
      }
    } else {
      // Non-size error - rethrow
      throw error;
    }
  }
}

/**
 * Convert MongoDB ObjectId (24 hex characters) to [u8; 12] array
 */
function objectIdToBytes(objectId: string): [number, number, number, number, number, number, number, number, number, number, number, number] {
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
 * Derive escrow PDA addresses (now includes seller and offer_id for unique escrow per offer)
 */
export function deriveEscrowPDAs(buyer: PublicKey, seller: PublicKey, offerId: string): {
  escrowAccount: PublicKey;
  escrowVault: PublicKey;
} {
  // Convert MongoDB ObjectId to bytes
  const offerIdBytes = Buffer.from(offerId, 'hex');
  
  const [escrowAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyer.toBuffer(), seller.toBuffer(), offerIdBytes],
    ESCROW_PROGRAM_ID
  );

  const [escrowVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyer.toBuffer(), seller.toBuffer(), offerIdBytes, Buffer.from("vault")],
    ESCROW_PROGRAM_ID
  );

  return { escrowAccount, escrowVault };
}

/**
 * Release escrow - order completed (95% seller, 5% admin)
 * Now requires offer_id to derive the correct PDA
 */
export async function releaseEscrow(
  buyerWallet: PublicKey,
  sellerWallet: PublicKey,
  offerId: string // MongoDB ObjectId
): Promise<{ signature: string }> {
  try {
    console.log('🔄 Starting escrow release...');
    console.log('   Buyer wallet:', buyerWallet.toString());
    console.log('   Seller wallet:', sellerWallet.toString());
    
    const connection = new Connection(RPC_URL, "confirmed");
    const adminKeypair = getAdminKeypair();
    const adminWallet = adminKeypair.publicKey;
    
    console.log('   Admin wallet:', adminWallet.toString());

    // Create provider with admin wallet
    const wallet = new Wallet(adminKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    const program = getEscrowProgram(provider);
    console.log('   Program loaded successfully');

    // Convert offer ID to bytes
    const offerIdBytes = objectIdToBytes(offerId);
    
    // Derive PDAs (now includes seller and offer_id for unique escrow per offer)
    const { escrowAccount, escrowVault } = deriveEscrowPDAs(buyerWallet, sellerWallet, offerId);
    console.log('   Escrow account PDA:', escrowAccount.toString());
    console.log('   Escrow vault PDA:', escrowVault.toString());

    // Check escrow account exists and has balance
    try {
      const escrowAccountInfo = await connection.getAccountInfo(escrowAccount);
      if (!escrowAccountInfo) {
        throw new Error(`Escrow account ${escrowAccount.toString()} does not exist`);
      }
      console.log('   ✅ Escrow account exists');
      
      // Check vault balance
      const vaultAccount = await getAccount(connection, escrowVault);
      const vaultBalance = Number(vaultAccount.amount);
      console.log('   Vault balance:', vaultBalance, 'raw tokens');
      console.log('   Vault balance (display):', vaultBalance / Math.pow(10, MINTYN_DECIMALS), 'tokens');
      
      if (vaultBalance === 0) {
        throw new Error(`Escrow vault has zero balance`);
      }
    } catch (error: any) {
      console.error('   ❌ Error checking escrow account:', error.message);
      throw error;
    }

    // Get token accounts
    const sellerTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      sellerWallet
    );
    const adminTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      adminWallet
    );
    
    console.log('   Seller token account:', sellerTokenAccount.toString());
    console.log('   Admin token account:', adminTokenAccount.toString());

    // Check if token accounts exist, create if needed
    try {
      await getAccount(connection, sellerTokenAccount);
      console.log('   ✅ Seller token account exists');
    } catch {
      console.log('   ⚠️  Seller token account does not exist - will be created by program');
    }
    
    try {
      await getAccount(connection, adminTokenAccount);
      console.log('   ✅ Admin token account exists');
    } catch {
      console.log('   ⚠️  Admin token account does not exist - will be created by program');
    }

    console.log('   📤 Calling release_escrow instruction...');
    
    // Call release_escrow instruction
    // If manual encoding is needed, use instruction coder directly
    let signature: string;
    
    if ((program as any)._useManualEncoding) {
      // Manual encoding with full IDL's instruction coder
      console.log("⚠️  Using manual instruction encoding for releaseEscrow");
      const instructionCoder = (program as any)._instructionCoder;
      
      // Encode instruction data
      const instructionData = instructionCoder.encode("release_escrow", {
        offer_id: offerIdBytes,
      });
      
      if (!instructionData) {
        throw new Error("Failed to encode release_escrow instruction");
      }
      
      // Create instruction manually
      // Note: PDA signers are handled by the escrow program during CPI calls
      const instruction = new TransactionInstruction({
        programId: ESCROW_PROGRAM_ID,
        keys: [
          { pubkey: adminWallet, isSigner: true, isWritable: false },
          { pubkey: sellerWallet, isSigner: false, isWritable: true },
          { pubkey: adminWallet, isSigner: false, isWritable: true },
          { pubkey: MINTYN_MINT, isSigner: false, isWritable: false },
          { pubkey: escrowAccount, isSigner: false, isWritable: true },
          { pubkey: escrowVault, isSigner: false, isWritable: true },
          { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: adminTokenAccount, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });
      
      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = adminWallet;
      
      // Sign and send
      transaction.sign(adminKeypair);
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
      });
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
    } else {
      // Normal Anchor method call
      signature = await program.methods
        .releaseEscrow(offerIdBytes)
        .accounts({
          admin: adminWallet,
          seller: sellerWallet,
          adminWallet: adminWallet,
          mintynMint: MINTYN_MINT,
          escrowAccount: escrowAccount,
          escrowTokenAccount: escrowVault,
          sellerTokenAccount: sellerTokenAccount,
          adminTokenAccount: adminTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    }

    console.log('   ✅ Escrow released successfully!');
    console.log('   Transaction signature:', signature);
    
    // Verify the transaction
    const txDetails = await connection.getTransaction(signature, {
      commitment: "confirmed",
    });
    console.log('   Transaction status:', txDetails?.meta?.err ? 'FAILED' : 'SUCCESS');
    
    if (txDetails?.meta?.err) {
      console.error('   ❌ Transaction error:', txDetails.meta.err);
      throw new Error(`Transaction failed: ${JSON.stringify(txDetails.meta.err)}`);
    }

    return { signature };
  } catch (error: any) {
    console.error("❌ Error releasing escrow:", error);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);
    throw new Error(error.message || "Failed to release escrow");
  }
}

/**
 * Refund escrow - order cancelled (95% buyer, 5% admin)
 * Now requires seller wallet and offer_id to derive the correct PDA
 */
export async function refundEscrow(
  buyerWallet: PublicKey,
  sellerWallet: PublicKey,
  offerId: string // MongoDB ObjectId
): Promise<{ signature: string }> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const adminKeypair = getAdminKeypair();
    const adminWallet = adminKeypair.publicKey;

    // Create provider with admin wallet
    const wallet = new Wallet(adminKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    const program = getEscrowProgram(provider);

    // Convert offer ID to bytes
    const offerIdBytes = objectIdToBytes(offerId);
    
    // DEBUG: Log offer ID conversion
    console.log("🔍 DEBUG - Offer ID conversion:");
    console.log("   Offer ID (string):", offerId);
    console.log("   Offer ID (bytes):", offerIdBytes);
    console.log("   Offer ID (hex):", Buffer.from(offerIdBytes).toString('hex'));
    
    // Derive PDAs (now includes seller and offer_id for unique escrow per offer)
    const { escrowAccount, escrowVault } = deriveEscrowPDAs(buyerWallet, sellerWallet, offerId);
    
    // DEBUG: Log PDA addresses
    console.log("🔍 DEBUG - PDA addresses:");
    console.log("   Escrow Account:", escrowAccount.toString());
    console.log("   Escrow Vault:", escrowVault.toString());
    
    // DEBUG: Try to fetch and decode escrow account data to verify offer_id
    try {
      const escrowAccountInfo = await connection.getAccountInfo(escrowAccount);
      if (escrowAccountInfo) {
        console.log("✅ Escrow account exists on-chain");
        // Try to decode it manually using accounts coder
        try {
          let escrowData: any;
          if ((program as any)._useManualEncoding) {
            // Manual decoding using accounts coder
            const accountsCoder = (program as any)._accountsCoder;
            const fullIdl = (program as any)._fullIdl;
            
            if (!accountsCoder) {
              throw new Error("Accounts coder not available");
            }
            
            // Get account data - it's a Buffer in AccountInfo
            const accountData = escrowAccountInfo.data;
            if (!accountData || accountData.length === 0) {
              throw new Error("Escrow account data is empty or undefined");
            }
            
            // Convert to Buffer if it's a Uint8Array
            const dataBuffer = Buffer.isBuffer(accountData) 
              ? accountData 
              : Buffer.from(accountData);
            
            console.log("   Account data length:", dataBuffer.length, "bytes");
            
            // Anchor accounts have an 8-byte discriminator at the start
            // The accountsCoder.decode expects data WITHOUT the discriminator
            const accountDataWithoutDiscriminator = dataBuffer.slice(8);
            
            console.log("   Account data (without discriminator) length:", accountDataWithoutDiscriminator.length, "bytes");
            
            try {
              escrowData = accountsCoder.decode("EscrowAccount", accountDataWithoutDiscriminator);
              console.log("   ✅ Successfully decoded escrow account (without discriminator)");
              if (!escrowData) {
                throw new Error("Decode returned undefined");
              }
              console.log("   Decoded data type:", typeof escrowData);
              console.log("   Decoded data keys:", escrowData ? Object.keys(escrowData) : "null");
            } catch (decodeError: any) {
              console.log("   ⚠️  Decode error (without discriminator):", decodeError.message);
              // Try with full data (including discriminator) as fallback
              try {
                escrowData = accountsCoder.decode("EscrowAccount", dataBuffer);
                console.log("   ✅ Successfully decoded with full data");
                if (!escrowData) {
                  throw new Error("Decode returned undefined");
                }
                console.log("   Decoded data type:", typeof escrowData);
                console.log("   Decoded data keys:", escrowData ? Object.keys(escrowData) : "null");
              } catch (fallbackError: any) {
                console.log("   ❌ Both decode attempts failed");
                throw new Error(`Failed to decode escrow account: ${decodeError.message}, fallback: ${fallbackError.message}`);
              }
            }
          } else {
            // Normal decoding
            escrowData = await program.account.escrowAccount.fetch(escrowAccount);
          }
          
          // Verify escrowData exists and has offer_id (snake_case - matches Rust struct)
          if (!escrowData || !escrowData.offer_id) {
            throw new Error("Escrow data is missing or doesn't have offer_id field");
          }
          
          const onChainOfferId = Buffer.from(escrowData.offer_id).toString('hex');
          const providedOfferId = Buffer.from(offerIdBytes).toString('hex');
          console.log("🔍 DEBUG - Offer ID comparison:");
          console.log("   On-chain offer_id:", onChainOfferId);
          console.log("   Provided offer_id:", providedOfferId);
          if (onChainOfferId !== providedOfferId) {
            console.log("   ❌ MISMATCH! Offer IDs don't match!");
            throw new Error(`Offer ID mismatch: on-chain=${onChainOfferId}, provided=${providedOfferId}. The offer_id bytes must match exactly what's stored in the escrow account.`);
          }
          console.log("   ✅ Offer IDs match!");
          console.log("   On-chain buyer:", escrowData.buyer.toString());
          console.log("   On-chain seller:", escrowData.seller.toString());
          console.log("   Provided buyer:", buyerWallet.toString());
          console.log("   Provided seller:", sellerWallet.toString());
          
          // Verify buyer/seller match
          if (escrowData.buyer.toString() !== buyerWallet.toString()) {
            throw new Error(`Buyer mismatch: on-chain=${escrowData.buyer.toString()}, provided=${buyerWallet.toString()}`);
          }
          if (escrowData.seller.toString() !== sellerWallet.toString()) {
            throw new Error(`Seller mismatch: on-chain=${escrowData.seller.toString()}, provided=${sellerWallet.toString()}`);
          }
          console.log("   ✅ Buyer and seller match!");
        } catch (decodeError: any) {
          console.log("⚠️  Could not decode escrow account:", decodeError.message);
          // Don't throw - we'll try to proceed anyway, but this might be the issue
        }
      } else {
        console.log("❌ Escrow account does NOT exist on-chain!");
        throw new Error(`Escrow account not found: ${escrowAccount.toString()}. Make sure the escrow was created successfully.`);
      }
    } catch (fetchError: any) {
      console.log("⚠️  Could not fetch escrow account:", fetchError.message);
      throw fetchError; // Re-throw if account doesn't exist
    }

    // Get token accounts
    const buyerTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      buyerWallet
    );
    const adminTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      adminWallet
    );

    // Call refund_escrow instruction
    // If manual encoding is needed, use instruction coder directly
    let signature: string;
    
    if ((program as any)._useManualEncoding) {
      // Manual encoding with full IDL's instruction coder
      console.log("⚠️  Using manual instruction encoding for refundEscrow");
      const instructionCoder = (program as any)._instructionCoder;
      
      // Encode instruction data
      const instructionData = instructionCoder.encode("refund_escrow", {
        offer_id: offerIdBytes,
      });
      
      if (!instructionData) {
        throw new Error("Failed to encode refund_escrow instruction");
      }
      
      // Create instruction manually
      // CRITICAL: Account order MUST match IDL exactly:
      // 1. admin (signer)
      // 2. buyer (writable)
      // 3. admin_wallet (writable)
      // 4. mintyn_mint
      // 5. escrow_account (writable, PDA)
      // 6. escrow_token_account (writable, PDA)
      // 7. buyer_token_account (writable)
      // 8. admin_token_account (writable)
      // 9. token_program
      const instruction = new TransactionInstruction({
        programId: ESCROW_PROGRAM_ID,
        keys: [
          { pubkey: adminWallet, isSigner: true, isWritable: false },      // admin
          { pubkey: buyerWallet, isSigner: false, isWritable: true },    // buyer
          { pubkey: adminWallet, isSigner: false, isWritable: true },    // admin_wallet
          { pubkey: MINTYN_MINT, isSigner: false, isWritable: false },  // mintyn_mint
          { pubkey: escrowAccount, isSigner: false, isWritable: true },  // escrow_account (PDA)
          { pubkey: escrowVault, isSigner: false, isWritable: true },    // escrow_token_account (PDA)
          { pubkey: buyerTokenAccount, isSigner: false, isWritable: true }, // buyer_token_account
          { pubkey: adminTokenAccount, isSigner: false, isWritable: true }, // admin_token_account
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        ],
        data: instructionData,
      });
      
      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = adminWallet;
      
      // Sign and send
      transaction.sign(adminKeypair);
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
      });
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
    } else {
      // Normal Anchor method call
      signature = await program.methods
        .refundEscrow(offerIdBytes)
        .accounts({
          admin: adminWallet,
          buyer: buyerWallet,
          adminWallet: adminWallet,
          mintynMint: MINTYN_MINT,
          escrowAccount: escrowAccount,
          escrowTokenAccount: escrowVault,
          buyerTokenAccount: buyerTokenAccount,
          adminTokenAccount: adminTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    }

    return { signature };
  } catch (error: any) {
    console.error("Error refunding escrow:", error);
    throw new Error(error.message || "Failed to refund escrow");
  }
}

