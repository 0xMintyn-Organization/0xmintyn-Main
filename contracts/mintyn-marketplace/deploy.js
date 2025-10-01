const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const MARKETPLACE_FEE_BPS = 250; // 2.5%

async function main() {
  console.log('🚀 Starting Marketplace Program Deployment...\n');
  
  // Setup connection and provider
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load admin keypair
  let adminKeypair;
  try {
    const keypairPath = process.env.ADMIN_KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    console.log('✅ Admin keypair loaded:', adminKeypair.publicKey.toString());
  } catch (error) {
    console.error('❌ Error loading admin keypair:', error.message);
    process.exit(1);
  }

  // Setup Anchor
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed'
  });
  anchor.setProvider(provider);

  // Load program
  let program;
  try {
    const idlPath = path.join(__dirname, 'anchor/target/idl/marketplace.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const programId = new PublicKey(idl.address);
    program = new anchor.Program(idl, programId, provider);
    console.log('✅ Program loaded:', programId.toString());
  } catch (error) {
    console.error('❌ Error loading program:', error.message);
    console.log('Please ensure the program is built: anchor build');
    process.exit(1);
  }

  try {
    // Check admin balance
    const adminBalance = await connection.getBalance(adminKeypair.publicKey);
    console.log(`💰 Admin SOL balance: ${adminBalance / LAMPORTS_PER_SOL} SOL`);

    // Derive PDAs
    const [marketplacePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      program.programId
    );

    console.log('\n📍 Program Addresses:');
    console.log('Marketplace PDA:', marketplacePda.toString());

    // Check if program is already initialized
    let isInitialized = false;
    try {
      await program.account.marketplace.fetch(marketplacePda);
      isInitialized = true;
      console.log('✅ Marketplace already initialized');
    } catch (error) {
      console.log('📝 Marketplace not initialized, proceeding with initialization...');
    }

    // Initialize marketplace if not already done
    if (!isInitialized) {
      console.log('\n🔧 Initializing Marketplace...');
      
      const tx = await program.methods
        .initializeMarketplace(
          adminKeypair.publicKey,
          adminKeypair.publicKey, // treasury
          MARKETPLACE_FEE_BPS
        )
        .accounts({
          admin: adminKeypair.publicKey,
          marketplace: marketplacePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      console.log('✅ Marketplace initialized! Transaction:', tx);
      await connection.confirmTransaction(tx, 'confirmed');
      console.log('✅ Transaction confirmed');
    }

    // Display final configuration
    console.log('\n🎉 Deployment Complete!');
    console.log('\n📋 Final Configuration:');
    console.log('==========================================');
    console.log('Network:', NETWORK);
    console.log('Program ID:', program.programId.toString());
    console.log('Admin:', adminKeypair.publicKey.toString());
    console.log('Marketplace PDA:', marketplacePda.toString());
    console.log('Marketplace Fee:', `${MARKETPLACE_FEE_BPS / 100}%`);
    
    // Get current program state
    try {
      const marketplace = await program.account.marketplace.fetch(marketplacePda);
      
      console.log('\n📊 Current State:');
      console.log('Marketplace Active:', marketplace.isActive);
      console.log('Total Products:', marketplace.totalProducts.toString());
      console.log('Total Sales:', marketplace.totalSales.toString());
      console.log('Total Volume:', marketplace.totalVolume.toString());
    } catch (error) {
      console.log('⚠️  Could not fetch current state:', error.message);
    }

    console.log('\n🔧 Next Steps:');
    console.log('1. Creators can now create profiles and list products');
    console.log('2. Set up marketplace frontend integration');
    console.log('3. Configure payment processing systems');
    console.log('4. Monitor marketplace activity');
    
    console.log('\n💡 Environment Variables for Frontend:');
    console.log(`NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID=${program.programId.toString()}`);
    console.log(`NEXT_PUBLIC_MARKETPLACE_PDA=${marketplacePda.toString()}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main };






















