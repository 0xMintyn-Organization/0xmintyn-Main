/**
 * Simple Governance Initialization Script (JavaScript version)
 * This version avoids TypeScript/IDL type issues by using a simpler approach
 */

const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require("@solana/web3.js");
const { AnchorProvider, Program, Wallet, BN } = require("@coral-xyz/anchor");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { readFileSync } = require("fs");
const { join, resolve } = require("path");

// Constants
const GOVERNANCE_PROGRAM_ID = new PublicKey("4gzdxgRx6423EPk4xqHTVYtT2jkbuquB7L6pgUq87iYG");
const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const RPC_URL = NETWORK === "devnet" 
  ? "https://api.devnet.solana.com"
  : "https://api.mainnet-beta.solana.com";

// PDA Seeds
const GOVERNANCE_SEED = Buffer.from("governance");
const TREASURY_SEED = Buffer.from("treasury");

async function initializeProgram() {
  try {
    console.log("🚀 Initializing Governance Program...");
    console.log("Network:", NETWORK);
    console.log("Program ID:", GOVERNANCE_PROGRAM_ID.toString());
    
    // Load IDL
    const scriptDir = __dirname;
    const contractIdlPath = resolve(scriptDir, "../../../0xmintyn_Blockchain_Development/Smart_Contract/governance/target/idl/governance.json");
    const frontendIdlPath = resolve(scriptDir, "../public/idl/governance.json");
    
    let idl;
    if (require("fs").existsSync(contractIdlPath)) {
      idl = JSON.parse(readFileSync(contractIdlPath, "utf-8"));
      console.log("✅ Using IDL from contract build directory");
    } else if (require("fs").existsSync(frontendIdlPath)) {
      idl = JSON.parse(readFileSync(frontendIdlPath, "utf-8"));
      console.log("✅ Using IDL from frontend public directory");
    } else {
      throw new Error(
        `IDL file not found. Tried:\n` +
        `  - ${contractIdlPath}\n` +
        `  - ${frontendIdlPath}\n` +
        `Please rebuild the contract: cd 0xmintyn_Blockchain_Development/Smart_Contract/governance && anchor build`
      );
    }
    
    // Load authority keypair
    const keypairPath = process.env.SOLANA_KEYPAIR_PATH || 
      join(process.env.HOME || process.env.USERPROFILE || "", ".config", "solana", "id.json");
    
    if (!require("fs").existsSync(keypairPath)) {
      throw new Error(`Keypair file not found at: ${keypairPath}\nPlease set SOLANA_KEYPAIR_PATH or use the default location.`);
    }
    
    const keypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync(keypairPath, "utf-8")))
    );
    
    console.log("Authority:", keypair.publicKey.toString());
    
    // Setup connection and provider
    const connection = new Connection(RPC_URL, "confirmed");
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    
    // Create program instance
    const program = new Program(idl, GOVERNANCE_PROGRAM_ID, provider);
    
    // Derive PDA addresses
    const [governance] = PublicKey.findProgramAddressSync(
      [GOVERNANCE_SEED],
      GOVERNANCE_PROGRAM_ID
    );
    
    const [treasury] = PublicKey.findProgramAddressSync(
      [GOVERNANCE_SEED, TREASURY_SEED],
      GOVERNANCE_PROGRAM_ID
    );
    
    console.log("Governance PDA:", governance.toString());
    console.log("Treasury PDA:", treasury.toString());
    
    // Check if already initialized
    try {
      const accountInfo = await connection.getAccountInfo(governance);
      if (accountInfo) {
        console.log("⚠️  Governance Program is already initialized!");
        console.log("  Governance PDA:", governance.toString());
        return;
      }
    } catch (error) {
      // Account doesn't exist, proceed with initialization
    }
    
    // Initialize the program
    console.log("\n📝 Sending initialize transaction...");
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: keypair.publicKey,
        mintynMint: MINTYN_MINT,
        governance: governance,
        treasury: treasury,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    
    console.log("✅ Governance Program initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log("View on Solana Explorer:", 
      `https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
    );
    
    console.log("\n💡 Next Steps:");
    console.log("  1. Fund the treasury with Mintyn tokens for proposal rewards");
    console.log("  2. Users can now create proposals (requires 5+ Mintyn tokens)");
    console.log("  3. Users can vote on proposals (free)");
    console.log("  4. Admin can accept proposals (sends 100 tokens to creator)");
    
  } catch (error) {
    console.error("❌ Error initializing Governance program:", error.message);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

// Run the initialization
initializeProgram();

