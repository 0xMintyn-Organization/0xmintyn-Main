/**
 * Automated Treasury Funding Script
 * Run this script to automatically fund the treasury
 * 
 * Usage:
 *   node scripts/auto-fund-treasury.js [amount]
 * 
 * Examples:
 *   node scripts/auto-fund-treasury.js 1000000  (fund 1M tokens)
 *   node scripts/auto-fund-treasury.js          (uses default: 1M)
 */

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

// Configuration
const RPC_URL = "https://api.devnet.solana.com";
const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
const TREASURY_SEED = Buffer.from("treasury");

// Get amount from command line or use default
const AMOUNT_IN_TOKENS = process.argv[2] ? parseFloat(process.argv[2]) : 1_000_000;

async function autoFundTreasury() {
  try {
    console.log("🤖 Automated Treasury Funding Script");
    console.log("=====================================");
    console.log("Target Amount:", AMOUNT_IN_TOKENS.toLocaleString(), "tokens");
    
    const connection = new Connection(RPC_URL, "confirmed");
    
    // Derive treasury PDA
    const [treasury] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED, TREASURY_SEED],
      UBI_PROGRAM_ID
    );
    
    console.log("📋 Treasury Address:", treasury.toString());
    
    // Load keypair
    // Try multiple possible locations - PRIORITIZE mint authority wallet
    const possiblePaths = [
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'my-mintyn-wallet.json'),
      path.join(__dirname, '..', '..', '..', '0xmintyn_Blockchain_Development', 'MintynToken', 'mintyn-token', 'wallet.json'),
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'id.json'),
    ];
    
    let keypair;
    let keypairPath;
    
    for (const kpPath of possiblePaths) {
      if (fs.existsSync(kpPath)) {
        keypairPath = kpPath;
        const secretKey = JSON.parse(fs.readFileSync(kpPath, 'utf-8'));
        keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
        console.log("✅ Loaded keypair from:", kpPath);
        break;
      }
    }
    
    if (!keypair) {
      throw new Error(`Keypair not found. Tried: ${possiblePaths.join(', ')}`);
    }
    
    const authorityPublicKey = keypair.publicKey;
    console.log("📝 Authority Address:", authorityPublicKey.toString());
    
    // Get authority's token account
    const authorityTokenAccount = await getAssociatedTokenAddress(
      MINTYN_MINT,
      authorityPublicKey
    );
    
    console.log("🔍 Checking token account:", authorityTokenAccount.toString());
    
    // Check authority balance
    let authorityAccount;
    try {
      authorityAccount = await getAccount(connection, authorityTokenAccount);
    } catch (error) {
      throw new Error(
        `Token account not found or error: ${error.message}. ` +
        `Make sure the wallet has a Mintyn token account. ` +
        `Expected mint authority: Wo8BUGvvituc1v6Ns1M5dERyDZiFQYuy85wqu1F9S1v`
      );
    }
    
    const mintInfo = await getMint(connection, MINTYN_MINT);
    const authorityBalance = Number(authorityAccount.amount) / Math.pow(10, mintInfo.decimals);
    
    console.log("💰 Your Balance:", authorityBalance.toLocaleString(), "tokens");
    
    // Warn if using wrong wallet
    const EXPECTED_MINT_AUTHORITY = "Wo8BUGvvituc1v6Ns1M5dERyDZiFQYuy85wqu1F9S1v";
    if (authorityPublicKey.toString() !== EXPECTED_MINT_AUTHORITY) {
      console.warn("⚠️  WARNING: You're not using the mint authority wallet!");
      console.warn("   Current wallet:", authorityPublicKey.toString());
      console.warn("   Expected wallet:", EXPECTED_MINT_AUTHORITY);
      console.warn("   Make sure to use: ~/.config/solana/my-mintyn-wallet.json");
    }
    
    if (authorityBalance < AMOUNT_IN_TOKENS) {
      throw new Error(
        `Insufficient balance. You have ${authorityBalance.toLocaleString()} tokens, need ${AMOUNT_IN_TOKENS.toLocaleString()}`
      );
    }
    
    // Check current treasury balance
    let treasuryBalanceBefore = 0;
    try {
      const treasuryAccount = await getAccount(connection, treasury);
      treasuryBalanceBefore = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
      console.log("🏦 Treasury Current Balance:", treasuryBalanceBefore.toLocaleString(), "tokens");
    } catch {
      console.log("🏦 Treasury Balance: 0 tokens");
    }
    
    // Calculate transfer amount
    const transferAmount = BigInt(Math.floor(AMOUNT_IN_TOKENS * Math.pow(10, mintInfo.decimals)));
    
    console.log("\n📤 Creating transfer...");
    console.log("From:", authorityTokenAccount.toString());
    console.log("To:", treasury.toString());
    console.log("Amount:", AMOUNT_IN_TOKENS.toLocaleString(), "tokens");
    
    // Create transfer instruction
    const transferIx = createTransferInstruction(
      authorityTokenAccount,
      treasury,
      authorityPublicKey,
      transferAmount,
      [],
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
    
    // Confirm
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed");
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    // Verify
    const treasuryAccount = await getAccount(connection, treasury);
    const treasuryBalanceAfter = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);
    const transferred = treasuryBalanceAfter - treasuryBalanceBefore;
    
    console.log("\n✅ SUCCESS!");
    console.log("=====================================");
    console.log("Transferred:", transferred.toLocaleString(), "tokens");
    console.log("Treasury Balance:", treasuryBalanceAfter.toLocaleString(), "tokens");
    console.log("Can Support:", Math.floor(treasuryBalanceAfter / 20).toLocaleString(), "users");
    console.log("🔗 Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    console.error("\n💡 Tip: Make sure you're using the mint authority wallet");
    console.error("   Expected wallet: ~/.config/solana/my-mintyn-wallet.json");
    console.error("   Mint Authority: Wo8BUGvvituc1v6Ns1M5dERyDZiFQYuy85wqu1F9S1v");
    process.exit(1);
  }
}

// Run the script
autoFundTreasury();

