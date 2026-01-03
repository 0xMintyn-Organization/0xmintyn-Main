/**
 * Script to convert governance keypair to base58 format for environment variable
 * 
 * Usage: node scripts/get-governance-keypair.js
 */

const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');

// Path to governance keypair
const keypairPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '0xmintyn_Blockchain_Development',
  'Smart_Contract',
  'governance',
  'target',
  'deploy',
  'governance-keypair.json'
);

try {
  if (!fs.existsSync(keypairPath)) {
    console.error('❌ Keypair file not found at:', keypairPath);
    console.log('\nPlease make sure the governance contract has been built.');
    process.exit(1);
  }

  // Read keypair
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  
  // Convert to base58
  const privateKeyBase58 = bs58.encode(Uint8Array.from(keypairData));
  
  // Get public key for verification
  const { Keypair } = require('@solana/web3.js');
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  console.log('\n' + '='.repeat(80));
  console.log('🔑 GOVERNANCE AUTHORITY KEYPAIR');
  console.log('='.repeat(80));
  console.log('📁 Keypair File:', keypairPath);
  console.log('🔐 Public Key:', keypair.publicKey.toString());
  console.log('\n📋 Add this to your backend .env file:');
  console.log('='.repeat(80));
  console.log(`GOVERNANCE_AUTHORITY_PRIVATE_KEY=${privateKeyBase58}`);
  console.log('='.repeat(80));
  console.log('\n✅ Copy the line above and add it to your .env file!');
  console.log('⚠️  Keep this private key secure and never commit it to Git!\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}


