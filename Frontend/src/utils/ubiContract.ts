/**
 * UBI Smart Contract Utility Functions
 * Handles all interactions with the UBI smart contract on Solana
 */

import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

// IDL will be loaded dynamically to avoid import issues
import type { Idl } from "@coral-xyz/anchor";

// ============================================================================
// CONSTANTS
// ============================================================================

// Program ID (from your deployment)
export const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");

// MintynToken mint address
// Mainnet: 4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL
// For Devnet, use your test mint address
export const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

// PDA Seeds
const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
const TREASURY_SEED = Buffer.from("treasury");
const USER_REGISTRATION_SEED = Buffer.from("user_registration");

// ============================================================================
// TYPES
// ============================================================================

export interface UbiProgramAccount {
  authority: PublicKey;
  mintynMint: PublicKey;
  treasury: PublicKey;
  ubiAmount: BN;
  totalRegistered: BN;
  bump: number;
}

export interface UserRegistrationAccount {
  user: PublicKey;
  registeredAt: BN;
  hasReceivedUbi: boolean;
  bump: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load IDL dynamically
 */
let cachedIdl: Idl | null = null;

async function loadIdl(): Promise<Idl> {
  if (cachedIdl) {
    return cachedIdl;
  }

  try {
    // Try to load from public folder
    const response = await fetch("/idl/ubi_smart_contract.json");
    if (!response.ok) {
      throw new Error(`Failed to load IDL: ${response.status} ${response.statusText}`);
    }
    const idl = await response.json();
    
    // Validate IDL structure
    if (!idl || typeof idl !== 'object') {
      throw new Error("Invalid IDL format: IDL is not an object");
    }
    
    if (!idl.address && !idl.metadata) {
      throw new Error("Invalid IDL format: Missing required fields");
    }
    
    // Don't transform the IDL - use it as-is from Anchor
    // The IDL should already be in the correct format
    console.log("✅ IDL loaded successfully:", idl.metadata?.name || "Unknown");
    cachedIdl = idl as Idl;
    return cachedIdl;
  } catch (error) {
    console.error("❌ Error loading IDL:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load UBI program IDL: ${errorMessage}. Please ensure the IDL file exists at /idl/ubi_smart_contract.json`);
  }
}

/**
 * Get Anchor Program instance
 */
// Cache for program instance
let cachedProgram: Program<Idl> | null = null;

export async function getUbiProgram(
  connection: Connection,
  wallet: Wallet
): Promise<Program<Idl>> {
  // Return cached program if available
  if (cachedProgram) {
    return cachedProgram;
  }

  try {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    const idl = await loadIdl();
    
    // Validate IDL before creating Program
    if (!idl) {
      throw new Error("IDL is null or undefined");
    }
    
    // Ensure IDL has required structure
    if (!idl.instructions || !Array.isArray(idl.instructions)) {
      throw new Error("IDL missing instructions array");
    }
    
    // Get program ID from IDL or use constant
    // @ts-expect-error - IDL may have address field
    const idlAddress = (idl as any).address;
    const programId = idlAddress ? new PublicKey(idlAddress) : UBI_PROGRAM_ID;
    
    // Create Program - we MUST ensure methods namespace is available
    // Anchor builds methods from instructions, so we need proper IDL structure
    const idlAny = idl as any;
    const idlForProgram: any = {
      version: idlAny.version || "0.1.0",
      name: idlAny.name || "ubi_smart_contract",
      instructions: idl.instructions || [],
      metadata: idlAny.metadata,
      address: idlAny.address || programId.toString(),
    };
    
    // Only add accounts if they exist and have proper structure
    // But methods should work without accounts
    if (idl.accounts && Array.isArray(idl.accounts) && idl.accounts.length > 0) {
      // Try with accounts first
      idlForProgram.accounts = idl.accounts;
    }
    
    try {
      // Create Program with IDL
      // @ts-expect-error - Program constructor with dynamic IDL
      const program = new Program(idlForProgram, programId, provider);
      
      // CRITICAL: Verify methods namespace exists before returning
      if (!program || !program.methods) {
        throw new Error("Program methods namespace is undefined. IDL structure may be invalid.");
      }
      
      // Verify we can access at least one method
      const methodNames = Object.keys(program.methods);
      if (methodNames.length === 0) {
        throw new Error("No methods found in Program. Instructions may be missing or invalid.");
      }
      
      console.log("✅ Program created successfully with methods:", methodNames);
      cachedProgram = program as Program<Idl>;
      return cachedProgram;
    } catch (programError: any) {
      console.error("❌ Program constructor failed:", programError);
      
      // If account-related error, try without accounts
      if (programError?.message?.includes('size') || 
          programError?.message?.includes('AccountClient') || 
          programError?.message?.includes('AccountNotInitialized')) {
        
        console.warn("⚠️ Trying without accounts array...");
        const idlWithoutAccounts = {
          version: idlForProgram.version,
          name: idlForProgram.name,
          instructions: idlForProgram.instructions,
          metadata: idlForProgram.metadata,
          address: idlForProgram.address,
        };
        
        try {
          // @ts-expect-error - Program constructor
          const program = new Program(idlWithoutAccounts, programId, provider);
          
          if (!program || !program.methods) {
            throw new Error("Methods namespace still not available without accounts");
          }
          
          console.log("✅ Program created with methods (without accounts)");
          cachedProgram = program as Program<Idl>;
          return cachedProgram;
        } catch (retryError: any) {
          console.error("❌ Retry also failed:", retryError);
          throw new Error(`Failed to create Program: ${programError?.message}. Retry error: ${retryError?.message}`);
        }
      } else {
        throw new Error(`Failed to create Program: ${programError?.message || String(programError)}`);
      }
    }
  } catch (error) {
    console.error("❌ Error creating Program:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create UBI Program: ${errorMessage}`);
  }
}

/**
 * Derive PDA addresses
 */
export function derivePDAAddresses(userWallet: PublicKey) {
  // UBI Program PDA
  const [ubiProgram] = PublicKey.findProgramAddressSync(
    [UBI_PROGRAM_SEED],
    UBI_PROGRAM_ID
  );

  // Treasury PDA
  const [treasury] = PublicKey.findProgramAddressSync(
    [UBI_PROGRAM_SEED, TREASURY_SEED],
    UBI_PROGRAM_ID
  );

  // User Registration PDA
  const [userRegistration] = PublicKey.findProgramAddressSync(
    [USER_REGISTRATION_SEED, userWallet.toBuffer()],
    UBI_PROGRAM_ID
  );

  return {
    ubiProgram,
    treasury,
    userRegistration,
  };
}

/**
 * Get user's Associated Token Account address
 */
export async function getUserTokenAccount(
  userWallet: PublicKey,
  mint: PublicKey = MINTYN_MINT
): Promise<PublicKey> {
  return await getAssociatedTokenAddress(mint, userWallet);
}

/**
 * Check if user is already registered
 */
export async function isUserRegistered(
  connection: Connection,
  wallet: Wallet | null, // Can be null since we don't need Program instance
  userWallet: PublicKey
): Promise<boolean> {
  try {
    const { userRegistration } = derivePDAAddresses(userWallet);
    
    // Try to fetch account data directly instead of using program.account
    const accountInfo = await connection.getAccountInfo(userRegistration);
    
    if (!accountInfo || !accountInfo.data) {
      return false;
    }
    
    // Manually deserialize the account data
    // UserRegistration structure: discriminator (8) + user (32) + registered_at (8) + has_received_ubi (1) + bump (1)
    // Discriminator for UserRegistration: [128, 102, 192, 182, 31, 20, 27, 194]
    const data = accountInfo.data;
    if (data.length < 50) {
      return false;
    }
    
    // Check discriminator (first 8 bytes)
    const expectedDiscriminator = [128, 102, 192, 182, 31, 20, 27, 194];
    const discriminator = Array.from(data.slice(0, 8));
    const isMatch = discriminator.every((byte, i) => byte === expectedDiscriminator[i]);
    
    if (!isMatch) {
      return false;
    }
    
    // Read has_received_ubi (byte at offset 48, after discriminator + user + registered_at)
    // Offset: 8 (discriminator) + 32 (user) + 8 (registered_at) = 48
    const hasReceivedUbi = data[48] === 1;
    
    return hasReceivedUbi;
  } catch (error) {
    console.error("Error checking registration:", error);
    // Account doesn't exist or error fetching
    return false;
  }
}

/**
 * Check if UBI program is initialized
 */
export async function isUbiProgramInitialized(
  connection: Connection
): Promise<boolean> {
  try {
    const [ubiProgram] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED],
      UBI_PROGRAM_ID
    );
    
    const accountInfo = await connection.getAccountInfo(ubiProgram);
    return accountInfo !== null && accountInfo.data.length > 0;
  } catch (error) {
    console.error("Error checking UBI program initialization:", error);
    return false;
  }
}

/**
 * Get UBI Program state
 */
export async function getUbiProgramState(
  connection: Connection,
  wallet: Wallet
): Promise<UbiProgramAccount | null> {
  try {
    const [ubiProgram] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED],
      UBI_PROGRAM_ID
    );
    
    // Fetch account data directly
    const accountInfo = await connection.getAccountInfo(ubiProgram);
    
    if (!accountInfo || !accountInfo.data) {
      return null;
    }
    
    // Manually deserialize UbiProgram account
    // Structure: discriminator (8) + authority (32) + mintyn_mint (32) + treasury (32) + ubi_amount (8) + total_registered (8) + bump (1)
    const data = accountInfo.data;
    if (data.length < 121) {
      return null;
    }
    
    // Check discriminator: [164, 8, 35, 71, 155, 83, 178, 143]
    const expectedDiscriminator = [164, 8, 35, 71, 155, 83, 178, 143];
    const discriminator = Array.from(data.slice(0, 8));
    const isMatch = discriminator.every((byte, i) => byte === expectedDiscriminator[i]);
    
    if (!isMatch) {
      return null;
    }
    
    // Deserialize fields
    const authority = new PublicKey(data.slice(8, 40));
    const mintynMint = new PublicKey(data.slice(40, 72));
    const treasury = new PublicKey(data.slice(72, 104));
    const ubiAmount = data.readBigUInt64LE(104);
    const totalRegistered = data.readBigUInt64LE(112);
    const bump = data[120];
    
    return {
      authority: authority.toString(),
      mintynMint: mintynMint.toString(),
      treasury: treasury.toString(),
      ubiAmount: Number(ubiAmount),
      totalRegistered: Number(totalRegistered),
      bump,
    } as UbiProgramAccount;
  } catch (error) {
    console.error("Error fetching UBI program state:", error);
    return null;
  }
}

/**
 * Get user registration info
 */
export async function getUserRegistrationInfo(
  connection: Connection,
  wallet: Wallet,
  userWallet: PublicKey
): Promise<UserRegistrationAccount | null> {
  try {
    const program = await getUbiProgram(connection, wallet);
    const { userRegistration } = derivePDAAddresses(userWallet);
    const registration = await (program.account as any).userRegistration.fetch(
      userRegistration
    );
    return registration as unknown as UserRegistrationAccount;
  } catch {
    return null;
  }
}

// ============================================================================
// ADMIN FUNCTION: Initialize UBI Program
// ============================================================================

/**
 * Initialize the UBI program (admin only)
 * This must be called once by the program authority before users can register
 * 
 * @param authorityAddress - Authority's wallet address (must be the program deployer)
 * @param phantomProvider - Phantom wallet provider
 * @returns Transaction signature
 */
export async function initializeUbiProgram(
  authorityAddress: string,
  phantomProvider: any
): Promise<string> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const authorityPublicKey = new PublicKey(authorityAddress);

    console.log("🚀 Starting UBI Program initialization...");
    console.log("Authority:", authorityAddress);
    console.log("Network:", NETWORK);
    console.log("Program ID:", UBI_PROGRAM_ID.toString());

    // Check if already initialized
    const isInitialized = await isUbiProgramInitialized(connection);
    if (isInitialized) {
      console.log("⚠️ UBI Program is already initialized!");
      throw new Error("UBI Program is already initialized on this network.");
    }

    // Verify wallet is connected
    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }

    // Verify connected wallet matches authority
    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== authorityAddress) {
      throw new Error(
        "Connected wallet doesn't match authority address. Please connect the correct wallet."
      );
    }

    // Derive PDA addresses
    const [ubiProgram, ubiProgramBump] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED],
      UBI_PROGRAM_ID
    );

    const [treasury, treasuryBump] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED, TREASURY_SEED],
      UBI_PROGRAM_ID
    );

    console.log("📋 PDA Addresses:");
    console.log("  UBI Program:", ubiProgram.toString(), "(bump:", ubiProgramBump, ")");
    console.log("  Treasury:", treasury.toString(), "(bump:", treasuryBump, ")");

    // Get authority's token account (optional - for funding treasury later)
    const authorityTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      authorityPublicKey
    );

    // Check if authority token account exists, create if needed
    let createAuthorityTokenAccountIx: TransactionInstruction | null = null;
    try {
      await getAccount(connection, authorityTokenAccount);
      console.log("✅ Authority token account exists");
    } catch {
      console.log("📝 Creating authority token account...");
      createAuthorityTokenAccountIx = createAssociatedTokenAccountInstruction(
        authorityPublicKey,
        authorityTokenAccount,
        authorityPublicKey,
        MINTYN_MINT
      );
    }

    // Load IDL
    const idl = await loadIdl();
    const initializeIx = idl.instructions?.find(
      (ix: any) => ix.name === "initialize"
    );

    if (!initializeIx) {
      throw new Error("initialize instruction not found in IDL");
    }

    // Get discriminator
    const discriminator = Buffer.from(initializeIx.discriminator);
    console.log("✅ Discriminator:", Array.from(discriminator));

    // Build accounts array in the EXACT order specified by IDL
    const accountMetas = initializeIx.accounts.map((acc: any) => {
      let pubkey: PublicKey;
      switch (acc.name) {
        case "authority":
          pubkey = authorityPublicKey;
          break;
        case "mintyn_mint":
          pubkey = MINTYN_MINT;
          break;
        case "authority_token_account":
          pubkey = authorityTokenAccount;
          break;
        case "ubi_program":
          pubkey = ubiProgram;
          break;
        case "treasury":
          pubkey = treasury;
          break;
        case "token_program":
          pubkey = TOKEN_PROGRAM_ID;
          break;
        case "system_program":
          pubkey = SystemProgram.programId;
          break;
        default:
          throw new Error(`Unknown account in IDL: ${acc.name}`);
      }

      return {
        pubkey,
        isSigner: acc.signer || false,
        isWritable: acc.writable || false,
      };
    });

    console.log("✅ Accounts prepared:", accountMetas.length, "accounts");

    // Build instruction
    const initializeInstruction = new TransactionInstruction({
      programId: UBI_PROGRAM_ID,
      keys: accountMetas,
      data: discriminator, // No args for initialize
    });

    // Create transaction
    const transaction = new Transaction();
    
    // Add authority token account creation if needed
    if (createAuthorityTokenAccountIx) {
      transaction.add(createAuthorityTokenAccountIx);
    }
    
    // Add initialize instruction
    transaction.add(initializeInstruction);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;

    console.log("📤 Signing and sending transaction...");

    // Sign and send transaction
    const signedTx = await phantomProvider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: true, // Skip preflight to avoid simulation errors
        maxRetries: 3,
      }
    );

    console.log("📝 Transaction sent, signature:", signature);
    console.log("⏳ Waiting for confirmation...");

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log("✅ UBI Program initialized successfully!");
    console.log("Transaction signature:", signature);
    console.log("View on Solana Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`);
    console.log("UBI Program PDA:", ubiProgram.toString());
    console.log("Treasury PDA:", treasury.toString());
    console.log(
      "View on Solana Explorer:",
      `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`
    );

    return signature;
  } catch (error: unknown) {
    console.error("❌ Error initializing UBI program:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle specific errors
    if (errorMessage.includes("already initialized") || errorMessage.includes("already in use")) {
      throw new Error("UBI Program is already initialized on this network.");
    }
    if (errorMessage.includes("insufficient funds") || errorMessage.includes("Insufficient")) {
      throw new Error("Insufficient SOL for transaction fees. Please add SOL to your wallet.");
    }
    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      throw new Error("Transaction was cancelled.");
    }
    
    throw new Error(`Failed to initialize UBI program: ${errorMessage}`);
  }
}

// ============================================================================
// MAIN FUNCTION: Register User and Get 20 Mintyn Tokens
// ============================================================================

/**
 * Register user and distribute 20 Mintyn tokens
 *
 * @param userWalletAddress - User's Phantom wallet address (from database)
 * @param phantomProvider - Phantom wallet provider (window.solana)
 * @returns Transaction signature
 */
export async function registerUserForUBI(
  userWalletAddress: string,
  // @ts-ignore - Phantom provider type
  phantomProvider: any
): Promise<string> {
  try {
    // 1. Setup connection and wallet
    const connection = new Connection(RPC_URL, "confirmed");
    const userPublicKey = new PublicKey(userWalletAddress);

    // Verify wallet is connected
    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }

    // Verify connected wallet matches
    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== userWalletAddress) {
      throw new Error(
        "Connected wallet doesn't match your account. Please connect the correct wallet."
      );
    }

    // Create wallet adapter from Phantom
    const wallet = {
      publicKey: userPublicKey,
      signTransaction: async (tx: Transaction) => {
        return await phantomProvider.signTransaction(tx);
      },
      signAllTransactions: async (txs: Transaction[]) => {
        return await phantomProvider.signAllTransactions(txs);
      },
    } as Wallet;

    // 2. Check if user is already registered (doesn't need Program instance)
    const alreadyRegistered = await isUserRegistered(
      connection,
      null, // Wallet not needed for manual account fetching
      userPublicKey
    );
    if (alreadyRegistered) {
      throw new Error("You have already received your UBI tokens!");
    }

    // 4. Derive all PDA addresses
    const { ubiProgram, treasury, userRegistration } =
      derivePDAAddresses(userPublicKey);

    // 5. Get user's token account address
    const userTokenAccount = await getUserTokenAccount(userPublicKey, MINTYN_MINT);

    // 6. Check if user's token account exists, create if needed
    let createTokenAccountIx: TransactionInstruction | null = null;
    try {
      await getAccount(connection, userTokenAccount);
    } catch {
      // Token account doesn't exist, create it
      createTokenAccountIx = createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        userTokenAccount, // token account
        userPublicKey, // owner
        MINTYN_MINT // mint
      );
    }

    // 7. Build the register_user instruction manually from IDL
    // This is more reliable than using Program.methods which may not be available
    console.log("📝 Building register_user instruction from IDL...");
    
    const idl = await loadIdl();
    const registerUserIx = idl.instructions?.find((ix: any) => ix.name === "register_user");
    
    if (!registerUserIx) {
      throw new Error("register_user instruction not found in IDL");
    }
    
    // Get discriminator (first 8 bytes - instruction identifier)
    const discriminator = Buffer.from(registerUserIx.discriminator);
    console.log("✅ Discriminator:", Array.from(discriminator));
    
    // Build accounts array in the EXACT order specified by IDL
    // This is critical - order must match the Rust struct
    const accountMetas = registerUserIx.accounts.map((acc: any) => {
      let pubkey: PublicKey;
      switch (acc.name) {
        case "user": 
          pubkey = userPublicKey; 
          break;
        case "ubi_program": 
          pubkey = ubiProgram; 
          break;
        case "mintyn_mint": 
          pubkey = MINTYN_MINT; 
          break;
        case "treasury": 
          pubkey = treasury; 
          break;
        case "user_registration": 
          pubkey = userRegistration; 
          break;
        case "user_token_account": 
          pubkey = userTokenAccount; 
          break;
        case "token_program": 
          pubkey = TOKEN_PROGRAM_ID; 
          break;
        case "system_program": 
          pubkey = SystemProgram.programId; 
          break;
        default: 
          throw new Error(`Unknown account in IDL: ${acc.name}`);
      }
      
      return {
        pubkey,
        isSigner: acc.signer || false,
        isWritable: acc.writable || false,
      };
    });
    
    console.log("✅ Accounts prepared:", accountMetas.length, "accounts");
    
    // Create the instruction
    // Note: For PDAs, Anchor handles bump derivation on-chain
    // We just need to provide the correct PDA addresses (which we derived correctly)
    const registerIx = new TransactionInstruction({
      programId: UBI_PROGRAM_ID,
      keys: accountMetas,
      data: discriminator, // Just the discriminator - no args for register_user
    });
    
    console.log("✅ Instruction built successfully");

    // 8. Create transaction
    const transaction = new Transaction();

    // Add token account creation if needed
    if (createTokenAccountIx) {
      transaction.add(createTokenAccountIx);
    }

    // Add register_user instruction
    transaction.add(registerIx);

    // 9. Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // 10. Sign and send transaction
    const signedTx = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3,
      }
    );

    // 11. Confirm transaction
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    console.log("✅ User registered successfully!");
    console.log("Transaction signature:", signature);
    console.log(
      "View on Solana Explorer:",
      `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`
    );

    return signature;
  } catch (error: unknown) {
    console.error("❌ Error registering user:", error);

    // Handle specific errors with detailed messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    // @ts-ignore - Error may have code property
    const errorCode = (error as any)?.code;
    // @ts-ignore - Anchor errors have logs
    const errorLogs = (error as any)?.logs || [];
    const logsString = Array.isArray(errorLogs) ? errorLogs.join("\n") : "";

    // Check for initialization error (Error Code 3012 = AccountNotInitialized)
    if (errorCode === 3012 || errorMessage?.includes("AccountNotInitialized") || errorMessage?.includes("not initialized") || logsString?.includes("AccountNotInitialized")) {
      throw new Error(
        "UBI program is not initialized on this network. The program needs to be initialized by the administrator before users can register. Please contact support or visit /test-ubi to initialize."
      );
    }

    if (errorMessage?.includes("already registered") || errorMessage?.includes("already received") || errorMessage?.includes("AlreadyRegistered")) {
      throw new Error("You have already received your UBI tokens!");
    }
    // Error code 6004 = InsufficientBalance (0x1774 in hex)
    if (errorCode === 6004 || errorMessage?.includes("insufficient") || errorMessage?.includes("InsufficientBalance") || logsString?.includes("InsufficientBalance") || logsString?.includes("0x1774")) {
      throw new Error(
        "Treasury has insufficient balance. The treasury needs to be funded with Mintyn tokens before users can claim UBI. Please contact the administrator to fund the treasury."
      );
    }
    if (errorMessage?.includes("User rejected") || errorMessage?.includes("cancelled") || errorMessage?.includes("user rejected")) {
      throw new Error("Transaction was cancelled.");
    }
    if (errorMessage?.includes("connect") || errorMessage?.includes("wallet")) {
      throw new Error("Please connect your Phantom wallet first.");
    }

    // Log full error for debugging
    console.error("Full error details:", {
      message: errorMessage,
      code: errorCode,
      logs: errorLogs,
      error: error,
    });

    // Return a user-friendly error message
    throw new Error(
      errorMessage || "Failed to register. Please try again or contact support."
    );
  }
}

