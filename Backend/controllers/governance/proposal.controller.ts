import { Request, Response } from 'express';
import Proposal, { IProposal } from '../../models/governance/proposal.model';
import Vote from '../../models/governance/vote.model';
import User from '../../models/user.mode';
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import ErrorHandler from "../../utils/errorHandler";

// Create a new proposal
export const createProposal = CatchAsyncError(async (req: Request, res: Response) => {
  console.log('=== PROPOSAL CREATION REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Blockchain Address:', req.body.blockchainAddress);
  console.log('Blockchain Tx:', req.body.blockchainTx);
  console.log('User ID:', req.user?.id);
  console.log('User object:', req.user);
  
  const {
    title,
    category,
    summary,
    detailedDescription,
    expectedImpact,
    implementationPlan,
    timeline,
    resourcesNeeded,
    attachments = [],
    startDate,
    endDate,
    proposalFee = 0,
    blockchainAddress,
    blockchainTx
  } = req.body;

  // Validate required fields
  const requiredFields = {
    title,
    category,
    summary,
    detailedDescription,
    expectedImpact,
    implementationPlan,
    resourcesNeeded,
    startDate,
    endDate
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.log("Missing fields:", missingFields.join(", "));
    return res.status(400).json({
      success: false,
      message: `All required fields must be provided. Missing: ${missingFields.join(", ")}`
    });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start <= now) {
    return res.status(400).json({
      success: false,
      message: 'Voting start date must be in the future'
    });
  }

  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'Voting end date must be after start date'
    });
  }

  console.log('User ID from request:', req.user?.id);
  console.log('User ID type:', typeof req.user?.id);

  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    console.log('No user ID found in request');
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found in database for ID:', userId);
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  console.log('User found:', user.username, user.email);

  const proposalData: Partial<IProposal> = {
    title,
    category,
    proposerName: user.username || `${user.firstName} ${user.lastName}`,
    proposerWallet: (user as any).walletAddress || 'N/A',
    proposerId: userId,
    summary,
    detailedDescription,
    expectedImpact,
    implementationPlan,
    timeline: {
      startDate: start,
      endDate: end,
      milestones: req.body.milestones || []
    },
    resourcesNeeded,
    attachments: attachments && attachments.length > 0 ? attachments : [],
    votingOptions: {
      yes: 0,
      no: 0,
      abstain: 0
    },
    totalVotes: 0,
    startDate: start,
    endDate: end,
    proposalFee: proposalFee || 0,
    isPaid: true, // Free proposals are considered "paid"
    status: 'Active', // Directly active - no admin approval needed for now
    requiredVotes: 100, // Default required votes
    quorum: 65, // Default quorum percentage
    blockchainAddress: blockchainAddress || undefined,
    blockchainTx: blockchainTx || undefined
  };

  console.log('Creating proposal with data:', proposalData);
  console.log('Blockchain fields:', {
    blockchainAddress: proposalData.blockchainAddress,
    blockchainTx: proposalData.blockchainTx
  });
  
  try {
    const proposal = await Proposal.create(proposalData);
    console.log('Proposal created successfully:', proposal._id);
    console.log('Saved blockchain fields:', {
      blockchainAddress: (proposal as any).blockchainAddress,
      blockchainTx: (proposal as any).blockchainTx
    });

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully and is now active for voting!',
      data: proposal
    });
  } catch (createError: any) {
    console.error('Error creating proposal in database:', createError);
    console.error('Validation errors:', createError.errors);

    return res.status(400).json({
      success: false,
      message: 'Failed to create proposal',
      error: createError.message,
      validationErrors: createError.errors
    });
  }
});

// Get all proposals with filtering and pagination
export const getAllProposals = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const {
      status = 'Active',
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { proposerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const proposals = await Proposal.find(query)
      .populate('proposerId', 'username firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Proposal.countDocuments(query);

    // Get statistics
    const stats = await Proposal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        },
        stats: {
          totalProposals: total,
          activeProposals: statusStats.Active || 0,
          passedProposals: statusStats.Passed || 0,
          rejectedProposals: statusStats.Rejected || 0,
          ...statusStats
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals',
      error: error.message
    });
  }
});

// Get top proposals (most votes)
export const getTopProposals = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit as string);

    const topProposals = await Proposal.find({ status: 'Active' })
      .populate('proposerId', 'username firstName lastName email')
      .sort({ totalVotes: -1, createdAt: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: topProposals
    });
  } catch (error: any) {
    console.error('Error fetching top proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top proposals',
      error: error.message
    });
  }
});

// Get single proposal by ID
export const getProposalById = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId)
      .populate('proposerId', 'username firstName lastName email avatar');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Get votes for this proposal
    const votes = await Vote.find({ proposalId })
      .populate('voterId', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        proposal,
        votes,
        voteCount: votes.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposal',
      error: error.message
    });
  }
});

// Get user's proposals
export const getUserProposals = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const proposals = await Proposal.find({ proposerId: userId })
      .populate('proposerId', 'username firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Proposal.countDocuments({ proposerId: userId });

    res.status(200).json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching user proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user proposals',
      error: error.message
    });
  }
});

// Update proposal status (Admin only) - Backend handles blockchain transaction
export const updateProposalStatus = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { status, adminNotes } = req.body;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // If status is "Passed" and proposal has blockchain address, send 100 tokens from backend
    if (status === 'Passed' && (proposal as any).blockchainAddress) {
      try {
        // ============================================================================
        // GET CREATOR DETAILS FROM DATABASE
        // ============================================================================
        const creatorUser = await User.findById(proposal.proposerId);
        if (!creatorUser) {
          console.error('❌ Creator user not found in database:', proposal.proposerId);
        } else {
          console.log('\n' + '='.repeat(80));
          console.log('🎯 PROPOSAL ACCEPTED - TOKEN REWARD DETAILS');
          console.log('='.repeat(80));
          console.log('📋 Proposal Information:');
          console.log('   - Proposal ID:', proposal._id);
          console.log('   - Proposal Title:', proposal.title);
          console.log('   - Blockchain Address:', (proposal as any).blockchainAddress);
          console.log('\n👤 Creator Information:');
          console.log('   - Creator Name:', creatorUser.firstName, creatorUser.lastName);
          console.log('   - Creator Username:', creatorUser.username);
          console.log('   - Creator Email:', creatorUser.email);
          console.log('   - Creator User ID:', creatorUser._id);
          console.log('   - Creator Wallet Address:', proposal.proposerWallet);
          console.log('='.repeat(80) + '\n');
        }

        // Load governance authority keypair from environment
        let authorityKeypair: Keypair;
        
        if (process.env.GOVERNANCE_AUTHORITY_PRIVATE_KEY) {
          // From environment variable (base58 encoded)
          const privateKeyBytes = bs58.decode(process.env.GOVERNANCE_AUTHORITY_PRIVATE_KEY);
          authorityKeypair = Keypair.fromSecretKey(privateKeyBytes);
        } else if (process.env.SOLANA_KEYPAIR_PATH) {
          // From file path (environment variable)
          const keypairData = JSON.parse(readFileSync(process.env.SOLANA_KEYPAIR_PATH, 'utf-8'));
          authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
        } else {
          // Try multiple default keypair paths (in order of preference)
          const defaultPaths = [
            // Mintyn token wallet (the one that initialized governance)
            join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              '0xmintyn_Blockchain_Development',
              'MintynToken',
              'mintyn-token',
              'wallet.json'
            ),
            // Governance program keypair
            join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              '0xmintyn_Blockchain_Development',
              'Smart_Contract',
              'governance',
              'target',
              'deploy',
              'governance-keypair.json'
            ),
          ];
          
          let foundKeypair = false;
          for (const defaultKeypairPath of defaultPaths) {
            if (existsSync(defaultKeypairPath)) {
              console.log('📁 Using keypair from:', defaultKeypairPath);
              const keypairData = JSON.parse(readFileSync(defaultKeypairPath, 'utf-8'));
              authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
              foundKeypair = true;
              break;
            }
          }
          
          if (!foundKeypair) {
            throw new Error(
              'GOVERNANCE_AUTHORITY_PRIVATE_KEY or SOLANA_KEYPAIR_PATH must be set in environment variables.\n' +
              'Or place the keypair at one of these locations:\n' +
              `  - ${defaultPaths[0]}\n` +
              `  - ${defaultPaths[1]}\n` +
              'Run: node scripts/find-governance-authority.js to find the correct keypair.'
            );
          }
        }
        
        console.log('🔐 Using Governance Authority:', authorityKeypair.publicKey.toString());

        const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const GOVERNANCE_PROGRAM_ID = new PublicKey(process.env.GOVERNANCE_PROGRAM_ID || 'FRrKBmyzE4TN4sQw2m7FWvvAAAE2tckpvVJMRuR8GCQb');
        const MINTYN_MINT = new PublicKey(process.env.MINTYN_MINT || '4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL');
        
        const connection = new Connection(RPC_URL, 'confirmed');
        const proposalAddress = new PublicKey((proposal as any).blockchainAddress);
        const creatorWallet = new PublicKey(proposal.proposerWallet);
        
        console.log('🔗 Blockchain Connection:');
        console.log('   - RPC URL:', RPC_URL);
        console.log('   - Governance Program ID:', GOVERNANCE_PROGRAM_ID.toString());
        console.log('   - Mintyn Mint Address:', MINTYN_MINT.toString());
        console.log('   - Proposal Address:', proposalAddress.toString());
        console.log('   - Creator Wallet:', creatorWallet.toString());

        // Derive PDAs
        const [governancePDA, governanceBump] = PublicKey.findProgramAddressSync(
          [Buffer.from('governance-v2')],
          GOVERNANCE_PROGRAM_ID
        );
        const [treasuryPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('governance-v2'), Buffer.from('treasury')],
          GOVERNANCE_PROGRAM_ID
        );

        // Fetch governance account to verify authority and get bump
        const governanceAccountInfo = await connection.getAccountInfo(governancePDA);
        if (!governanceAccountInfo) {
          throw new Error('Governance account not found. Please initialize the governance program first.');
        }

        // Verify authority matches
        const governanceAuthority = new PublicKey(governanceAccountInfo.data.slice(8, 40)); // Skip discriminator (8 bytes), then authority (32 bytes)
        if (!governanceAuthority.equals(authorityKeypair.publicKey)) {
          throw new Error(`Authority mismatch! Governance authority is ${governanceAuthority.toString()}, but you're using ${authorityKeypair.publicKey.toString()}`);
        }

        // Get creator's token account
        console.log('\n🔍 Finding Creator Token Account...');
        const creatorATA = await getAssociatedTokenAddress(MINTYN_MINT, creatorWallet);
        console.log('   - Associated Token Address (ATA):', creatorATA.toString());
        
        let creatorTokenAccount = creatorATA;
        let tokenAccountBalance = '0';
        
        try {
          const ataAccount = await getAccount(connection, creatorATA);
          tokenAccountBalance = (Number(ataAccount.amount) / 1e9).toFixed(2);
          console.log('   ✅ ATA exists');
          console.log('   - Current Balance:', tokenAccountBalance, 'Mintyn tokens');
        } catch {
          // ATA doesn't exist, find any token account
          console.log('   ⚠️  ATA does not exist, searching for other token accounts...');
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(creatorWallet, {
            mint: MINTYN_MINT,
          });
          if (tokenAccounts.value.length > 0) {
            creatorTokenAccount = tokenAccounts.value[0].pubkey;
            const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            tokenAccountBalance = balance?.toFixed(2) || '0';
            console.log('   ✅ Found token account:', creatorTokenAccount.toString());
            console.log('   - Current Balance:', tokenAccountBalance, 'Mintyn tokens');
          } else {
            console.log('   ⚠️  No token account found. Will create ATA if needed.');
            tokenAccountBalance = '0';
          }
        }
        
        console.log('   - Token Account to Receive Reward:', creatorTokenAccount.toString());
        console.log('   - Balance Before Transfer:', tokenAccountBalance, 'Mintyn tokens');

        // Load IDL to get correct instruction format
        const idlPath = join(__dirname, '..', '..', '..', '..', '0xmintyn-Main', 'Frontend', 'public', 'idl', 'governance.json');
        let idl: any;
        try {
          idl = JSON.parse(readFileSync(idlPath, 'utf-8'));
        } catch {
          // Fallback: use hardcoded discriminator
          idl = null;
        }

        // Build accept_proposal instruction
        let discriminator: Buffer;
        let accountMetas: any[];

        if (idl && idl.instructions) {
          const acceptProposalIx = idl.instructions.find((ix: any) => ix.name === 'accept_proposal');
          if (acceptProposalIx) {
            discriminator = Buffer.from(acceptProposalIx.discriminator);
            accountMetas = acceptProposalIx.accounts.map((acc: any) => {
              let pubkey: PublicKey;
              switch (acc.name) {
                case 'authority':
                  pubkey = authorityKeypair.publicKey;
                  break;
                case 'governance':
                  pubkey = governancePDA;
                  break;
                case 'proposal':
                  pubkey = proposalAddress;
                  break;
                case 'creator_token_account':
                  pubkey = creatorTokenAccount;
                  break;
                case 'treasury':
                  pubkey = treasuryPDA;
                  break;
                case 'token_program':
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
          } else {
            throw new Error('accept_proposal instruction not found in IDL');
          }
        } else {
          // Fallback: use hardcoded discriminator and account order
          discriminator = Buffer.from([33, 190, 130, 178, 27, 12, 168, 238]);
          accountMetas = [
            { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: governancePDA, isSigner: false, isWritable: false },
            { pubkey: proposalAddress, isSigner: false, isWritable: true },
            { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
            { pubkey: treasuryPDA, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          ];
        }
        
        const instruction = new TransactionInstruction({
          programId: GOVERNANCE_PROGRAM_ID,
          keys: accountMetas,
          data: discriminator,
        });

        const transaction = new Transaction();
        transaction.add(instruction);

        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = authorityKeypair.publicKey;

        // Sign and send
        transaction.sign(authorityKeypair);
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        await connection.confirmTransaction(signature, 'confirmed');

        // Verify token transfer by checking balance after transaction
        let finalBalance = '0';
        try {
          const finalAccount = await getAccount(connection, creatorTokenAccount);
          finalBalance = (Number(finalAccount.amount) / 1e9).toFixed(2);
        } catch {
          // Try parsed accounts if ATA check fails
          const finalAccounts = await connection.getParsedTokenAccountsByOwner(creatorWallet, {
            mint: MINTYN_MINT,
          });
          if (finalAccounts.value.length > 0) {
            const balance = finalAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            finalBalance = balance?.toFixed(2) || '0';
          }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ PROPOSAL ACCEPTED - TOKENS SENT SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log('👤 Creator Details:');
        if (creatorUser) {
          console.log('   - Name:', creatorUser.firstName, creatorUser.lastName);
          console.log('   - Username:', creatorUser.username);
          console.log('   - Email:', creatorUser.email);
        }
        console.log('   - Wallet Address:', proposal.proposerWallet);
        console.log('   - Token Account:', creatorTokenAccount.toString());
        console.log('\n💰 Token Transfer Details:');
        console.log('   - Amount Sent: 100.00 Mintyn tokens');
        console.log('   - Balance Before:', tokenAccountBalance, 'Mintyn tokens');
        console.log('   - Balance After:', finalBalance, 'Mintyn tokens');
        console.log('   - Expected Final Balance:', (parseFloat(tokenAccountBalance) + 100).toFixed(2), 'Mintyn tokens');
        console.log('\n🔗 Transaction Details:');
        console.log('   - Transaction Signature:', signature);
        console.log('   - Explorer URL:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
        console.log('='.repeat(80) + '\n');

        // Update proposal with blockchain transaction
        proposal.status = status;
        if (adminNotes) {
          proposal.adminNotes = adminNotes;
        }
        (proposal as any).blockchainTx = signature;
        await proposal.save();

        return res.status(200).json({
          success: true,
          message: 'Proposal status updated and creator received 100 Mintyn tokens from treasury!',
          data: {
            proposal,
            blockchainTx: signature
          }
        });
      } catch (blockchainError: any) {
        console.error('Error sending tokens via blockchain:', blockchainError);
        // Continue with status update even if blockchain fails
        proposal.status = status;
        if (adminNotes) {
          proposal.adminNotes = adminNotes;
        }
        await proposal.save();

        return res.status(200).json({
          success: true,
          message: 'Proposal status updated, but blockchain transaction failed. Please check backend logs.',
          error: blockchainError.message,
          data: proposal
        });
      }
    }

    // For other statuses or proposals without blockchain address
    proposal.status = status;
    if (adminNotes) {
      proposal.adminNotes = adminNotes;
    }

    await proposal.save();

    res.status(200).json({
      success: true,
      message: 'Proposal status updated successfully',
      data: proposal
    });
  } catch (error: any) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal status',
      error: error.message
    });
  }
});

// Delete proposal (Admin only)
export const deleteProposal = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Delete all votes for this proposal
    await Vote.deleteMany({ proposalId });

    // Delete the proposal
    await Proposal.findByIdAndDelete(proposalId);

    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal',
      error: error.message
    });
  }
});

// Get governance statistics
export const getGovernanceStats = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const stats = await Proposal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Proposal.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVotes = await Vote.countDocuments();
    const totalProposals = await Proposal.countDocuments();

    const statusStats = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const categoryStatsObj = categoryStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalProposals,
        totalVotes,
        statusStats,
        categoryStats: categoryStatsObj,
        activeProposals: statusStats.Active || 0,
        passedProposals: statusStats.Passed || 0,
        rejectedProposals: statusStats.Rejected || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching governance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch governance statistics',
      error: error.message
    });
  }
});
