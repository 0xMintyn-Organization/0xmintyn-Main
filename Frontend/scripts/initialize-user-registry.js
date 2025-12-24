/**
 * Initialize User Registry Contract on Devnet
 * Run this script once to initialize the contract
 * 
 * Usage:
 *   npm run admin:initialize-user-registry
 */

const { Connection, PublicKey, Keypair, SystemProgram } = require("@solana/web3.js");
const { Program, AnchorProvider, Wallet, BN } = require("@coral-xyz/anchor");
const { readFileSync } = require("fs");
const { join, resolve } = require("path");

// Load IDL - resolve path relative to script location
const scriptDir = __dirname;
const idlPath = resolve(scriptDir, "../src/idl/user_registry.json");
let idlData;
try {
  const idlContent = readFileSync(idlPath, "utf-8");
  idlData = JSON.parse(idlContent);
  
  // Ensure IDL structure is complete
  if (!idlData.instructions || !Array.isArray(idlData.instructions)) {
    throw new Error("IDL missing instructions array");
  }
  if (!idlData.accounts || !Array.isArray(idlData.accounts)) {
    throw new Error("IDL missing accounts array");
  }
  if (!idlData.types || !Array.isArray(idlData.types)) {
    throw new Error("IDL missing types array");
  }
  
  console.log("✅ IDL loaded from:", idlPath);
  console.log("   Instructions:", idlData.instructions.length);
  console.log("   Accounts:", idlData.accounts.length);
  console.log("   Types:", idlData.types.length);
} catch (error) {
  console.error("❌ Failed to load IDL:", error.message);
  process.exit(1);
}

// Configuration
const RPC_URL = "https://api.devnet.solana.com";
const USER_REGISTRY_PROGRAM_ID = new PublicKey(
  "8JkYfa87oj1Ba11JDR2kTVqhWkxNSWDsfFesUESvabMK"
);
const USER_REGISTRY_SEED = Buffer.from("user_registry");

// Load wallet keypair
function loadWallet() {
  const possiblePaths = [
    join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'my-mintyn-wallet.json'),
    join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'id.json'),
  ];

  for (const walletPath of possiblePaths) {
    try {
      const keypairData = JSON.parse(readFileSync(walletPath, 'utf-8'));
      return Keypair.fromSecretKey(Uint8Array.from(keypairData));
    } catch (error) {
      // Try next path
      continue;
    }
  }

  throw new Error(
    `Could not find wallet file. Tried: ${possiblePaths.join(', ')}\n` +
    `Please ensure your wallet keypair is in one of these locations.`
  );
}

async function initializeUserRegistry() {
  try {
    console.log("🚀 Initializing User Registry Contract on Devnet...\n");

    // Load wallet
    const keypair = loadWallet();
    const wallet = new Wallet(keypair);
    console.log("✅ Wallet loaded:", wallet.publicKey.toString());

    // Connect to devnet
    const connection = new Connection(RPC_URL, "confirmed");
    console.log("✅ Connected to devnet");

    // Check balance
    const balance = await connection.getBalance(wallet.publicKey);
    const solBalance = balance / 1e9;
    console.log(`💰 Wallet balance: ${solBalance.toFixed(4)} SOL`);

    if (solBalance < 0.1) {
      console.log("\n⚠️  Warning: Low balance. You may need SOL for transaction fees.");
      console.log("   Request airdrop: solana airdrop 2 <your-wallet-address> --url devnet");
    }

    // Create program instance
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    
    // Verify IDL structure
    if (!idlData || !idlData.instructions) {
      throw new Error("Invalid IDL structure. Missing instructions.");
    }
    
    console.log("📋 Creating program instance...");
    
    // Use the IDL directly from the contract build directory (more reliable)
    const contractIdlPath = resolve(scriptDir, "../../../0xmintyn_Blockchain_Development/Smart_Contract/user-registry/target/idl/user_registry.json");
    let contractIdl;
    try {
      contractIdl = JSON.parse(readFileSync(contractIdlPath, "utf-8"));
      console.log("✅ Using IDL from contract build directory");
      console.log("   Path:", contractIdlPath);
    } catch (error) {
      // Fallback to frontend IDL
      contractIdl = idlData;
      console.log("✅ Using IDL from frontend directory");
      console.log("   (Contract IDL not found at:", contractIdlPath + ")");
    }
    
    let program;
    try {
      program = new Program(contractIdl, USER_REGISTRY_PROGRAM_ID, provider);
      console.log("✅ Program instance created");
    } catch (error) {
      console.error("\n❌ Failed to create program instance");
      console.error("Error:", error.message);
      console.error("\n💡 This might be an Anchor version compatibility issue.");
      console.error("   Try using the contract's IDL directly from:");
      console.error("   ", contractIdlPath);
      throw error;
    }

    // Find User Registry PDA
    const [userRegistryPda] = PublicKey.findProgramAddressSync(
      [USER_REGISTRY_SEED],
      USER_REGISTRY_PROGRAM_ID
    );
    console.log("📍 User Registry PDA:", userRegistryPda.toString());

    // Check if already initialized
    try {
      const existingRegistry = await program.account.userRegistry.fetch(userRegistryPda);
      console.log("\n⚠️  Contract is already initialized!");
      console.log("   Authority:", existingRegistry.authority.toString());
      console.log("   Total Users:", existingRegistry.totalUsers.toString());
      console.log("\n✅ No action needed. Contract is ready to use!");
      return;
    } catch (error) {
      // Not initialized yet, proceed
      console.log("📝 Contract not initialized, proceeding...\n");
    }

    // Initialize
    console.log("📤 Sending initialize transaction...");
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: wallet.publicKey,
        userRegistry: userRegistryPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Transaction sent:", tx);
    console.log("⏳ Confirming transaction...");

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");
    console.log("✅ Transaction confirmed!");

    // Verify initialization
    const userRegistry = await program.account.userRegistry.fetch(userRegistryPda);
    console.log("\n🎉 User Registry initialized successfully!");
    console.log("   Authority:", userRegistry.authority.toString());
    console.log("   Total Users:", userRegistry.totalUsers.toString());
    console.log("\n✅ Contract is now ready for user registrations!");
    console.log("\n📋 Next steps:");
    console.log("   1. Test registration via frontend (/myprofile)");
    console.log("   2. Connect Phantom wallet (devnet)");
    console.log("   3. Click 'Register on Blockchain'");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.logs) {
      console.error("\nTransaction logs:");
      error.logs.forEach((log) => console.error("  ", log));
    }
    process.exit(1);
  }
}

// Manual initialization function (fallback)
async function initializeManually(connection, wallet, userRegistryPda) {
  const { Transaction } = require("@solana/web3.js");
  const { BorshAccountsCoder } = require("@coral-xyz/anchor/dist/cjs/coder/accounts");
  
  console.log("📤 Building initialize transaction manually...");
  
  // Check if already initialized
  try {
    const accountInfo = await connection.getAccountInfo(userRegistryPda);
    if (accountInfo) {
      console.log("⚠️  Contract is already initialized!");
      return;
    }
  } catch (error) {
    // Account doesn't exist, proceed
  }
  
  // Build the instruction manually
  // Initialize instruction discriminator: [175, 175, 109, 31, 13, 152, 155, 237]
  const initializeDiscriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
  
  // Create accounts array
  const accounts = [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: userRegistryPda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  
  // Calculate space needed for UserRegistry account
  // 8 (discriminator) + 32 (authority) + 8 (total_users) + 1 (bump) = 49
  const space = 49;
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  
  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: userRegistryPda,
      space: space,
      lamports: lamports,
      programId: USER_REGISTRY_PROGRAM_ID,
    })
  );
  
  // This is complex - let's use Anchor's method instead
  // For now, let's suggest using anchor CLI
  throw new Error(
    "Manual initialization is complex. Please use:\n" +
    "  cd 0xmintyn_Blockchain_Development/Smart_Contract/user-registry\n" +
    "  anchor test --skip-local-validator --provider.cluster devnet\n" +
    "  (The initialize test will run and initialize the contract)"
  );
}

// Run initialization
initializeUserRegistry();

