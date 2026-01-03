/**
 * Script to verify the Escrow Program is deployed and ready
 * 
 * Usage:
 * npx ts-node scripts/verify-escrow-program.ts
 */

import { Connection, PublicKey } from "@solana/web3.js";

// Constants
const ESCROW_PROGRAM_ID = new PublicKey("8acD4ZEnsvqq4iezDrfTBgGGqz1srjQTe816cVjmNnXt");
const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const RPC_URL = NETWORK === "devnet" 
  ? "https://api.devnet.solana.com"
  : "https://api.mainnet-beta.solana.com";

async function verifyEscrowProgram() {
  try {
    console.log("🔍 Verifying Escrow Program...");
    console.log("Network:", NETWORK);
    console.log("Program ID:", ESCROW_PROGRAM_ID.toString());
    console.log("RPC URL:", RPC_URL);
    
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Check if program account exists
    console.log("\n📋 Checking program account...");
    const programInfo = await connection.getAccountInfo(ESCROW_PROGRAM_ID);
    
    if (!programInfo) {
      console.error("❌ Escrow program not found!");
      console.error("   The program may not be deployed to", NETWORK);
      console.error("   Program ID:", ESCROW_PROGRAM_ID.toString());
      process.exit(1);
    }
    
    // Check if program is executable
    if (!programInfo.executable) {
      console.error("❌ Escrow program exists but is not executable!");
      process.exit(1);
    }
    
    console.log("✅ Escrow program is deployed and executable");
    console.log("\n📊 Program Details:");
    console.log("   Owner:", programInfo.owner.toString());
    console.log("   Executable:", programInfo.executable);
    console.log("   Data Length:", programInfo.data.length, "bytes");
    console.log("   Lamports:", programInfo.lamports / 1e9, "SOL");
    
    // Check program on explorer
    const explorerUrl = NETWORK === "devnet"
      ? `https://explorer.solana.com/address/${ESCROW_PROGRAM_ID.toString()}?cluster=devnet`
      : `https://explorer.solana.com/address/${ESCROW_PROGRAM_ID.toString()}`;
    
    console.log("\n🔗 View on Solana Explorer:");
    console.log("   ", explorerUrl);
    
    console.log("\n✅ Escrow program verification complete!");
    console.log("   The program is ready to use.");
    
  } catch (error: any) {
    console.error("❌ Error verifying escrow program:", error);
    if (error.message) {
      console.error("   ", error.message);
    }
    process.exit(1);
  }
}

// Run the verification
verifyEscrowProgram();

