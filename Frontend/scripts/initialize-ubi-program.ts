/**
 * Script to initialize the UBI Program
 * 
 * Usage:
 * 1. Make sure you have the program authority wallet connected
 * 2. Run: npx ts-node scripts/initialize-ubi-program.ts
 * 
 * Or use the admin component in the frontend
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Constants
const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const RPC_URL = NETWORK === "devnet" 
  ? "https://api.devnet.solana.com"
  : "https://api.mainnet-beta.solana.com";

// PDA Seeds
const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
const TREASURY_SEED = Buffer.from("treasury");

async function initializeProgram() {
  try {
    console.log("🚀 Initializing UBI Program...");
    console.log("Network:", NETWORK);
    console.log("Program ID:", UBI_PROGRAM_ID.toString());
    
    // Load IDL
    const idlPath = path.join(process.cwd(), "public", "idl", "ubi_smart_contract.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    
    // Load authority keypair (you need to set this path)
    // For devnet, you can use: solana-keygen new --outfile ~/.config/solana/id.json
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
    
    // Create program instance
    const program = new Program(idl, UBI_PROGRAM_ID, provider);
    
    // Derive PDA addresses
    const [ubiProgram] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED],
      UBI_PROGRAM_ID
    );
    
    const [treasury] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED, TREASURY_SEED],
      UBI_PROGRAM_ID
    );
    
    console.log("UBI Program PDA:", ubiProgram.toString());
    console.log("Treasury PDA:", treasury.toString());
    
    // Get authority's token account
    const authorityTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      keypair.publicKey
    );
    
    // Check if already initialized
    try {
      const accountInfo = await connection.getAccountInfo(ubiProgram);
      if (accountInfo) {
        console.log("⚠️  UBI Program is already initialized!");
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
        authorityTokenAccount: authorityTokenAccount,
        ubiProgram: ubiProgram,
        treasury: treasury,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    
    console.log("✅ UBI Program initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log("View on Solana Explorer:", 
      `https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
    );
    
    // Verify initialization
    const ubiProgramAccount = await program.account.ubiProgram.fetch(ubiProgram);
    console.log("\n📊 UBI Program State:");
    console.log("  Authority:", ubiProgramAccount.authority.toString());
    console.log("  Mintyn Mint:", ubiProgramAccount.mintynMint.toString());
    console.log("  Treasury:", ubiProgramAccount.treasury.toString());
    console.log("  UBI Amount:", ubiProgramAccount.ubiAmount.toString());
    console.log("  Total Registered:", ubiProgramAccount.totalRegistered.toString());
    
    console.log("\n💡 Next Steps:");
    console.log("  1. Fund the treasury with Mintyn tokens");
    console.log("  2. Users can now register and claim UBI tokens");
    
  } catch (error: any) {
    console.error("❌ Error initializing UBI program:", error);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

// Run the initialization
initializeProgram();

