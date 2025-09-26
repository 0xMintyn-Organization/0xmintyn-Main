'use client';

import React from 'react';
import { BlockchainProvider } from '@/contexts/BlockchainProvider';
import SmartContractsDashboard from '@/components/blockchain/SmartContractsDashboard';

const SmartContractsPage: React.FC = () => {
  return (
    <BlockchainProvider>
      <div className="container mx-auto px-4 py-8">
        <SmartContractsDashboard />
      </div>
    </BlockchainProvider>
  );
};

export default SmartContractsPage;
