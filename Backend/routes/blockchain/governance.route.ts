import express from 'express';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { CacheHelper } from '../../services/cache/redis.service';
import { GovernanceSyncHelper } from '../../models/blockchain/governance.models';
import { getConnectionPool } from '../../services/solana/connection';
import { PublicKey, Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const router = express.Router();

// Get governance configuration
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Try cache first
    let config = await CacheHelper.getGovernanceConfig();
    
    if (!config) {
      // Mock blockchain data - in production, fetch from actual program
      config = {
        admin: '11111111111111111111111111111111',
        tokenMint: '11111111111111111111111111111111',
        minProposalTokens: '10000000000', // 10,000 tokens
        votingPeriod: 7 * 24 * 60 * 60, // 7 days
        executionDelay: 24 * 60 * 60, // 1 day
        quorumThreshold: 10, // 10%
        supermajorityThreshold: 60, // 60%
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        onChainSlot: Date.now(),
        lastSyncAt: new Date(),
      };
      
      // Cache the result
      await CacheHelper.cacheGovernanceConfig(config);
    }

    res.json({
      success: true,
      data: {
        blockchain: config,
        database: config, // In production, this would be from MongoDB
      },
    });
  } catch (error) {
    logger.error('Failed to get governance config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch governance configuration',
    });
  }
});

// Get all proposals
router.get('/proposals', async (req: Request, res: Response) => {
  try {
    const { status, type, category, limit = 50, offset = 0 } = req.query;
    
    // Try cache first
    let proposals = await CacheHelper.getProposalsList();
    
    if (!proposals || proposals.length === 0) {
      // Mock proposals data - in production, fetch from blockchain and database
      proposals = [
        {
          proposalId: 'prop_001',
          title: 'Increase Monthly UBI Distribution',
          description: 'Proposal to increase the monthly UBI distribution from $1000 to $1200 to better support community members during economic challenges.',
          proposer: '11111111111111111111111111111111',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          status: 'active',
          proposalType: 'parameter_change',
          category: 'ubi',
          votesFor: '12500000000', // 12.5M tokens
          votesAgainst: '3200000000', // 3.2M tokens
          totalVotes: '15700000000', // 15.7M tokens
          quorumRequired: '10000000000', // 10M tokens
          isExecuted: false,
          executionData: null,
          implementationDetails: 'Update UBI monthly amount from 1000 to 1200 tokens',
          tags: ['ubi', 'economic', 'community'],
          createdAt: new Date(),
          updatedAt: new Date(),
          onChainSlot: Date.now(),
          lastSyncAt: new Date(),
        },
        {
          proposalId: 'prop_002',
          title: 'Add Cross-Chain Bridge Support',
          description: 'Enable cross-chain functionality to allow MINTYN token holders to bridge their tokens to other supported networks.',
          proposer: '22222222222222222222222222222222',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
          status: 'active',
          proposalType: 'technical_upgrade',
          category: 'bridge',
          votesFor: '8900000000', // 8.9M tokens
          votesAgainst: '1100000000', // 1.1M tokens
          totalVotes: '10000000000', // 10M tokens
          quorumRequired: '10000000000', // 10M tokens
          isExecuted: false,
          executionData: null,
          implementationDetails: 'Deploy bridge contracts on Ethereum and Polygon networks',
          tags: ['bridge', 'technical', 'interoperability'],
          createdAt: new Date(),
          updatedAt: new Date(),
          onChainSlot: Date.now(),
          lastSyncAt: new Date(),
        },
        {
          proposalId: 'prop_003',
          title: 'Protocol Upgrade v2.3',
          description: 'Implement security improvements and performance optimizations in the protocol.',
          proposer: '33333333333333333333333333333333',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          status: 'succeeded',
          proposalType: 'technical_upgrade',
          category: 'security',
          votesFor: '15000000000', // 15M tokens
          votesAgainst: '2000000000', // 2M tokens
          totalVotes: '17000000000', // 17M tokens
          quorumRequired: '10000000000', // 10M tokens
          isExecuted: false,
          executionData: 'upgrade_v2_3_contract_address',
          implementationDetails: 'Deploy new smart contracts with enhanced security features',
          tags: ['security', 'upgrade', 'performance'],
          createdAt: new Date(),
          updatedAt: new Date(),
          onChainSlot: Date.now(),
          lastSyncAt: new Date(),
        },
      ];
      
      // Cache the result
      await CacheHelper.cacheProposalsList(proposals);
    }

    // Apply filters
    let filteredProposals = proposals;
    
    if (status) {
      filteredProposals = filteredProposals.filter(p => p.status === status);
    }
    
    if (type) {
      filteredProposals = filteredProposals.filter(p => p.proposalType === type);
    }
    
    if (category) {
      filteredProposals = filteredProposals.filter(p => p.category === category);
    }

    // Apply pagination
    const startIndex = parseInt(offset as string) || 0;
    const endIndex = startIndex + (parseInt(limit as string) || 50);
    const paginatedProposals = filteredProposals.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        proposals: paginatedProposals,
        total: filteredProposals.length,
        pagination: {
          limit: parseInt(limit as string) || 50,
          offset: parseInt(offset as string) || 0,
          hasMore: endIndex < filteredProposals.length,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get proposals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposals',
    });
  }
});

// Get specific proposal
router.get('/proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    
    // Try cache first
    let proposal = await CacheHelper.getProposal(proposalId);
    
    if (!proposal) {
      // Mock proposal data - in production, fetch from blockchain and database
      proposal = {
        proposalId,
        title: 'Increase Monthly UBI Distribution',
        description: 'Proposal to increase the monthly UBI distribution from $1000 to $1200 to better support community members during economic challenges.',
        proposer: '11111111111111111111111111111111',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        proposalType: 'parameter_change',
        category: 'ubi',
        votesFor: '12500000000',
        votesAgainst: '3200000000',
        totalVotes: '15700000000',
        quorumRequired: '10000000000',
        isExecuted: false,
        executionData: null,
        implementationDetails: 'Update UBI monthly amount from 1000 to 1200 tokens',
        tags: ['ubi', 'economic', 'community'],
        createdAt: new Date(),
        updatedAt: new Date(),
        onChainSlot: Date.now(),
        lastSyncAt: new Date(),
      };
      
      // Cache the result
      await CacheHelper.cacheProposal(proposalId, proposal);
    }

    // Get proposal statistics
    const stats = await GovernanceSyncHelper.getProposalStats(proposalId);

    res.json({
      success: true,
      data: {
        proposal,
        stats,
      },
    });
  } catch (error) {
    logger.error(`Failed to get proposal ${req.params.proposalId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal',
    });
  }
});

// Get user's voting power
router.get('/user/:publicKey/voting-power', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    // Mock voting power - in production, calculate from token balance
    const votingPower = '1000000000'; // 1000 tokens
    
    res.json({
      success: true,
      data: { votingPower },
    });
  } catch (error) {
    logger.error(`Failed to get voting power for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voting power',
    });
  }
});

// Get user's vote on a proposal
router.get('/proposal/:proposalId/vote/:publicKey', async (req: Request, res: Response) => {
  try {
    const { proposalId, publicKey } = req.params;
    
    // Mock vote data - in production, fetch from blockchain and database
    const vote = {
      voter: publicKey,
      proposal: proposalId,
      voteType: 'for',
      votingPower: '1000000000', // 1000 tokens
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      transactionHash: `vote_tx_${Date.now()}`,
      blockTime: Math.floor(Date.now() / 1000),
      slot: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    res.json({
      success: true,
      data: vote,
    });
  } catch (error) {
    logger.error(`Failed to get vote for ${req.params.publicKey} on proposal ${req.params.proposalId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vote',
    });
  }
});

// Get user's voting history
router.get('/user/:publicKey/voting-history', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    const { limit = 50 } = req.query;
    
    // Mock voting history - in production, fetch from database
    const votingHistory = [
      {
        proposalId: 'prop_001',
        title: 'Increase Monthly UBI Distribution',
        voteType: 'for',
        votingPower: '1000000000',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        proposalId: 'prop_002',
        title: 'Add Cross-Chain Bridge Support',
        voteType: 'for',
        votingPower: '1000000000',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    ];
    
    res.json({
      success: true,
      data: votingHistory.slice(0, parseInt(limit as string) || 50),
    });
  } catch (error) {
    logger.error(`Failed to get voting history for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voting history',
    });
  }
});

// Get user's delegations
router.get('/user/:publicKey/delegations', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    // Mock delegations - in production, fetch from database
    const delegations = [
      {
        delegator: publicKey,
        delegate: '44444444444444444444444444444444',
        votingPower: '500000000', // 500 tokens
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isActive: true,
        transactionHash: `delegation_tx_${Date.now()}`,
        blockTime: Math.floor(Date.now() / 1000),
        slot: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    res.json({
      success: true,
      data: delegations,
    });
  } catch (error) {
    logger.error(`Failed to get delegations for ${req.params.publicKey}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delegations',
    });
  }
});

// Get governance statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = {
      totalProposals: 15,
      activeProposals: 2,
      executedProposals: 8,
      totalVotes: 125000,
      totalVotingPower: '50000000000', // 50M tokens
      participationRate: 78.5,
      averageVotingPower: '400000000', // 400 tokens
      lastUpdated: new Date(),
    };
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get governance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch governance statistics',
    });
  }
});

// Create proposal
router.post('/create-proposal', async (req: Request, res: Response) => {
  try {
    const { 
      proposerPrivateKey, 
      title, 
      description, 
      proposalType, 
      category, 
      implementationDetails,
      votingPeriod 
    } = req.body;
    
    if (!proposerPrivateKey || !title || !description || !proposalType || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: proposerPrivateKey, title, description, proposalType, category',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const proposalId = `prop_${Date.now()}`;
    const mockTxHash = `create_proposal_${Date.now()}`;
    
    // Record proposal in database
    await GovernanceSyncHelper.syncProposal(proposalId, {
      title,
      description,
      proposer: '11111111111111111111111111111111',
      createdAt: new BN(Math.floor(Date.now() / 1000)),
      startTime: new BN(Math.floor(Date.now() / 1000)),
      endTime: new BN(Math.floor(Date.now() / 1000) + (votingPeriod || 7 * 24 * 60 * 60)),
      status: 'active',
      proposalType,
      category,
      votesFor: new BN(0),
      votesAgainst: new BN(0),
      totalVotes: new BN(0),
      quorumRequired: new BN(10000000000),
      isExecuted: false,
      executionData: null,
    }, Date.now());

    logger.info(`Proposal created: ${proposalId}. TX: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        proposalId,
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to create proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create proposal',
    });
  }
});

// Vote on proposal
router.post('/vote', async (req: Request, res: Response) => {
  try {
    const { voterPrivateKey, proposalId, voteType, votingPower } = req.body;
    
    if (!voterPrivateKey || !proposalId || !voteType || !votingPower) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: voterPrivateKey, proposalId, voteType, votingPower',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `vote_${Date.now()}`;
    
    // Record vote in database
    await GovernanceSyncHelper.recordVote(
      '11111111111111111111111111111111',
      proposalId,
      voteType,
      votingPower,
      mockTxHash,
      Math.floor(Date.now() / 1000),
      Date.now()
    );

    // Publish event
    await CacheHelper.publishProposalVoted(proposalId, '11111111111111111111111111111111', voteType);

    logger.info(`Vote cast on proposal ${proposalId}. TX: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to vote on proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to vote on proposal',
    });
  }
});

// Delegate voting power
router.post('/delegate', async (req: Request, res: Response) => {
  try {
    const { delegatorPrivateKey, delegate, votingPower } = req.body;
    
    if (!delegatorPrivateKey || !delegate || !votingPower) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: delegatorPrivateKey, delegate, votingPower',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `delegate_${Date.now()}`;
    
    // Record delegation in database
    await GovernanceSyncHelper.recordDelegation(
      '11111111111111111111111111111111',
      delegate,
      votingPower,
      mockTxHash,
      Math.floor(Date.now() / 1000),
      Date.now()
    );

    logger.info(`Voting power delegated. TX: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to delegate voting power:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delegate voting power',
    });
  }
});

// Execute proposal
router.post('/execute-proposal', async (req: Request, res: Response) => {
  try {
    const { executorPrivateKey, proposalId, executionData } = req.body;
    
    if (!executorPrivateKey || !proposalId || !executionData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: executorPrivateKey, proposalId, executionData',
      });
    }

    // Mock transaction - in production, create and send actual transaction
    const mockTxHash = `execute_proposal_${Date.now()}`;
    
    // Record execution in database
    await GovernanceSyncHelper.recordProposalExecution(
      proposalId,
      '11111111111111111111111111111111',
      executionData,
      mockTxHash,
      Math.floor(Date.now() / 1000),
      Date.now(),
      'executed'
    );

    logger.info(`Proposal ${proposalId} executed. TX: ${mockTxHash}`);
    
    res.json({
      success: true,
      data: {
        txHash: mockTxHash,
      },
    });
  } catch (error) {
    logger.error('Failed to execute proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute proposal',
    });
  }
});

export default router;