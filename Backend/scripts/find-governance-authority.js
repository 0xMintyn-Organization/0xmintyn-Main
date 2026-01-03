/**
 * Script to find the governance authority keypair
 * 
 * Usage: node scripts/find-governance-authority.js
 */

const fs = require('fs');
const path = require('path');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// The authority that initialized governance
const EXPECTED_AUTHORITY = 'Wo8BUGvvituc1v6Ns1M5dERyDZiFQYuy85wqu1F9S1v';

// Possible keypair locations
const possiblePaths = [
  // Mintyn token wallet
  path.join(__dirname, '..', '..', '..', '0xmintyn_Blockchain_Development', 'MintynToken', 'mintyn-token', 'wallet.json'),
  // Default Solana config location
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'id.json'),
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'my-mintyn-wallet.json'),
  // Governance keypair (wrong one, but let's check)
  path.join(__dirname, '..', '..', '..', '0xmintyn_Blockchain_Development', 'Smart_Contract', 'governance', 'target', 'deploy', 'governance-keypair.json'),
];

console.log('\n' + '='.repeat(80));
console.log('🔍 SEARCHING FOR GOVERNANCE AUTHORITY KEYPAIR');
console.log('='.repeat(80));
console.log('Expected Authority:', EXPECTED_AUTHORITY);
console.log('\nChecking keypair files...\n');

let foundKeypair = null;
let foundPath = null;

for (const keypairPath of possiblePaths) {
  try {
    if (fs.existsSync(keypairPath)) {
      const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
      const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      const publicKey = keypair.publicKey.toString();
      
      console.log('📁 Found keypair at:', keypairPath);
      console.log('   Public Key:', publicKey);
      
      if (publicKey === EXPECTED_AUTHORITY) {
        console.log('   ✅ MATCH! This is the correct authority keypair!\n');
        foundKeypair = keypair;
        foundPath = keypairPath;
        break;
      } else {
        console.log('   ❌ Not the correct authority\n');
      }
    }
  } catch (error) {
    // Skip files that don't exist or can't be read
  }
}

if (foundKeypair && foundPath) {
  // Convert to base58
  const keypairData = JSON.parse(fs.readFileSync(foundPath, 'utf-8'));
  const privateKeyBase58 = bs58.encode(Uint8Array.from(keypairData));
  
  console.log('='.repeat(80));
  console.log('✅ FOUND CORRECT KEYPAIR!');
  console.log('='.repeat(80));
  console.log('📁 Keypair File:', foundPath);
  console.log('🔐 Public Key:', foundKeypair.publicKey.toString());
  console.log('\n📋 Add this to your backend .env file:');
  console.log('='.repeat(80));
  console.log(`GOVERNANCE_AUTHORITY_PRIVATE_KEY=${privateKeyBase58}`);
  console.log('='.repeat(80));
  console.log('\n✅ Copy the line above and add it to your .env file!');
  console.log('⚠️  Keep this private key secure and never commit it to Git!\n');
} else {
  console.log('='.repeat(80));
  console.log('❌ KEYPAIR NOT FOUND');
  console.log('='.repeat(80));
  console.log('Could not find the keypair for authority:', EXPECTED_AUTHORITY);
  console.log('\nPlease check:');
  console.log('1. The wallet.json file in MintynToken/mintyn-token/');
  console.log('2. Your Solana config directory: ~/.config/solana/');
  console.log('3. Or manually provide the keypair path via SOLANA_KEYPAIR_PATH\n');
}


