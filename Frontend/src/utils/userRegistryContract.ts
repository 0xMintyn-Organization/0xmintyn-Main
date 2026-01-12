import { Program, AnchorProvider, Wallet, Idl, BN, BorshInstructionCoder } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import type { UserRegistry as UserRegistryIdl } from "@/types/userRegistry";

// Program ID - Deployed to devnet
export const USER_REGISTRY_PROGRAM_ID = new PublicKey(
  "8JkYfa87oj1Ba11JDR2kTVqhWkxNSWDsfFesUESvabMK"
);

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

// PDA Seeds
const USER_REGISTRY_SEED = Buffer.from("user_registry");
const USER_ACCOUNT_SEED = Buffer.from("user_account");

/**
 * Get the User Registry PDA
 */
export function getUserRegistryAddress(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [USER_REGISTRY_SEED],
    USER_REGISTRY_PROGRAM_ID
  );
  return pda;
}

/**
 * Get the User Account PDA for a given wallet
 */
export function getUserAccountAddress(userWallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [USER_ACCOUNT_SEED, userWallet.toBuffer()],
    USER_REGISTRY_PROGRAM_ID
  );
  return pda;
}

/**
 * Load IDL dynamically (same pattern as UBI contract)
 */
let cachedIdl: Idl | null = null;

async function loadIdl(): Promise<Idl> {
  if (cachedIdl) {
    return cachedIdl;
  }

  try {
    // Load from public folder (same as UBI contract)
    console.log("📥 Loading IDL from /idl/user_registry.json...");
    const response = await fetch("/idl/user_registry.json");
    
    if (!response.ok) {
      console.error(`❌ IDL fetch failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load IDL: ${response.status} ${response.statusText}. Make sure the file exists at public/idl/user_registry.json`);
    }
    
    const idl = await response.json();
    console.log("✅ IDL JSON parsed successfully");
    
    // Validate IDL structure
    if (!idl || typeof idl !== 'object') {
      throw new Error("Invalid IDL format: IDL is not an object");
    }
    
    if (!idl.address && !idl.metadata) {
      console.error("❌ IDL missing required fields. IDL structure:", Object.keys(idl));
      throw new Error("Invalid IDL format: Missing required fields (address or metadata)");
    }
    
    // Validate instructions exist
    if (!idl.instructions || !Array.isArray(idl.instructions)) {
      console.error("❌ IDL missing instructions array");
      throw new Error("Invalid IDL format: Missing instructions array");
    }
    
    console.log(`✅ IDL loaded successfully: ${idl.metadata?.name || idl.name || "Unknown"} (${idl.instructions.length} instructions)`);
    cachedIdl = idl as Idl;
    return cachedIdl;
  } catch (error) {
    console.error("❌ Error loading IDL:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load User Registry program IDL: ${errorMessage}. Please ensure the IDL file exists at /idl/user_registry.json`);
  }
}

// Cache for program instance
let cachedProgram: Program<UserRegistryIdl> | null = null;

/**
 * Get the User Registry program instance
 * Uses the EXACT same pattern as UBI contract which works
 */
export async function getUserRegistryProgram(
  connection: Connection,
  wallet: Wallet
): Promise<Program<UserRegistryIdl>> {
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
    const programId = idlAddress ? new PublicKey(idlAddress) : USER_REGISTRY_PROGRAM_ID;
    
    // Create Program - we MUST ensure methods namespace is available
    // Anchor builds methods from instructions, so we need proper IDL structure
    const idlAny = idl as any;
    const idlForProgram: any = {
      version: idlAny.version || "0.1.0",
      name: idlAny.name || "user_registry",
      instructions: idl.instructions || [],
      metadata: idlAny.metadata,
      address: idlAny.address || programId.toString(),
      types: idlAny.types || [], // CRITICAL: Include types for instruction coder
      errors: idlAny.errors || [], // Include errors too
      spec: idlAny.spec || idlAny.metadata?.spec || "0.1.0", // Include spec for proper IDL structure
    };
    
    // Only add accounts if they exist and have proper structure
    // But methods should work without accounts
    // Remove 'type' from accounts to avoid size calculation errors, but keep accounts array for instruction coder
    if (idl.accounts && Array.isArray(idl.accounts) && idl.accounts.length > 0) {
      // Try with accounts but without type field (to avoid size errors)
      idlForProgram.accounts = idl.accounts.map((acc: any) => {
        const { type, ...accWithoutType } = acc;
        return accWithoutType; // Remove type to avoid size calculation
      });
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
      cachedProgram = program as Program<UserRegistryIdl>;
      return cachedProgram;
    } catch (programError: any) {
      console.error("❌ Program constructor failed:", programError);
      console.error("Error details:", {
        message: programError?.message,
        stack: programError?.stack,
        name: programError?.name,
      });
      
      // If account-related error, try without accounts
      if (programError?.message?.includes('size') || 
          programError?.message?.includes('AccountClient') || 
          programError?.message?.includes('AccountNotInitialized') ||
          programError?.message?.includes('undefined')) {
        
        console.warn("⚠️ Trying without accounts array...");
        const idlWithoutAccounts = {
          version: idlForProgram.version,
          name: idlForProgram.name,
          instructions: idlForProgram.instructions,
          metadata: idlForProgram.metadata,
          address: idlForProgram.address,
          types: idlAny.types || [], // CRITICAL: Include types for instruction coder
          errors: idlAny.errors || [], // Include errors too
          spec: idlAny.spec || idlAny.metadata?.spec || "0.1.0", // Include spec for proper IDL structure
        };
        
        try {
          // @ts-expect-error - Program constructor
          const program = new Program(idlWithoutAccounts, programId, provider);
          
          if (!program || !program.methods) {
            throw new Error("Methods namespace still not available without accounts");
          }
          
          const methodNames = Object.keys(program.methods);
          console.log(`✅ Program created with methods (without accounts): ${methodNames.join(", ")}`);
          
          // Note: Instruction coder might not be available, but methods should still work
          // The actual encoding will happen when we call .rpc(), and if it fails, we'll handle it
          cachedProgram = program as Program<UserRegistryIdl>;
          return cachedProgram;
        } catch (retryError: any) {
          console.error("❌ Retry also failed:", retryError);
          console.error("Retry error details:", {
            message: retryError?.message,
            stack: retryError?.stack,
          });
          throw new Error(`Failed to create Program: ${programError?.message}. Retry error: ${retryError?.message}`);
        }
      } else {
        throw new Error(`Failed to create Program: ${programError?.message || String(programError)}`);
      }
    }
  } catch (error) {
    console.error("❌ Error creating Program:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create User Registry Program: ${errorMessage}`);
  }
}

/**
 * Initialize the User Registry
 */
export async function initializeUserRegistry(
  connection: Connection,
  wallet: Wallet
): Promise<string> {
  const program = await getUserRegistryProgram(connection, wallet);
  const userRegistry = getUserRegistryAddress();

  const tx = await program.methods
    .initialize()
    .accounts({
      authority: wallet.publicKey,
      userRegistry: userRegistry,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

/**
 * Register a new user (using Phantom wallet)
 */
export async function registerUser(
  walletAddress: string,
  phantomProvider: any,
  platformUserId: string
): Promise<string> {
  const connection = new Connection(RPC_URL, "confirmed");
  const publicKey = new PublicKey(walletAddress);

  // Create a wallet adapter from Phantom
  const wallet = {
    publicKey: publicKey,
    signTransaction: async (tx: any) => {
      const signed = await phantomProvider.signTransaction(tx);
      return signed;
    },
    signAllTransactions: async (txs: any[]) => {
      const signed = await phantomProvider.signAllTransactions(txs);
      return signed;
    },
  };

  const program = await getUserRegistryProgram(connection, wallet as Wallet);
  const userRegistry = getUserRegistryAddress();
  const userAccount = getUserAccountAddress(publicKey);

  // Verify method exists
  if (!program.methods || !program.methods.registerUser) {
    const availableMethods = program.methods ? Object.keys(program.methods) : [];
    console.error("Available methods:", availableMethods);
    throw new Error(`registerUser method not found. Available methods: ${availableMethods.join(", ")}`);
  }

  try {
    const tx = await program.methods
      .registerUser(platformUserId)
      .accounts({
        user: publicKey,
        userRegistry: userRegistry,
        userAccount: userAccount,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  } catch (error: any) {
    // If instruction encoding fails, try manual encoding
    if (error?.message?.includes('encode') || error?.message?.includes('undefined')) {
      console.warn("⚠️ Program.methods failed, trying manual instruction encoding...");
      return await registerUserManual(
        connection,
        publicKey,
        wallet as Wallet,
        platformUserId,
        userRegistry,
        userAccount
      );
    }
    
    console.error("Error calling registerUser:", error);
    if (program.methods && program.methods.registerUser) {
      console.error("Method exists but call failed:", error.message);
    } else {
      console.error("Method not available in program.methods");
    }
    throw error;
  }
}


/**
 * Link a wallet to an existing platform user
 */
export async function linkWallet(
  connection: Connection,
  wallet: Wallet,
  platformUserId: string
): Promise<string> {
  const program = await getUserRegistryProgram(connection, wallet);
  const userRegistry = getUserRegistryAddress();
  const userAccount = getUserAccountAddress(wallet.publicKey);

  const tx = await program.methods
    .linkWallet(platformUserId)
    .accounts({
      user: wallet.publicKey,
      userRegistry: userRegistry,
      userAccount: userAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

/**
 * Manually encode and send registerUser instruction
 * Fallback when Program.methods fails - uses same pattern as UBI contract
 */
async function registerUserManual(
  connection: Connection,
  userPublicKey: PublicKey,
  wallet: Wallet,
  platformUserId: string,
  userRegistry: PublicKey,
  userAccount: PublicKey
): Promise<string> {
  try {
    console.log("📝 Building register_user instruction manually from IDL...");
    
    // Load IDL
    const idl = await loadIdl();
    const registerUserIx = (idl.instructions || []).find(
      (ix: any) => ix.name === "register_user"
    );

    if (!registerUserIx) {
      throw new Error("register_user instruction not found in IDL");
    }

    // Use Anchor's instruction coder to encode the instruction
    const instructionCoder = new BorshInstructionCoder(idl as Idl);
    
    // Encode the instruction with arguments
    const instructionData = instructionCoder.encode(
      "register_user",
      { platform_user_id: platformUserId }
    );

    if (!instructionData) {
      throw new Error("Failed to encode register_user instruction");
    }

    console.log("✅ Instruction encoded successfully");

    // Build accounts array in the EXACT order specified by IDL
    const accountMetas = registerUserIx.accounts.map((acc: any) => {
      let pubkey: PublicKey;
      switch (acc.name) {
        case "user":
          pubkey = userPublicKey;
          break;
        case "user_registry":
          pubkey = userRegistry;
          break;
        case "user_account":
          pubkey = userAccount;
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

    // Create instruction
    const instruction = new TransactionInstruction({
      programId: USER_REGISTRY_PROGRAM_ID,
      keys: accountMetas,
      data: instructionData,
    });

    // Create and send transaction
    const transaction = new Transaction();
    transaction.add(instruction);

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    console.log("📤 Signing and sending transaction...");

    // Sign transaction
    const signedTx = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3,
      }
    );

    console.log("📝 Transaction sent, signature:", signature);
    console.log("⏳ Waiting for confirmation...");

    // Confirm transaction
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    console.log("✅ Manual instruction encoding successful!");
    return signature;
  } catch (error: any) {
    console.error("❌ Manual instruction encoding failed:", error);
    throw new Error(`Failed to register user (manual encoding): ${error.message}`);
  }
}

/**
 * Helper function to convert byte array to string (null-terminated)
 */
function bytesToString(bytes: number[] | Uint8Array): string {
  const arr = Array.isArray(bytes) ? bytes : Array.from(bytes);
  const nullIndex = arr.indexOf(0);
  const actualBytes = nullIndex !== -1 ? arr.slice(0, nullIndex) : arr;
  return String.fromCharCode(...actualBytes);
}

/**
 * Get user account data
 */
export async function getUserAccount(
  connection: Connection,
  userWallet: PublicKey
): Promise<{
  userWallet: PublicKey;
  platformUserId: string;
  registeredAt: number;
  updatedAt: number;
} | null> {
  try {
    const userAccountAddress = getUserAccountAddress(userWallet);
    
    // Use manual account deserialization (more reliable than program.account)
    const accountInfo = await connection.getAccountInfo(userAccountAddress);
    if (!accountInfo || !accountInfo.data) {
      return null;
    }
    
    // UserAccount structure: discriminator (8) + user_wallet (32) + platform_user_id (64) + registered_at (8) + updated_at (8) + bump (1) = 121 bytes
    const data = accountInfo.data;
    if (data.length < 121) {
      return null;
    }
    
    // Check discriminator (first 8 bytes)
    const expectedDiscriminator = [211, 33, 136, 16, 186, 110, 242, 127];
    const discriminator = Array.from(data.slice(0, 8));
    const isMatch = discriminator.every((byte, i) => byte === expectedDiscriminator[i]);
    if (!isMatch) {
      return null;
    }
    
    // Deserialize: skip discriminator (8 bytes)
    let offset = 8;
    
    // user_wallet (32 bytes)
    const userWalletBytes = data.slice(offset, offset + 32);
    const userWalletPubkey = new PublicKey(userWalletBytes);
    offset += 32;
    
    // platform_user_id (64 bytes)
    const platformUserIdBytes = Array.from(data.slice(offset, offset + 64));
    const platformUserId = bytesToString(platformUserIdBytes);
    offset += 64;
    
    // registered_at (8 bytes, i64, little-endian)
    const registeredAtBytes = data.slice(offset, offset + 8);
    let registeredAt = 0n;
    for (let i = 0; i < 8; i++) {
      registeredAt |= BigInt(registeredAtBytes[i]) << BigInt(i * 8);
    }
    // Convert signed i64 (handle negative numbers)
    if (registeredAt > 0x7FFFFFFFFFFFFFFFn) {
      registeredAt = registeredAt - 0x10000000000000000n;
    }
    offset += 8;
    
    // updated_at (8 bytes, i64, little-endian)
    const updatedAtBytes = data.slice(offset, offset + 8);
    let updatedAt = 0n;
    for (let i = 0; i < 8; i++) {
      updatedAt |= BigInt(updatedAtBytes[i]) << BigInt(i * 8);
    }
    // Convert signed i64 (handle negative numbers)
    if (updatedAt > 0x7FFFFFFFFFFFFFFFn) {
      updatedAt = updatedAt - 0x10000000000000000n;
    }
    
    return {
      userWallet: userWalletPubkey,
      platformUserId,
      registeredAt: Number(registeredAt),
      updatedAt: Number(updatedAt),
    };
  } catch (error) {
    console.error("Error fetching user account:", error);
    return null;
  }
}

/**
 * Get user registry data
 */
export async function getUserRegistry(
  connection: Connection
): Promise<{
  authority: PublicKey;
  totalUsers: number;
} | null> {
  try {
    const userRegistryAddress = getUserRegistryAddress();
    
    // Use manual account deserialization (more reliable than program.account)
    const accountInfo = await connection.getAccountInfo(userRegistryAddress);
    if (!accountInfo || !accountInfo.data) {
      return null;
    }
    
    // UserRegistry structure: discriminator (8) + authority (32) + total_users (8) + bump (1) = 49 bytes
    const data = accountInfo.data;
    if (data.length < 49) {
      return null;
    }
    
    // Check discriminator (first 8 bytes)
    const expectedDiscriminator = [37, 84, 98, 14, 130, 63, 210, 138];
    const discriminator = Array.from(data.slice(0, 8));
    const isMatch = discriminator.every((byte, i) => byte === expectedDiscriminator[i]);
    if (!isMatch) {
      return null;
    }
    
    // Deserialize: skip discriminator (8 bytes)
    let offset = 8;
    
    // authority (32 bytes)
    const authorityBytes = data.slice(offset, offset + 32);
    const authority = new PublicKey(authorityBytes);
    offset += 32;
    
    // total_users (8 bytes, u64, little-endian)
    const totalUsersBytes = data.slice(offset, offset + 8);
    let totalUsers = 0n;
    for (let i = 0; i < 8; i++) {
      totalUsers |= BigInt(totalUsersBytes[i]) << BigInt(i * 8);
    }
    
    return {
      authority,
      totalUsers: Number(totalUsers),
    };
  } catch (error) {
    console.error("Error fetching user registry:", error);
    return null;
  }
}

/**
 * Check if a user is registered
 */
export async function isUserRegistered(
  userWalletAddress: string
): Promise<boolean> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const userWallet = new PublicKey(userWalletAddress);
    const account = await getUserAccount(connection, userWallet);
    return account !== null;
  } catch (error) {
    console.error("Error checking registration:", error);
    return false;
  }
}
