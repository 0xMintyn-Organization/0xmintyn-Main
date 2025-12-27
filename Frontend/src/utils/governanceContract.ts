/**
 * Governance Smart Contract Utility Functions
 * Simple workflow: Check tokens -> Create proposal -> Vote -> Admin accepts -> Creator gets 100 tokens
 */

import { Program, AnchorProvider, Wallet, BN, BorshInstructionCoder } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import type { Idl } from "@coral-xyz/anchor";

// ============================================================================
// CONSTANTS
// ============================================================================

export const GOVERNANCE_PROGRAM_ID = new PublicKey("FRrKBmyzE4TN4sQw2m7FWvvAAAE2tckpvVJMRuR8GCQb");
export const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

// PDA Seeds (v2 - updated to match contract)
const GOVERNANCE_SEED = Buffer.from("governance-v2");
const TREASURY_SEED = Buffer.from("treasury");
const PROPOSAL_SEED = Buffer.from("proposal");
const VOTE_SEED = Buffer.from("vote");

// Token requirements (with 9 decimals)
const MIN_PROPOSAL_TOKENS = 5_000_000_000; // 5 tokens
const PROPOSAL_REWARD = 100_000_000_000; // 100 tokens

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

let cachedIdl: Idl | null = null;

async function loadIdl(): Promise<Idl> {
  if (cachedIdl) return cachedIdl;

  try {
    const response = await fetch("/idl/governance.json");
    if (!response.ok) {
      throw new Error(`Failed to load IDL: ${response.status}`);
    }
    const idl = await response.json();
    cachedIdl = idl as Idl;
    return cachedIdl;
  } catch (error) {
    console.error("❌ Error loading IDL:", error);
    throw new Error(`Failed to load Governance IDL: ${error}`);
  }
}

/**
 * Derive PDA addresses
 */
export function deriveGovernancePDAs(creatorWallet?: PublicKey, proposalId?: number) {
  const [governance] = PublicKey.findProgramAddressSync(
    [GOVERNANCE_SEED],
    GOVERNANCE_PROGRAM_ID
  );

  const [treasury] = PublicKey.findProgramAddressSync(
    [GOVERNANCE_SEED, TREASURY_SEED],
    GOVERNANCE_PROGRAM_ID
  );

  let proposal: PublicKey | null = null;
  if (creatorWallet !== undefined && proposalId !== undefined) {
    // Proposal PDA: [PROPOSAL_SEED, creator, total_proposals (as u64 little-endian)]
    // This matches the contract: governance.total_proposals.to_le_bytes()
    const proposalIdBuffer = Buffer.allocUnsafe(8);
    proposalIdBuffer.writeBigUInt64LE(BigInt(proposalId), 0);
    [proposal] = PublicKey.findProgramAddressSync(
      [PROPOSAL_SEED, creatorWallet.toBuffer(), proposalIdBuffer],
      GOVERNANCE_PROGRAM_ID
    );
  }

  return { governance, treasury, proposal };
}

/**
 * Find the token account that actually has Mintyn tokens
 */
export async function findUserTokenAccount(
  connection: Connection,
  userWallet: PublicKey
): Promise<{ account: PublicKey; balance: number } | null> {
  try {
    // First try the Associated Token Account (most common)
    const ata = await getAssociatedTokenAddress(MINTYN_MINT, userWallet);
    try {
      const account = await getAccount(connection, ata);
      const mint = await getMint(connection, MINTYN_MINT);
      const balance = Number(account.amount) / Math.pow(10, mint.decimals);
      if (balance > 0) {
        return { account: ata, balance };
      }
    } catch {
      // ATA doesn't exist or has 0 balance
    }

    // If ATA doesn't have tokens, search all token accounts using RPC
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userWallet, {
      mint: MINTYN_MINT,
    });

    for (const tokenAccount of tokenAccounts.value) {
      const parsedInfo = tokenAccount.account.data.parsed.info;
      const balance = parsedInfo.tokenAmount.uiAmount || 0;
      if (balance > 0) {
        // tokenAccount.pubkey is the token account address
        return { account: tokenAccount.pubkey, balance };
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding token account:", error);
    return null;
  }
}

/**
 * Check if user has enough Mintyn tokens (5+ tokens)
 */
export async function checkUserHasEnoughTokens(
  connection: Connection,
  userWallet: PublicKey
): Promise<{ hasEnough: boolean; balance: number; required: number; tokenAccount?: PublicKey }> {
  try {
    const tokenAccountInfo = await findUserTokenAccount(connection, userWallet);
    
    if (!tokenAccountInfo) {
      return {
        hasEnough: false,
        balance: 0,
        required: MIN_PROPOSAL_TOKENS / 1e9, // 5 tokens
      };
    }

    const { account, balance } = tokenAccountInfo;
    const hasEnough = balance >= 5;
    
    return {
      hasEnough,
      balance,
      required: 5,
      tokenAccount: account,
    };
  } catch (error) {
    console.error("Error checking token balance:", error);
    return {
      hasEnough: false,
      balance: 0,
      required: 5,
    };
  }
}

// ============================================================================
// CREATE PROPOSAL
// ============================================================================

/**
 * Create a proposal (requires 5+ Mintyn tokens)
 */
export async function createProposal(
  userWalletAddress: string,
  title: string,
  description: string,
  phantomProvider: any
): Promise<{ signature: string; proposalAddress: string }> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const userPublicKey = new PublicKey(userWalletAddress);

    // Verify wallet connected
    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }

    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== userWalletAddress) {
      throw new Error("Connected wallet doesn't match. Please connect the correct wallet.");
    }

    // Find the token account that actually has tokens
    console.log("=".repeat(80));
    console.log("🔍 STEP 1: Searching for token account with Mintyn tokens...");
    console.log(`   User wallet: ${userPublicKey.toString()}`);
    console.log(`   Mint address: ${MINTYN_MINT.toString()}`);
    console.log(`   Required: ${MIN_PROPOSAL_TOKENS} (5 tokens)`);
    console.log("=".repeat(80));
    
    // First try the ATA (most common case)
    const ata = await getAssociatedTokenAddress(MINTYN_MINT, userPublicKey);
    console.log(`📋 ATA Address: ${ata.toString()}`);
    
    let creatorTokenAccount: PublicKey | null = null;
    let maxBalance = 0;
    const mint = await getMint(connection, MINTYN_MINT);
    console.log(`📋 Mint decimals: ${mint.decimals}`);
    
    // Check ATA first
    console.log("\n🔍 Checking ATA...");
    try {
      const ataInfo = await getAccount(connection, ata);
      const rawBalance = Number(ataInfo.amount);
      const balance = rawBalance / Math.pow(10, mint.decimals);
      console.log(`   ✅ ATA exists`);
      console.log(`   ✅ Raw balance: ${rawBalance}`);
      console.log(`   ✅ Display balance: ${balance} tokens`);
      console.log(`   ✅ Check: ${rawBalance} >= ${MIN_PROPOSAL_TOKENS} = ${rawBalance >= MIN_PROPOSAL_TOKENS}`);
      
      if (rawBalance >= MIN_PROPOSAL_TOKENS) {
        creatorTokenAccount = ata;
        maxBalance = rawBalance;
        console.log(`   ✅ ATA has sufficient tokens! Using ATA.`);
      } else {
        console.log(`   ⚠️ ATA has insufficient tokens (${balance} < 5)`);
      }
    } catch (e: any) {
      console.log(`   ❌ ATA doesn't exist or error: ${e.message}`);
    }
    
    // If ATA doesn't have enough, search all token accounts using RPC
    if (!creatorTokenAccount || maxBalance < MIN_PROPOSAL_TOKENS) {
      console.log("\n🔍 Searching all token accounts via RPC...");
      try {
        const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(userPublicKey, {
          mint: MINTYN_MINT,
        });
        
        console.log(`   Found ${allTokenAccounts.value.length} token account(s) for Mintyn`);
        
        // Find the account with the most tokens
        for (let i = 0; i < allTokenAccounts.value.length; i++) {
          const acc = allTokenAccounts.value[i];
          try {
            const parsedInfo = acc.account.data.parsed.info;
            const tokenAccountAddress = acc.pubkey; // This is the token account address
            const rawBalance = parsedInfo.tokenAmount.amount;
            const balance = parsedInfo.tokenAmount.uiAmount || 0;
            console.log(`\n   Account #${i + 1}:`);
            console.log(`      Address: ${tokenAccountAddress.toString()}`);
            console.log(`      Raw balance: ${rawBalance}`);
            console.log(`      Display balance: ${balance} tokens`);
            console.log(`      Check: ${Number(rawBalance)} >= ${MIN_PROPOSAL_TOKENS} = ${Number(rawBalance) >= MIN_PROPOSAL_TOKENS}`);
            
            const rawBalanceNum = Number(rawBalance);
            if (rawBalanceNum > maxBalance) {
              console.log(`      ⭐ This account has more tokens! Updating selection.`);
              maxBalance = rawBalanceNum;
              creatorTokenAccount = tokenAccountAddress; // Use the actual token account address
            }
          } catch (e: any) {
            console.log(`   ❌ Error reading account #${i + 1}: ${e.message}`);
          }
        }
      } catch (e: any) {
        console.log(`   ❌ Error searching token accounts: ${e.message}`);
      }
    }
    
    // If no account found, try ATA one more time
    if (!creatorTokenAccount) {
      console.log("\n🔍 No accounts found, falling back to ATA...");
      creatorTokenAccount = ata;
      try {
        const accInfo = await getAccount(connection, creatorTokenAccount);
        maxBalance = Number(accInfo.amount);
        const balance = maxBalance / Math.pow(10, mint.decimals);
        console.log(`   ATA ${creatorTokenAccount.toString()}: ${balance} tokens (${maxBalance} raw)`);
      } catch (e: any) {
        console.log(`   ❌ ATA doesn't exist or has no tokens: ${e.message}`);
        maxBalance = 0;
      }
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("📊 FINAL SELECTION:");
    if (!creatorTokenAccount || maxBalance < MIN_PROPOSAL_TOKENS) {
      const balanceDisplay = maxBalance / Math.pow(10, mint.decimals);
      console.log(`   ❌ NO SUITABLE ACCOUNT FOUND`);
      console.log(`   Found balance: ${balanceDisplay.toFixed(2)} tokens (${maxBalance} raw)`);
      console.log(`   Required: 5 tokens (${MIN_PROPOSAL_TOKENS} raw)`);
      throw new Error(
        `You need at least 5 Mintyn tokens to create a proposal. Found ${balanceDisplay.toFixed(2)} tokens in your accounts.`
      );
    }
    
    const balanceDisplay = maxBalance / Math.pow(10, mint.decimals);
    console.log(`   ✅ Selected account: ${creatorTokenAccount.toString()}`);
    console.log(`   ✅ Balance: ${balanceDisplay} tokens (${maxBalance} raw)`);
    console.log(`   ✅ Required: 5 tokens (${MIN_PROPOSAL_TOKENS} raw)`);
    console.log(`   ✅ Check: ${maxBalance} >= ${MIN_PROPOSAL_TOKENS} = ${maxBalance >= MIN_PROPOSAL_TOKENS} ✓`);
    console.log("=".repeat(80));

    // Verify the account exists (should already be verified above, but double-check)
    let createTokenAccountIx: TransactionInstruction | null = null;
    try {
      const tokenAccount = await getAccount(connection, creatorTokenAccount);
      const rawBalance = Number(tokenAccount.amount);
      
      if (rawBalance < MIN_PROPOSAL_TOKENS) {
        throw new Error(
          `Token account ${creatorTokenAccount.toString()} has insufficient balance: ${rawBalance} < ${MIN_PROPOSAL_TOKENS}`
        );
      }
      
      console.log(`✅ Final verification: Account has ${rawBalance} tokens (>= ${MIN_PROPOSAL_TOKENS} required)`);
    } catch (error: any) {
      // If account doesn't exist, we shouldn't get here since we checked above
      // But if we do, it means something went wrong
      if (error.name === 'TokenAccountNotFoundError' || 
          error.message?.includes('could not find account') ||
          error.message?.includes('InvalidAccountData')) {
        console.error("❌ Token account not found after verification!");
        throw new Error(
          `Token account ${creatorTokenAccount.toString()} was not found. Please ensure your tokens are in a valid token account.`
        );
      } else {
        throw error;
      }
    }

    // Derive PDAs
    const { governance } = deriveGovernancePDAs();
    
    // Get governance account to get total_proposals
    const governanceAccount = await connection.getAccountInfo(governance);
    if (!governanceAccount) {
      throw new Error("Governance program not initialized");
    }

    // Read governance account data to verify mintyn_mint
    // Structure: discriminator(8) + authority(32) + mintyn_mint(32) + treasury(32) + proposal_reward(8) + min_proposal_tokens(8) + total_proposals(8) + bump(1)
    const governanceData = governanceAccount.data;
    const storedMintynMint = new PublicKey(governanceData.slice(8 + 32, 8 + 32 + 32));
    
    console.log("\n🔍 Verifying governance account configuration:");
    console.log(`   Governance PDA: ${governance.toString()}`);
    console.log(`   Stored mintyn_mint in governance: ${storedMintynMint.toString()}`);
    console.log(`   Expected mintyn_mint: ${MINTYN_MINT.toString()}`);
    console.log(`   Mint match: ${storedMintynMint.equals(MINTYN_MINT)}`);
    
    if (!storedMintynMint.equals(MINTYN_MINT)) {
      throw new Error(
        `Governance account was initialized with wrong mint address!\n\n` +
        `Expected: ${MINTYN_MINT.toString()}\n` +
        `Found: ${storedMintynMint.toString()}\n\n` +
        `This happened because the governance program was initialized with a different mint (likely from tests).\n\n` +
        `To fix this, the governance account needs to be reinitialized with the correct mint.\n` +
        `Please contact the administrator or run the reinitialization script.`
      );
    }
    
    // Read total_proposals from governance account
    // Offset: 8 + 32 + 32 + 32 + 8 + 8 = 120
    const totalProposals = governanceData.readBigUInt64LE(120);
    const proposalId = Number(totalProposals);
    console.log(`   Total proposals: ${proposalId}`);

    const { proposal } = deriveGovernancePDAs(userPublicKey, proposalId);

    // Load IDL and build instruction
    const idl = await loadIdl();
    const createProposalIx = idl.instructions?.find((ix: any) => ix.name === "create_proposal");

    if (!createProposalIx) {
      throw new Error("create_proposal instruction not found in IDL");
    }

    // Truncate title and description to fit within Solana's 1232 byte transaction limit
    // Transaction includes: accounts (32 bytes each), instruction data, signatures, etc.
    // We need to keep strings small to fit everything
    // Each account = 32 bytes, instruction data = discriminator (8) + title (4+len) + desc (4+len)
    // With 6 accounts + instruction, we have limited space for data
    const MAX_TITLE_LEN = 50; // Further reduced to fit transaction size
    const MAX_DESCRIPTION_LEN = 200; // Further reduced to fit transaction size
    
    const truncatedTitle = title.length > MAX_TITLE_LEN 
      ? title.substring(0, MAX_TITLE_LEN) 
      : title;
    const truncatedDescription = description.length > MAX_DESCRIPTION_LEN 
      ? description.substring(0, MAX_DESCRIPTION_LEN) 
      : description;
    
    console.log(`📝 Truncating strings:`, {
      originalTitleLen: title.length,
      truncatedTitleLen: truncatedTitle.length,
      originalDescLen: description.length,
      truncatedDescLen: truncatedDescription.length
    });

    // Manually encode instruction data using Borsh format
    // Format: discriminator (8 bytes) + u32 (title len) + title bytes + u32 (desc len) + desc bytes
    const titleBytes = Buffer.from(truncatedTitle, "utf-8");
    const descBytes = Buffer.from(truncatedDescription, "utf-8");
    
    // Calculate buffer size: discriminator (8) + title len (4) + title + desc len (4) + desc
    const bufferSize = 8 + 4 + titleBytes.length + 4 + descBytes.length;
    const buffer = Buffer.alloc(bufferSize);
    let offset = 0;
    
    // Discriminator (8 bytes) - Anchor instruction discriminator
    const discriminator = Buffer.from(createProposalIx.discriminator);
    discriminator.copy(buffer, offset);
    offset += 8;
    
    // Title: u32 length (little-endian) + UTF-8 bytes
    buffer.writeUInt32LE(titleBytes.length, offset);
    offset += 4;
    titleBytes.copy(buffer, offset);
    offset += titleBytes.length;
    
    // Description: u32 length (little-endian) + UTF-8 bytes
    buffer.writeUInt32LE(descBytes.length, offset);
    offset += 4;
    descBytes.copy(buffer, offset);
    
    const instructionData = buffer;
    
    console.log("✅ Instruction data encoded:", {
      discriminator: Array.from(discriminator),
      titleLen: titleBytes.length,
      descLen: descBytes.length,
      totalSize: bufferSize
    });

    // Final verification: Check the account one more time right before building instruction
    console.log("🔍 FINAL VERIFICATION BEFORE BUILDING INSTRUCTION:");
    console.log(`   Token Account Address: ${creatorTokenAccount.toString()}`);
    try {
      const finalCheck = await getAccount(connection, creatorTokenAccount);
      const finalRawBalance = Number(finalCheck.amount);
      const finalBalance = finalRawBalance / Math.pow(10, mint.decimals);
      console.log(`   ✅ Account exists`);
      console.log(`   ✅ Raw balance: ${finalRawBalance}`);
      console.log(`   ✅ Display balance: ${finalBalance} tokens`);
      console.log(`   ✅ Required: ${MIN_PROPOSAL_TOKENS} (5 tokens)`);
      console.log(`   ✅ Check: ${finalRawBalance} >= ${MIN_PROPOSAL_TOKENS} = ${finalRawBalance >= MIN_PROPOSAL_TOKENS}`);
      
      if (finalRawBalance < MIN_PROPOSAL_TOKENS) {
        throw new Error(
          `FINAL CHECK FAILED: Token account ${creatorTokenAccount.toString()} has ${finalBalance} tokens (${finalRawBalance} raw), but needs at least 5 tokens (${MIN_PROPOSAL_TOKENS} raw).`
        );
      }
    } catch (error: any) {
      console.error("❌ FINAL VERIFICATION FAILED:", error);
      throw error;
    }

    // Build accounts
    console.log("📝 Building instruction accounts...");
    const accountMetas = createProposalIx.accounts.map((acc: any) => {
      let pubkey: PublicKey;
      switch (acc.name) {
        case "creator":
          pubkey = userPublicKey;
          console.log(`   ${acc.name}: ${pubkey.toString()}`);
          break;
        case "creator_token_account":
          pubkey = creatorTokenAccount;
          console.log(`   ${acc.name}: ${pubkey.toString()} ⭐ THIS IS THE TOKEN ACCOUNT BEING SENT`);
          break;
        case "governance":
          pubkey = governance;
          console.log(`   ${acc.name}: ${pubkey.toString()}`);
          break;
        case "proposal":
          pubkey = proposal;
          console.log(`   ${acc.name}: ${pubkey.toString()}`);
          break;
        case "token_program":
          pubkey = TOKEN_PROGRAM_ID;
          console.log(`   ${acc.name}: ${pubkey.toString()}`);
          break;
        case "system_program":
          pubkey = SystemProgram.programId;
          console.log(`   ${acc.name}: ${pubkey.toString()}`);
          break;
        default:
          throw new Error(`Unknown account: ${acc.name}`);
      }
      return {
        pubkey,
        isSigner: acc.signer || false,
        isWritable: acc.writable || false,
      };
    });
    
    console.log("✅ Instruction accounts built successfully");

    const instruction = new TransactionInstruction({
      programId: GOVERNANCE_PROGRAM_ID,
      keys: accountMetas,
      data: instructionData,
    });

    const transaction = new Transaction();
    
    // Add token account creation if needed (must be before the proposal instruction)
    if (createTokenAccountIx) {
      transaction.add(createTokenAccountIx);
      console.log("📝 Adding token account creation instruction");
    }
    
    transaction.add(instruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // Simulate the transaction first to see what the contract sees
    console.log("\n🔍 Simulating transaction to check what contract will see...");
    try {
      const simulation = await connection.simulateTransaction(transaction);
      console.log("   Simulation result:", simulation);
      if (simulation.value.err) {
        console.error("   ❌ Simulation error:", simulation.value.err);
        if (simulation.value.logs) {
          console.error("   Logs:", simulation.value.logs);
        }
      } else {
        console.log("   ✅ Simulation successful");
      }
    } catch (simError) {
      console.log("   ⚠️ Could not simulate:", simError);
    }

    // One more verification right before signing
    console.log("\n🔍 Final account verification before signing...");
    try {
      const finalAccountCheck = await getAccount(connection, creatorTokenAccount);
      const finalRaw = Number(finalAccountCheck.amount);
      const finalDisplay = finalRaw / Math.pow(10, mint.decimals);
      console.log(`   Token Account: ${creatorTokenAccount.toString()}`);
      console.log(`   Mint: ${finalAccountCheck.mint.toString()}`);
      console.log(`   Owner: ${finalAccountCheck.owner.toString()}`);
      console.log(`   Expected Owner: ${userPublicKey.toString()}`);
      console.log(`   Owner Match: ${finalAccountCheck.owner.equals(userPublicKey)}`);
      console.log(`   Expected Mint: ${MINTYN_MINT.toString()}`);
      console.log(`   Mint Match: ${finalAccountCheck.mint.equals(MINTYN_MINT)}`);
      console.log(`   Balance: ${finalDisplay} tokens (${finalRaw} raw)`);
      console.log(`   Required: 5 tokens (${MIN_PROPOSAL_TOKENS} raw)`);
      
      if (!finalAccountCheck.mint.equals(MINTYN_MINT)) {
        throw new Error(`Token account mint mismatch! Expected ${MINTYN_MINT.toString()}, got ${finalAccountCheck.mint.toString()}`);
      }
      if (!finalAccountCheck.owner.equals(userPublicKey)) {
        throw new Error(`Token account owner mismatch! Expected ${userPublicKey.toString()}, got ${finalAccountCheck.owner.toString()}`);
      }
      if (finalRaw < MIN_PROPOSAL_TOKENS) {
        throw new Error(`Token account balance insufficient! Has ${finalRaw}, needs ${MIN_PROPOSAL_TOKENS}`);
      }
      console.log("   ✅ All checks passed!");
    } catch (checkError: any) {
      console.error("   ❌ Final check failed:", checkError);
      throw checkError;
    }

    const signedTx = await phantomProvider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    console.log("✅ Proposal created successfully!");
    console.log("📍 Proposal PDA:", proposal.toString());
    return { signature, proposalAddress: proposal.toString() };
  } catch (error: any) {
    console.error("❌ Error creating proposal:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("insufficient") || errorMessage.includes("InsufficientTokens")) {
      throw new Error("You need at least 5 Mintyn tokens to create a proposal.");
    }
    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      throw new Error("Transaction was cancelled.");
    }
    
    throw new Error(errorMessage || "Failed to create proposal. Please try again.");
  }
}

// ============================================================================
// CAST VOTE
// ============================================================================

/**
 * Cast a vote on a proposal (free, no tokens needed)
 */
export async function castVote(
  userWalletAddress: string,
  proposalAddress: string,
  voteType: "yes" | "no",
  phantomProvider: any
): Promise<string> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const userPublicKey = new PublicKey(userWalletAddress);
    const proposalPublicKey = new PublicKey(proposalAddress);

    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }

    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== userWalletAddress) {
      throw new Error("Connected wallet doesn't match.");
    }

    // Derive vote PDA
    const [vote] = PublicKey.findProgramAddressSync(
      [VOTE_SEED, proposalPublicKey.toBuffer(), userPublicKey.toBuffer()],
      GOVERNANCE_PROGRAM_ID
    );

    // Load IDL
    const idl = await loadIdl();
    const castVoteIx = idl.instructions?.find((ix: any) => ix.name === "cast_vote");

    if (!castVoteIx) {
      throw new Error("cast_vote instruction not found");
    }

    // Use Anchor's instruction coder to properly encode arguments
    const coder = new BorshInstructionCoder(idl as any);
    const voteTypeEnum = voteType === "yes" ? { yes: {} } : { no: {} };
    const instructionData = coder.encode(castVoteIx.name, {
      voteType: voteTypeEnum,
    });

    if (!instructionData) {
      throw new Error("Failed to encode instruction data");
    }

    // Build accounts
    const accountMetas = castVoteIx.accounts.map((acc: any) => {
      let pubkey: PublicKey;
      switch (acc.name) {
        case "voter":
          pubkey = userPublicKey;
          break;
        case "proposal":
          pubkey = proposalPublicKey;
          break;
        case "vote":
          pubkey = vote;
          break;
        case "system_program":
          pubkey = SystemProgram.programId;
          break;
        default:
          throw new Error(`Unknown account: ${acc.name}`);
      }
      return {
        pubkey,
        isSigner: acc.signer || false,
        isWritable: acc.writable || false,
      };
    });

    const instruction = new TransactionInstruction({
      programId: GOVERNANCE_PROGRAM_ID,
      keys: accountMetas,
      data: instructionData,
    });

    const transaction = new Transaction();
    transaction.add(instruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    const signedTx = await phantomProvider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    console.log("✅ Vote cast successfully!");
    return signature;
  } catch (error: any) {
    console.error("❌ Error casting vote:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("already voted") || errorMessage.includes("AlreadyVoted")) {
      throw new Error("You have already voted on this proposal.");
    }
    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      throw new Error("Transaction was cancelled.");
    }
    
    throw new Error(errorMessage || "Failed to cast vote. Please try again.");
  }
}

// ============================================================================
// ACCEPT PROPOSAL (Admin Only)
// ============================================================================

/**
 * Accept a proposal (admin only) - sends 100 tokens to creator
 */
export async function acceptProposal(
  authorityAddress: string,
  proposalAddress: string,
  creatorTokenAccount: string,
  phantomProvider: any
): Promise<string> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const authorityPublicKey = new PublicKey(authorityAddress);
    const proposalPublicKey = new PublicKey(proposalAddress);
    const creatorTokenAccountPubkey = new PublicKey(creatorTokenAccount);

    if (!phantomProvider.isConnected) {
      throw new Error("Please connect your Phantom wallet first");
    }

    const connectedAddress = phantomProvider.publicKey?.toString();
    if (connectedAddress !== authorityAddress) {
      throw new Error("You must be the governance authority to accept proposals.");
    }

    // Derive PDAs
    const { governance, treasury } = deriveGovernancePDAs();

    // Load IDL
    const idl = await loadIdl();
    const acceptProposalIx = idl.instructions?.find((ix: any) => ix.name === "accept_proposal");

    if (!acceptProposalIx) {
      throw new Error("accept_proposal instruction not found");
    }

    const discriminator = Buffer.from(acceptProposalIx.discriminator);

    // Build accounts
    const accountMetas = acceptProposalIx.accounts.map((acc: any) => {
      let pubkey: PublicKey;
      switch (acc.name) {
        case "authority":
          pubkey = authorityPublicKey;
          break;
        case "creator_token_account":
          pubkey = creatorTokenAccountPubkey;
          break;
        case "governance":
          pubkey = governance;
          break;
        case "treasury":
          pubkey = treasury;
          break;
        case "proposal":
          pubkey = proposalPublicKey;
          break;
        case "token_program":
          pubkey = TOKEN_PROGRAM_ID;
          break;
        default:
          throw new Error(`Unknown account: ${acc.name}`);
      }
      return {
        pubkey,
        isSigner: acc.signer || false,
        isWritable: acc.writable || false,
      };
    });

    const instruction = new TransactionInstruction({
      programId: GOVERNANCE_PROGRAM_ID,
      keys: accountMetas,
      data: discriminator, // No args for accept_proposal
    });

    const transaction = new Transaction();
    transaction.add(instruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;

    const signedTx = await phantomProvider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    console.log("✅ Proposal accepted! Creator received 100 Mintyn tokens.");
    return signature;
  } catch (error: any) {
    console.error("❌ Error accepting proposal:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("Unauthorized")) {
      throw new Error("Only the governance authority can accept proposals.");
    }
    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      throw new Error("Transaction was cancelled.");
    }
    
    throw new Error(errorMessage || "Failed to accept proposal. Please try again.");
  }
}

// ============================================================================
// GET GOVERNANCE STATE
// ============================================================================

/**
 * Get the governance account state
 */
export async function getGovernanceState(): Promise<{
  authority: PublicKey;
  mintynMint: PublicKey;
  treasury: PublicKey;
  proposalReward: number;
  minProposalTokens: number;
  totalProposals: number;
}> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const { governance } = deriveGovernancePDAs();
    
    const governanceAccount = await connection.getAccountInfo(governance);
    if (!governanceAccount) {
      throw new Error("Governance program not initialized");
    }
    
    // Parse governance account data
    // Structure: discriminator(8) + authority(32) + mintyn_mint(32) + treasury(32) + proposal_reward(8) + min_proposal_tokens(8) + total_proposals(8) + bump(1)
    const data = governanceAccount.data;
    const authority = new PublicKey(data.slice(8, 8 + 32));
    const mintynMint = new PublicKey(data.slice(8 + 32, 8 + 32 + 32));
    const treasury = new PublicKey(data.slice(8 + 32 + 32, 8 + 32 + 32 + 32));
    const proposalReward = Number(data.readBigUInt64LE(8 + 32 + 32 + 32));
    const minProposalTokens = Number(data.readBigUInt64LE(8 + 32 + 32 + 32 + 8));
    const totalProposals = Number(data.readBigUInt64LE(8 + 32 + 32 + 32 + 8 + 8));
    
    return {
      authority,
      mintynMint,
      treasury,
      proposalReward: proposalReward / 1e9, // Convert to tokens
      minProposalTokens: minProposalTokens / 1e9, // Convert to tokens
      totalProposals,
    };
  } catch (error: any) {
    console.error("❌ Error getting governance state:", error);
    throw new Error(`Failed to get governance state: ${error.message}`);
  }
}

/**
 * Get proposal state from blockchain
 */
export async function getProposalState(proposalAddress: string): Promise<{
  creator: PublicKey;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  status: "Active" | "Accepted" | "Rejected";
  createdAt: number;
}> {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const proposalPublicKey = new PublicKey(proposalAddress);
    
    const proposalAccount = await connection.getAccountInfo(proposalPublicKey);
    if (!proposalAccount) {
      throw new Error("Proposal not found");
    }
    
    // Parse proposal account data
    // Structure: discriminator(8) + creator(32) + title(4+len) + description(4+len) + yes_votes(8) + no_votes(8) + total_votes(8) + status(1) + created_at(8) + bump(1)
    const data = proposalAccount.data;
    let offset = 8; // Skip discriminator
    
    const creator = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Read title (string with 4-byte length prefix)
    const titleLen = data.readUInt32LE(offset);
    offset += 4;
    const title = data.slice(offset, offset + titleLen).toString("utf-8");
    offset += titleLen;
    
    // Read description (string with 4-byte length prefix)
    const descLen = data.readUInt32LE(offset);
    offset += 4;
    const description = data.slice(offset, offset + descLen).toString("utf-8");
    offset += descLen;
    
    const yesVotes = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const noVotes = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const totalVotes = Number(data.readBigUInt64LE(offset));
    offset += 8;
    
    // Read status (enum: 0=Active, 1=Accepted, 2=Rejected)
    const statusByte = data[offset];
    const status = statusByte === 0 ? "Active" : statusByte === 1 ? "Accepted" : "Rejected";
    offset += 1;
    
    const createdAt = Number(data.readBigInt64LE(offset));
    
    return {
      creator,
      title,
      description,
      yesVotes,
      noVotes,
      totalVotes,
      status,
      createdAt,
    };
  } catch (error: any) {
    console.error("❌ Error getting proposal state:", error);
    throw new Error(`Failed to get proposal state: ${error.message}`);
  }
}

