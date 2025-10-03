'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MarketplaceContextType {
  activeTab: 'products' | 'services';
  setActiveTab: (tab: 'products' | 'services') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <MarketplaceContext.Provider value={{
      activeTab,
      setActiveTab,
      searchQuery,
      setSearchQuery,
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
