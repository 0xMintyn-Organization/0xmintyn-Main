const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { 
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const EXCHANGE_FEE_BPS = 30; // 0.3%

async function main() {
  console.log('🚀 Starting P2P Exchange Program Deployment...\n');
  
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
    const idlPath = path.join(__dirname, 'anchor/target/idl/p2p_exchange.json');
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

    // Create or get supported tokens
    let supportedTokens = [];
    const tokensPath = path.join(__dirname, 'supported-tokens.json');
    
    if (fs.existsSync(tokensPath)) {
      const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      supportedTokens = tokensData.tokens.map(t => new PublicKey(t.mint));
      console.log('✅ Using existing supported tokens:', supportedTokens.length);
    } else {
      console.log('\n🪙 Creating test tokens...');
      
      // Create USDC-like token for testing
      const usdcToken = await createMint(
        connection,
        adminKeypair,
        adminKeypair.publicKey,
        null,
        6 // USDC has 6 decimals
      );
      
      // Create another test token
      const testToken = await createMint(
        connection,
        adminKeypair,
        adminKeypair.publicKey,
        null,
        9
      );
      
      supportedTokens = [usdcToken, testToken];
      
      // Save token info
      const tokensData = {
        tokens: [
          {
            mint: usdcToken.toString(),
            symbol: 'USDC-TEST',
            name: 'Test USDC',
            decimals: 6
          },
          {
            mint: testToken.toString(),
            symbol: 'TEST',
            name: 'Test Token',
            decimals: 9
          }
        ]
      };
      
      fs.writeFileSync(tokensPath, JSON.stringify(tokensData, null, 2));
      console.log('✅ Test tokens created and saved');
      
      // Create admin token accounts and mint some tokens
      for (let i = 0; i < supportedTokens.length; i++) {
        const tokenAccount = await createAssociatedTokenAccount(
          connection,
          adminKeypair,
          supportedTokens[i],
          adminKeypair.publicKey
        );
        
        const mintAmount = i === 0 ? 1_000_000_000_000 : 1_000_000_000_000_000; // Different amounts for different decimals
        await mintTo(
          connection,
          adminKeypair,
          supportedTokens[i],
          tokenAccount,
          adminKeypair,
          mintAmount
        );
      }
      
      console.log('✅ Test tokens minted to admin accounts');
    }

    // Derive PDAs
    const [exchangePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('exchange')],
      program.programId
    );

    console.log('\n📍 Program Addresses:');
    console.log('Exchange PDA:', exchangePda.toString());
    console.log('Supported Tokens:', supportedTokens.length);
    supportedTokens.forEach((token, i) => {
      console.log(`  Token ${i + 1}:`, token.toString());
    });

    // Check if program is already initialized
    let isInitialized = false;
    try {
      await program.account.exchange.fetch(exchangePda);
      isInitialized = true;
      console.log('✅ Exchange already initialized');
    } catch (error) {
      console.log('📝 Exchange not initialized, proceeding with initialization...');
    }

    // Initialize exchange if not already done
    if (!isInitialized) {
      console.log('\n🔧 Initializing P2P Exchange...');
      
      const tx = await program.methods
        .initializeExchange(
          adminKeypair.publicKey,
          adminKeypair.publicKey, // treasury
          EXCHANGE_FEE_BPS,
          supportedTokens
        )
        .accounts({
          admin: adminKeypair.publicKey,
          exchange: exchangePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      console.log('✅ Exchange initialized! Transaction:', tx);
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
    console.log('Exchange PDA:', exchangePda.toString());
    console.log('Exchange Fee:', `${EXCHANGE_FEE_BPS / 100}%`);
    console.log('Supported Tokens:', supportedTokens.length);
    
    // Get current program state
    try {
      const exchange = await program.account.exchange.fetch(exchangePda);
      
      console.log('\n📊 Current State:');
      console.log('Exchange Active:', exchange.isActive);
      console.log('Total Orders:', exchange.totalOrders.toString());
      console.log('Total Trades:', exchange.totalTrades.toString());
      console.log('Total Volume:', exchange.totalVolume.toString());
      console.log('Supported Tokens:', exchange.supportedTokens.length);
    } catch (error) {
      console.log('⚠️  Could not fetch current state:', error.message);
    }

    console.log('\n🔧 Next Steps:');
    console.log('1. Users can create profiles and start trading');
    console.log('2. Set up fiat payment integrations');
    console.log('3. Configure dispute resolution processes');
    console.log('4. Monitor exchange activity and user reputation');
    console.log('5. Add more supported tokens as needed');
    
    console.log('\n💡 Environment Variables for Frontend:');
    console.log(`NEXT_PUBLIC_P2P_EXCHANGE_PROGRAM_ID=${program.programId.toString()}`);
    console.log(`NEXT_PUBLIC_EXCHANGE_PDA=${exchangePda.toString()}`);
    supportedTokens.forEach((token, i) => {
      console.log(`NEXT_PUBLIC_SUPPORTED_TOKEN_${i + 1}=${token.toString()}`);
    });

    console.log('\n📋 Payment Methods Supported:');
    console.log('- Bank Transfer');
    console.log('- PayPal');
    console.log('- Wise (formerly TransferWise)');
    console.log('- Revolut');
    console.log('- Cash App');
    console.log('- Venmo');
    console.log('- Zelle');
    console.log('- Custom payment methods');

    console.log('\n🌍 Supported Fiat Currencies:');
    console.log('- USD, EUR, GBP, CAD, AUD');
    console.log('- JPY, CHF, CNY, INR, BRL');
    console.log('- Custom currencies can be added');

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














