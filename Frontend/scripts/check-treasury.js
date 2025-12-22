/**
 * Quick script to check treasury balance
 * 
 * Usage:
 *   node scripts/check-treasury.js
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { 
  TOKEN_PROGRAM_ID, 
  getAccount,
  getMint
} = require('@solana/spl-token');

// Configuration
const RPC_URL = "https://api.devnet.solana.com";
const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
const TREASURY_SEED = Buffer.from("treasury");

async function checkTreasury() {
  try {
    console.log("🔍 Checking Treasury Balance...\n");
    
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Derive treasury PDA
    const [treasury] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED, TREASURY_SEED],
      UBI_PROGRAM_ID
    );
    
    console.log("📋 Treasury Address:", treasury.toString());
    console.log("🔗 Explorer:", `https://explorer.solana.com/address/${treasury.toString()}?cluster=devnet\n`);
    
    // Get mint info
    const mintInfo = await getMint(connection, MINTYN_MINT);
    
    // Check treasury balance
    let treasuryBalance = 0;
    let treasuryAccount;
    
    try {
      treasuryAccount = await getAccount(connection, treasury);
      treasuryBalance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
      
      console.log("✅ Treasury Status: ACTIVE");
      console.log("💰 Balance:", treasuryBalance.toLocaleString(), "tokens");
      console.log("👥 Supported Users:", Math.floor(treasuryBalance / 20).toLocaleString());
      
      // Status indicator
      if (treasuryBalance < 100) {
        console.log("⚠️  Status: LOW - Fund immediately!");
      } else if (treasuryBalance < 1000) {
        console.log("⚠️  Status: MEDIUM - Consider funding");
      } else {
        console.log("✅ Status: HEALTHY");
      }
      
    } catch (error) {
      if (error.message.includes("could not find account")) {
        console.log("❌ Treasury Status: NOT INITIALIZED");
        console.log("   The treasury account doesn't exist yet.");
        console.log("   Initialize the UBI program first.");
      } else {
        throw error;
      }
    }
    
    console.log("\n" + "=".repeat(50));
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the check
checkTreasury();


