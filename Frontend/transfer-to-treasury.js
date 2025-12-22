// Script to transfer 1 million Mintyn tokens to Treasury
// Run this in Node.js or browser console

const { Connection, PublicKey, Transaction, Keypair } = require('@solana/web3.js');
const { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  getAccount,
  createTransferInstruction,
  getMint
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Constants
const RPC_URL = "https://api.devnet.solana.com";
const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
const TREASURY_SEED = Buffer.from("treasury");

// Amount: 1 million tokens = 1,000,000 * 10^9 = 1,000,000,000,000,000
const TRANSFER_AMOUNT = 1_000_000_000_000_000; // 1 million tokens with 9 decimals

async function transferToTreasury() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Derive treasury PDA
    const [treasury] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED, TREASURY_SEED],
      UBI_PROGRAM_ID
    );
    
    console.log("📋 Treasury PDA Address:", treasury.toString());
    
    // Load your wallet keypair (mint authority)
    // Option 1: From Solana CLI default location
    const keypairPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'id.json');
    
    let keypair;
    if (fs.existsSync(keypairPath)) {
      const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
      keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      console.log("✅ Loaded keypair from:", keypairPath);
    } else {
      throw new Error(`Keypair not found at ${keypairPath}. Please provide your keypair path.`);
    }
    
    const authorityPublicKey = keypair.publicKey;
    console.log("📝 Authority Address:", authorityPublicKey.toString());
    
    // Get authority's token account
    const authorityTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      authorityPublicKey
    );
    
    console.log("📝 Authority Token Account:", authorityTokenAccount.toString());
    
    // Check authority balance
    try {
      const authorityAccount = await getAccount(connection, authorityTokenAccount);
      const mintInfo = await getMint(connection, MINTYN_MINT);
      const balance = Number(authorityAccount.amount) / Math.pow(10, mintInfo.decimals);
      
      console.log("💰 Your Balance:", balance.toLocaleString(), "tokens");
      
      if (balance < 1_000_000) {
        throw new Error(`Insufficient balance. You have ${balance.toLocaleString()} tokens, need 1,000,000`);
      }
    } catch (e) {
      if (e.message.includes("Insufficient balance")) {
        throw e;
      }
      throw new Error("Failed to check balance. Make sure you have a Mintyn token account.");
    }
    
    // Check treasury current balance
    try {
      const treasuryAccount = await getAccount(connection, treasury);
      const mintInfo = await getMint(connection, MINTYN_MINT);
      const treasuryBalance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
      console.log("🏦 Treasury Current Balance:", treasuryBalance.toLocaleString(), "tokens");
    } catch {
      console.log("🏦 Treasury Balance: 0 tokens (account may not exist yet)");
    }
    
    // Create transfer instruction
    console.log("\n📤 Creating transfer instruction...");
    const transferIx = createTransferInstruction(
      authorityTokenAccount, // from
      treasury, // to
      authorityPublicKey, // authority
      TRANSFER_AMOUNT, // amount: 1 million tokens
      [], // multiSigners
      TOKEN_PROGRAM_ID
    );
    
    // Build transaction
    const transaction = new Transaction().add(transferIx);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;
    
    // Sign transaction
    transaction.sign(keypair);
    
    console.log("📡 Sending transaction...");
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    
    console.log("📝 Transaction Signature:", signature);
    console.log("⏳ Waiting for confirmation...");
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed");
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    // Verify treasury balance
    const treasuryAccount = await getAccount(connection, treasury);
    const mintInfo = await getMint(connection, MINTYN_MINT);
    const treasuryBalance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
    
    console.log("\n✅ SUCCESS!");
    console.log("🏦 Treasury New Balance:", treasuryBalance.toLocaleString(), "tokens");
    console.log("👥 Can support:", Math.floor(treasuryBalance / 20).toLocaleString(), "users");
    console.log("🔗 View on Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

transferToTreasury();


