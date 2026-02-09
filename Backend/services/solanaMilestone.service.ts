/**
 * Solana Milestone Program integration.
 * Program ID: 8piK13GH7Qd5EU5NXTW6mBz17q4GtJaMSsGd63H6XRy6
 * Status flow: Created -> Completed -> Submitted -> Approved
 *
 * The backend wallet (ANCHOR_WALLET) is used as:
 * - creator: when calling create (one-time init for server-owned milestone)
 * - approver: when calling approve (admin approves a creator's milestone)
 *
 * create/complete/submit require the creator's signature - use frontend for user-owned milestones.
 */
import * as anchor from '@anchor-lang/core';
import { Program } from '@anchor-lang/core';
import * as fs from 'fs';
import * as path from 'path';

const MILESTONE_PROGRAM_ID = '8piK13GH7Qd5EU5NXTW6mBz17q4GtJaMSsGd63H6XRy6';
const MILESTONE_SEED = Buffer.from('milestone');

const idl = require('../config/solana-milestone-idl.json');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MilestoneIdl = any;

function resolveWalletPath(): string | null {
  // 1. Env path (absolute or relative to Backend root)
  const envPath = process.env.ANCHOR_WALLET || process.env.SOLANA_WALLET_PATH;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
    if (fs.existsSync(resolved)) return resolved;
  }
  // 2. Default: Backend/config/solana-wallet.json (copy your id.json here)
  const defaultPath = path.join(process.cwd(), 'config', 'solana-wallet.json');
  if (fs.existsSync(defaultPath)) return defaultPath;
  return null;
}

function getProvider(): { provider: anchor.AnchorProvider; program: Program<MilestoneIdl> } | null {
  const walletPath = resolveWalletPath();
  if (!walletPath) return null;
  try {
    const secret = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(secret));
    const connection = new anchor.web3.Connection(
      process.env.ANCHOR_PROVIDER_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new Program(idl as anchor.Idl, provider) as Program<MilestoneIdl>;
    return { provider, program };
  } catch {
    return null;
  }
}

function getMilestonePda(creatorPubkey: anchor.web3.PublicKey): anchor.web3.PublicKey {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [MILESTONE_SEED, creatorPubkey.toBuffer()],
    new anchor.web3.PublicKey(MILESTONE_PROGRAM_ID)
  );
  return pda;
}

/** Fetch on-chain milestone state for a creator. No wallet required. */
export async function fetchMilestoneState(creatorPubkeyBase58: string): Promise<{
  creator: string;
  status: 'created' | 'completed' | 'submitted' | 'approved';
  createdAt: number;
  pda: string;
} | null> {
  const connection = new anchor.web3.Connection(
    process.env.ANCHOR_PROVIDER_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  );
  const creatorPubkey = new anchor.web3.PublicKey(creatorPubkeyBase58);
  const pda = getMilestonePda(creatorPubkey);
  try {
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo?.data) return null;
    // Decode Anchor account: 8-byte discriminator + 32 (creator) + 1 (status enum) + 8 (created_at)
    const data = accountInfo.data;
    if (data.length < 8 + 32 + 1 + 8) return null;
    const statusByte = data[8 + 32];
    const statusMap = ['created', 'completed', 'submitted', 'approved'] as const;
    const status = statusMap[statusByte] ?? 'created';
    const createdAt = data.readBigInt64LE(8 + 32 + 1);
    return {
      creator: creatorPubkeyBase58,
      status,
      createdAt: Number(createdAt),
      pda: pda.toBase58(),
    };
  } catch {
    return null;
  }
}

/** Create milestone on-chain (server wallet as creator). One-time init. */
export async function createMilestoneOnChain(): Promise<{ pda: string; tx: string } | { error: string }> {
  const ctx = getProvider();
  if (!ctx) return { error: 'Solana wallet not configured. Set ANCHOR_WALLET or SOLANA_WALLET_PATH.' };
  const { program, provider } = ctx;
  const wallet = provider.wallet;
  try {
    const tx = await program.methods.create().accounts({ creator: wallet.publicKey }).rpc();
    const pda = getMilestonePda(wallet.publicKey).toBase58();
    return { pda, tx };
  } catch (e) {
    const err = e as { message?: string; logs?: string[] };
    return { error: err.message || String(e) };
  }
}

/** Approve milestone on-chain (backend wallet as approver). Creator is the milestone owner's pubkey. */
export async function approveMilestoneOnChain(creatorPubkeyBase58: string): Promise<{ tx: string } | { error: string }> {
  const ctx = getProvider();
  if (!ctx) return { error: 'Solana wallet not configured. Set ANCHOR_WALLET or SOLANA_WALLET_PATH.' };
  const { program, provider } = ctx;
  const creatorPubkey = new anchor.web3.PublicKey(creatorPubkeyBase58);
  try {
    const tx = await program.methods
      .approve()
      .accounts({
        approver: provider.wallet.publicKey,
        creator: creatorPubkey,
      })
      .rpc();
    return { tx };
  } catch (e) {
    const err = e as { message?: string; logs?: string[] };
    return { error: err.message || String(e) };
  }
}

/** Check if Solana integration is configured. */
export function isSolanaConfigured(): boolean {
  return resolveWalletPath() !== null;
}
