// Smart Contracts Configuration
export const SMART_CONTRACTS_CONFIG = {
  // Network Configuration
  network: {
    name: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
    rpcUrls: [
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL_1 || 'https://api.devnet.solana.com',
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL_2 || 'https://api.mainnet-beta.solana.com',
    ],
    commitment: 'confirmed' as const,
  },

  // Smart Contract Program IDs
  programIds: {
    // UBI Distribution Contract - MintynUBIDistribution
    ubiDistribution: process.env.NEXT_PUBLIC_UBI_PROGRAM_ID || '11111111111111111111111111111111',
    
    // Governance Contract - MintynGovernance
    governance: process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111',
    
    // Digital Marketplace Contract - MintynDigitalMarketplace
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID || '11111111111111111111111111111111',
    
    // P2P Exchange Contract - MintynP2PExchange
    p2pExchange: process.env.NEXT_PUBLIC_P2P_PROGRAM_ID || '11111111111111111111111111111111',
    
    // Cross-Chain Bridge Contract - MintynCrossChainBridge
    crossChainBridge: process.env.NEXT_PUBLIC_BRIDGE_PROGRAM_ID || '11111111111111111111111111111111',
    
    // P2P Escrow Contract - MintynP2PEscrow
    p2pEscrow: process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID || '11111111111111111111111111111111',
    
    // SPL Token Program (Standard)
    splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },

  // Token Configuration
  token: {
    mint: process.env.NEXT_PUBLIC_TOKEN_MINT || '11111111111111111111111111111111',
    symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'MINTYN',
    decimals: parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '9'),
    name: 'Mintyn Token',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8000',
    timeout: 30000,
  },

  // Feature Flags
  features: {
    ubi: process.env.NEXT_PUBLIC_ENABLE_UBI !== 'false',
    governance: process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE !== 'false',
    marketplace: process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE !== 'false',
    p2p: process.env.NEXT_PUBLIC_ENABLE_P2P !== 'false',
    bridge: process.env.NEXT_PUBLIC_ENABLE_BRIDGE !== 'false',
    escrow: process.env.NEXT_PUBLIC_ENABLE_ESCROW !== 'false',
  },

  // Contract Metadata
  contracts: {
    ubiDistribution: {
      name: 'MintynUBIDistribution',
      version: '1.0.0',
      description: 'Universal Basic Income distribution system with fraud detection',
      author: 'Mintyn Team',
      license: 'MIT',
      repository: 'https://github.com/mintyn/ubi-distribution',
      deployedAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    governance: {
      name: 'MintynGovernance',
      version: '1.0.0',
      description: 'Decentralized governance system for protocol decisions',
      author: 'Mintyn Team',
      license: 'MIT',
      repository: 'https://github.com/mintyn/governance',
      deployedAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    marketplace: {
      name: 'MintynDigitalMarketplace',
      version: '1.0.0',
      description: 'Decentralized marketplace for digital products and services',
      author: 'Mintyn Team',
      license: 'MIT',
      repository: 'https://github.com/mintyn/marketplace',
      deployedAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    p2pExchange: {
      name: 'MintynP2PExchange',
      version: '1.0.0',
      description: 'Peer-to-peer exchange for direct token trading',
      author: 'Mintyn Team',
      license: 'MIT',
      repository: 'https://github.com/mintyn/p2p-exchange',
      deployedAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    crossChainBridge: {
      name: 'MintynCrossChainBridge',
      version: '1.0.0',
      description: 'Cross-chain asset bridging for multi-network support',
      author: 'Mintyn Team',
      license: 'MIT',
      repository: 'https://github.com/mintyn/cross-chain-bridge',
      deployedAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    p2pEscrow: {
      name: 'MintynP2PEscrow',
      version: '1.0.0',
      description: 'Secure escrow system for P2P transactions',
      author: 'Mintyn Team',
      license: 'MIT',
      repository: 'https://github.com/mintyn/p2p-escrow',
      deployedAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
  },

  // Supported Networks for Bridge
  supportedNetworks: [
    {
      name: 'Solana',
      chainId: 'solana',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      nativeCurrency: {
        name: 'SOL',
        symbol: 'SOL',
        decimals: 9,
      },
    },
    {
      name: 'Ethereum',
      chainId: '1',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      explorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
    },
    {
      name: 'Polygon',
      chainId: '137',
      rpcUrl: 'https://polygon-rpc.com',
      explorerUrl: 'https://polygonscan.com',
      nativeCurrency: {
        name: 'Polygon',
        symbol: 'MATIC',
        decimals: 18,
      },
    },
  ],

  // Default Configuration Values
  defaults: {
    ubi: {
      welcomeBonusAmount: '2000000000', // 2000 tokens
      initialUbiAmount: '2000000000', // 2000 tokens
      monthlyUbiAmount: '1000000000', // 1000 tokens
      maxUsers: 1000000,
    },
    governance: {
      minProposalTokens: '10000000000', // 10,000 tokens
      votingPeriod: 7 * 24 * 60 * 60, // 7 days in seconds
      executionDelay: 24 * 60 * 60, // 1 day in seconds
      quorumThreshold: 10, // 10%
      supermajorityThreshold: 60, // 60%
    },
    marketplace: {
      marketplaceFeeBps: 250, // 2.5%
      maxListingPrice: '1000000000000', // 1,000,000 tokens
      minListingPrice: '1000000', // 1 token
    },
    p2p: {
      maxOrderAmount: '100000000000', // 100,000 tokens
      minOrderAmount: '1000000', // 1 token
      maxPriceDeviation: 10, // 10%
    },
    bridge: {
      minBridgeAmount: '1000000', // 1 token
      maxBridgeAmount: '1000000000000', // 1,000,000 tokens
      bridgeFeeBps: 10, // 0.1%
    },
  },
} as const;

// Export individual configurations for easy access
export const {
  network,
  programIds,
  token,
  api,
  features,
  contracts,
  supportedNetworks,
  defaults,
} = SMART_CONTRACTS_CONFIG;

// Helper functions
export const getProgramId = (contractName: keyof typeof programIds) => {
  return programIds[contractName];
};

export const isFeatureEnabled = (featureName: keyof typeof features) => {
  return features[featureName];
};

export const getContractConfig = (contractName: keyof typeof contracts) => {
  return contracts[contractName];
};

export const getDefaultConfig = (contractName: keyof typeof defaults) => {
  return defaults[contractName];
};

export default SMART_CONTRACTS_CONFIG;
