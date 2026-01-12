/**
 * Script to initialize the Governance Program
 * 
 * Usage:
 * 1. Make sure you have the program authority wallet connected
 * 2. Run: npm run admin:initialize-governance
 * 
 * Or use the admin component in the frontend
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

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
    
    // Load IDL - prefer contract build directory (original Anchor-generated), fallback to frontend
    const contractIdlPath = path.join(
      process.cwd(), 
      "..", 
      "..", 
      "0xmintyn_Blockchain_Development", 
      "Smart_Contract", 
      "governance", 
      "target", 
      "idl", 
      "governance.json"
    );
    const frontendIdlPath = path.join(process.cwd(), "public", "idl", "governance.json");
    
    let idl;
    if (fs.existsSync(contractIdlPath)) {
      idl = JSON.parse(fs.readFileSync(contractIdlPath, "utf-8"));
      console.log("✅ Using IDL from contract build directory");
    } else if (fs.existsSync(frontendIdlPath)) {
      idl = JSON.parse(fs.readFileSync(frontendIdlPath, "utf-8"));
      console.log("✅ Using IDL from frontend public directory");
    } else {
      throw new Error(
        `IDL file not found. Tried:\n` +
        `  - ${contractIdlPath}\n` +
        `  - ${frontendIdlPath}\n` +
        `Please ensure the IDL exists in one of these locations`
      );
    }
    
    // Load authority keypair
    const keypairPath = process.env.SOLANA_KEYPAIR_PATH || 
      path.join(process.env.HOME || process.env.USERPROFILE || "", ".config", "solana", "id.json");
    
    if (!fs.existsSync(keypairPath)) {
      throw new Error(`Keypair file not found at: ${keypairPath}\nPlease set SOLANA_KEYPAIR_PATH or use the default location.`);
    }
    
    const keypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
    );
    
    console.log("Authority:", keypair.publicKey.toString());
    
    // Setup connection and provider
    const connection = new Connection(RPC_URL, "confirmed");
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    
    // Create program instance with error handling
    let program;
    try {
      // @ts-ignore - TypeScript has issues with IDL type inference
      program = new Program(idl, GOVERNANCE_PROGRAM_ID, provider);
    } catch (programError: any) {
      console.error("⚠️  Error creating Program instance:", programError.message);
      console.log("💡 Trying to rebuild IDL or use anchor CLI directly...");
      throw new Error(
        "Failed to create Program instance. This might be due to IDL structure issues.\n" +
        "Try rebuilding the contract: cd 0xmintyn_Blockchain_Development/Smart_Contract/governance && anchor build\n" +
        "Or use anchor test to initialize the program."
      );
    }
    
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
        console.log("  Account exists, skipping initialization.");
        console.log("  (To view account details, use Solana Explorer)");
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
    
    // Verify initialization - wait a bit for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to fetch account, but don't fail if it doesn't work
    try {
      const governanceAccount = await (program.account as any).governance.fetch(governance);
      console.log("\n📊 Governance Program State:");
      console.log("  Authority:", governanceAccount.authority.toString());
      console.log("  Mintyn Mint:", governanceAccount.mintynMint.toString());
      console.log("  Treasury:", governanceAccount.treasury.toString());
      console.log("  Proposal Reward:", governanceAccount.proposalReward.toString(), "(100 tokens)");
      console.log("  Min Proposal Tokens:", governanceAccount.minProposalTokens.toString(), "(5 tokens)");
      console.log("  Total Proposals:", governanceAccount.totalProposals.toString());
    } catch (fetchError) {
      console.log("\n✅ Initialization transaction confirmed!");
      console.log("  (Account fetch failed, but transaction was successful)");
      console.log("  View account on Solana Explorer:", 
        `https://explorer.solana.com/address/${governance.toString()}?cluster=${NETWORK}`
      );
    }
    
    console.log("\n💡 Next Steps:");
    console.log("  1. Fund the treasury with Mintyn tokens for proposal rewards");
    console.log("  2. Users can now create proposals (requires 5+ Mintyn tokens)");
    console.log("  3. Users can vote on proposals (free)");
    console.log("  4. Admin can accept proposals (sends 100 tokens to creator)");
    
  } catch (error: any) {
    console.error("❌ Error initializing Governance program:", error);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

// Run the initialization
initializeProgram();

