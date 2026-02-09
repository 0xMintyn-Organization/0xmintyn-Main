/**
 * Run: node scripts/check-solana-milestone.js <creator_pubkey>
 * Example: node scripts/check-solana-milestone.js FcSUcr8tYGN1oYaVNhnp2g3YE8vhCznoJju5BQZy3Cun
 */
const { Connection, PublicKey } = require('@solana/web3.js');
const path = require('path');
const fs = require('fs');

const PROGRAM_ID = '8piK13GH7Qd5EU5NXTW6mBz17q4GtJaMSsGd63H6XRy6';
const RPC = process.env.ANCHOR_PROVIDER_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function getPda(creator) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('milestone'), creator.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

async function main() {
  const creatorB58 = process.argv[2] || 'FcSUcr8tYGN1oYaVNhnp2g3YE8vhCznoJju5BQZy3Cun';
  const connection = new Connection(RPC);
  const creator = new PublicKey(creatorB58);
  const pda = getPda(creator);

  console.log('Creator:', creatorB58);
  console.log('PDA:', pda.toBase58());
  console.log('RPC:', RPC);

  try {
    const info = await connection.getAccountInfo(pda);
    if (!info || !info.data) {
      console.log('Status: No milestone account found');
      process.exit(0);
    }
    const data = info.data;
    if (data.length < 49) {
      console.log('Status: Invalid account data');
      process.exit(0);
    }
    const statusByte = data[40];
    const statuses = ['created', 'completed', 'submitted', 'approved'];
    const status = statuses[statusByte] || 'unknown';
    const createdAt = data.readBigInt64LE(41);
    console.log('Status:', status);
    console.log('Created at:', new Date(Number(createdAt) * 1000).toISOString());
    console.log('OK');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
