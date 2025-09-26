import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PublicKey } from '@solana/web3.js';
import { 
  UbiConfig, 
  UserProfile, 
  FraudDetection, 
  Treasury, 
  EligibilityCheck 
} from '@/services/blockchainService';

// Types
export interface BlockchainState {
  // Connection state
  isConnected: boolean;
  walletAddress: string | null;
  network: 'mainnet' | 'devnet' | 'localnet';
  
  // Balances
  solBalance: number;
  tokenBalance: number;
  
  // UBI System
  ubiConfig: UbiConfig | null;
  userProfile: UserProfile | null;
  fraudDetection: FraudDetection | null;
  treasury: Treasury | null;
  eligibility: EligibilityCheck | null;
  
  // Marketplace
  marketplaceListings: any[];
  userListings: any[];
  purchaseHistory: any[];
  
  // Governance
  proposals: any[];
  userVotes: any[];
  votingPower: number;
  
  // P2P Exchange
  orderBook: any[];
  userOrders: any[];
  tradeHistory: any[];
  
  // Cross-chain Bridge
  bridgeTransactions: any[];
  supportedNetworks: any[];
  bridgeStatus: 'idle' | 'processing' | 'completed' | 'failed';
  
  // UI State
  loading: {
    global: boolean;
    ubi: boolean;
    marketplace: boolean;
    governance: boolean;
    exchange: boolean;
    bridge: boolean;
  };
  
  errors: {
    global: string | null;
    ubi: string | null;
    marketplace: string | null;
    governance: string | null;
    exchange: string | null;
    bridge: string | null;
  };
  
  // Notifications
  notifications: any[];
  unreadCount: number;
}

export interface BlockchainActions {
  // Connection actions
  setConnected: (isConnected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setNetwork: (network: 'mainnet' | 'devnet' | 'localnet') => void;
  
  // Balance actions
  setSolBalance: (balance: number) => void;
  setTokenBalance: (balance: number) => void;
  
  // UBI actions
  setUbiConfig: (config: UbiConfig | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setFraudDetection: (detection: FraudDetection | null) => void;
  setTreasury: (treasury: Treasury | null) => void;
  setEligibility: (eligibility: EligibilityCheck | null) => void;
  
  // Marketplace actions
  setMarketplaceListings: (listings: any[]) => void;
  addMarketplaceListing: (listing: any) => void;
  updateMarketplaceListing: (id: string, updates: any) => void;
  removeMarketplaceListing: (id: string) => void;
  setUserListings: (listings: any[]) => void;
  setPurchaseHistory: (history: any[]) => void;
  
  // Governance actions
  setProposals: (proposals: any[]) => void;
  addProposal: (proposal: any) => void;
  updateProposal: (id: string, updates: any) => void;
  setUserVotes: (votes: any[]) => void;
  addUserVote: (vote: any) => void;
  setVotingPower: (power: number) => void;
  
  // P2P Exchange actions
  setOrderBook: (orders: any[]) => void;
  addOrder: (order: any) => void;
  updateOrder: (id: string, updates: any) => void;
  removeOrder: (id: string) => void;
  setUserOrders: (orders: any[]) => void;
  setTradeHistory: (history: any[]) => void;
  addTrade: (trade: any) => void;
  
  // Bridge actions
  setBridgeTransactions: (transactions: any[]) => void;
  addBridgeTransaction: (transaction: any) => void;
  updateBridgeTransaction: (id: string, updates: any) => void;
  setSupportedNetworks: (networks: any[]) => void;
  setBridgeStatus: (status: 'idle' | 'processing' | 'completed' | 'failed') => void;
  
  // Loading actions
  setLoading: (key: keyof BlockchainState['loading'], loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Error actions
  setError: (key: keyof BlockchainState['errors'], error: string | null) => void;
  clearError: (key: keyof BlockchainState['errors']) => void;
  clearAllErrors: () => void;
  
  // Notification actions
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  setUnreadCount: (count: number) => void;
  
  // Reset actions
  resetUbiData: () => void;
  resetMarketplaceData: () => void;
  resetGovernanceData: () => void;
  resetExchangeData: () => void;
  resetBridgeData: () => void;
  resetAllData: () => void;
}

type BlockchainStore = BlockchainState & BlockchainActions;

const initialState: BlockchainState = {
  // Connection state
  isConnected: false,
  walletAddress: null,
  network: 'devnet',
  
  // Balances
  solBalance: 0,
  tokenBalance: 0,
  
  // UBI System
  ubiConfig: null,
  userProfile: null,
  fraudDetection: null,
  treasury: null,
  eligibility: null,
  
  // Marketplace
  marketplaceListings: [],
  userListings: [],
  purchaseHistory: [],
  
  // Governance
  proposals: [],
  userVotes: [],
  votingPower: 0,
  
  // P2P Exchange
  orderBook: [],
  userOrders: [],
  tradeHistory: [],
  
  // Cross-chain Bridge
  bridgeTransactions: [],
  supportedNetworks: [],
  bridgeStatus: 'idle',
  
  // UI State
  loading: {
    global: false,
    ubi: false,
    marketplace: false,
    governance: false,
    exchange: false,
    bridge: false,
  },
  
  errors: {
    global: null,
    ubi: null,
    marketplace: null,
    governance: null,
    exchange: null,
    bridge: null,
  },
  
  // Notifications
  notifications: [],
  unreadCount: 0,
};

export const useBlockchainStore = create<BlockchainStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Connection actions
        setConnected: (isConnected) => 
          set({ isConnected }, false, 'setConnected'),
          
        setWalletAddress: (address) => 
          set({ walletAddress: address }, false, 'setWalletAddress'),
          
        setNetwork: (network) => 
          set({ network }, false, 'setNetwork'),
        
        // Balance actions
        setSolBalance: (balance) => 
          set({ solBalance: balance }, false, 'setSolBalance'),
          
        setTokenBalance: (balance) => 
          set({ tokenBalance: balance }, false, 'setTokenBalance'),
        
        // UBI actions
        setUbiConfig: (config) => 
          set({ ubiConfig: config }, false, 'setUbiConfig'),
          
        setUserProfile: (profile) => 
          set({ userProfile: profile }, false, 'setUserProfile'),
          
        setFraudDetection: (detection) => 
          set({ fraudDetection: detection }, false, 'setFraudDetection'),
          
        setTreasury: (treasury) => 
          set({ treasury }, false, 'setTreasury'),
          
        setEligibility: (eligibility) => 
          set({ eligibility }, false, 'setEligibility'),
        
        // Marketplace actions
        setMarketplaceListings: (listings) => 
          set({ marketplaceListings: listings }, false, 'setMarketplaceListings'),
          
        addMarketplaceListing: (listing) => 
          set((state) => ({ 
            marketplaceListings: [...state.marketplaceListings, listing] 
          }), false, 'addMarketplaceListing'),
          
        updateMarketplaceListing: (id, updates) => 
          set((state) => ({
            marketplaceListings: state.marketplaceListings.map(listing =>
              listing.id === id ? { ...listing, ...updates } : listing
            )
          }), false, 'updateMarketplaceListing'),
          
        removeMarketplaceListing: (id) => 
          set((state) => ({
            marketplaceListings: state.marketplaceListings.filter(listing => listing.id !== id)
          }), false, 'removeMarketplaceListing'),
          
        setUserListings: (listings) => 
          set({ userListings: listings }, false, 'setUserListings'),
          
        setPurchaseHistory: (history) => 
          set({ purchaseHistory: history }, false, 'setPurchaseHistory'),
        
        // Governance actions
        setProposals: (proposals) => 
          set({ proposals }, false, 'setProposals'),
          
        addProposal: (proposal) => 
          set((state) => ({ 
            proposals: [...state.proposals, proposal] 
          }), false, 'addProposal'),
          
        updateProposal: (id, updates) => 
          set((state) => ({
            proposals: state.proposals.map(proposal =>
              proposal.id === id ? { ...proposal, ...updates } : proposal
            )
          }), false, 'updateProposal'),
          
        setUserVotes: (votes) => 
          set({ userVotes: votes }, false, 'setUserVotes'),
          
        addUserVote: (vote) => 
          set((state) => ({ 
            userVotes: [...state.userVotes, vote] 
          }), false, 'addUserVote'),
          
        setVotingPower: (power) => 
          set({ votingPower: power }, false, 'setVotingPower'),
        
        // P2P Exchange actions
        setOrderBook: (orders) => 
          set({ orderBook: orders }, false, 'setOrderBook'),
          
        addOrder: (order) => 
          set((state) => ({ 
            orderBook: [...state.orderBook, order] 
          }), false, 'addOrder'),
          
        updateOrder: (id, updates) => 
          set((state) => ({
            orderBook: state.orderBook.map(order =>
              order.id === id ? { ...order, ...updates } : order
            )
          }), false, 'updateOrder'),
          
        removeOrder: (id) => 
          set((state) => ({
            orderBook: state.orderBook.filter(order => order.id !== id)
          }), false, 'removeOrder'),
          
        setUserOrders: (orders) => 
          set({ userOrders: orders }, false, 'setUserOrders'),
          
        setTradeHistory: (history) => 
          set({ tradeHistory: history }, false, 'setTradeHistory'),
          
        addTrade: (trade) => 
          set((state) => ({ 
            tradeHistory: [...state.tradeHistory, trade] 
          }), false, 'addTrade'),
        
        // Bridge actions
        setBridgeTransactions: (transactions) => 
          set({ bridgeTransactions: transactions }, false, 'setBridgeTransactions'),
          
        addBridgeTransaction: (transaction) => 
          set((state) => ({ 
            bridgeTransactions: [...state.bridgeTransactions, transaction] 
          }), false, 'addBridgeTransaction'),
          
        updateBridgeTransaction: (id, updates) => 
          set((state) => ({
            bridgeTransactions: state.bridgeTransactions.map(tx =>
              tx.id === id ? { ...tx, ...updates } : tx
            )
          }), false, 'updateBridgeTransaction'),
          
        setSupportedNetworks: (networks) => 
          set({ supportedNetworks: networks }, false, 'setSupportedNetworks'),
          
        setBridgeStatus: (status) => 
          set({ bridgeStatus: status }, false, 'setBridgeStatus'),
        
        // Loading actions
        setLoading: (key, loading) => 
          set((state) => ({
            loading: { ...state.loading, [key]: loading }
          }), false, 'setLoading'),
          
        setGlobalLoading: (loading) => 
          set((state) => ({
            loading: { ...state.loading, global: loading }
          }), false, 'setGlobalLoading'),
        
        // Error actions
        setError: (key, error) => 
          set((state) => ({
            errors: { ...state.errors, [key]: error }
          }), false, 'setError'),
          
        clearError: (key) => 
          set((state) => ({
            errors: { ...state.errors, [key]: null }
          }), false, 'clearError'),
          
        clearAllErrors: () => 
          set({
            errors: {
              global: null,
              ubi: null,
              marketplace: null,
              governance: null,
              exchange: null,
              bridge: null,
            }
          }, false, 'clearAllErrors'),
        
        // Notification actions
        addNotification: (notification) => 
          set((state) => ({
            notifications: [...state.notifications, { 
              ...notification, 
              id: notification.id || Date.now().toString(),
              read: false,
              timestamp: notification.timestamp || Date.now()
            }],
            unreadCount: state.unreadCount + 1
          }), false, 'addNotification'),
          
        removeNotification: (id) => 
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unreadCount: notification && !notification.read 
                ? state.unreadCount - 1 
                : state.unreadCount
            };
          }, false, 'removeNotification'),
          
        markNotificationAsRead: (id) => 
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (!notification || notification.read) return state;
            
            return {
              notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: state.unreadCount - 1
            };
          }, false, 'markNotificationAsRead'),
          
        markAllNotificationsAsRead: () => 
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0
          }), false, 'markAllNotificationsAsRead'),
          
        setUnreadCount: (count) => 
          set({ unreadCount: count }, false, 'setUnreadCount'),
        
        // Reset actions
        resetUbiData: () => 
          set({
            ubiConfig: null,
            userProfile: null,
            fraudDetection: null,
            treasury: null,
            eligibility: null,
          }, false, 'resetUbiData'),
          
        resetMarketplaceData: () => 
          set({
            marketplaceListings: [],
            userListings: [],
            purchaseHistory: [],
          }, false, 'resetMarketplaceData'),
          
        resetGovernanceData: () => 
          set({
            proposals: [],
            userVotes: [],
            votingPower: 0,
          }, false, 'resetGovernanceData'),
          
        resetExchangeData: () => 
          set({
            orderBook: [],
            userOrders: [],
            tradeHistory: [],
          }, false, 'resetExchangeData'),
          
        resetBridgeData: () => 
          set({
            bridgeTransactions: [],
            supportedNetworks: [],
            bridgeStatus: 'idle',
          }, false, 'resetBridgeData'),
          
        resetAllData: () => 
          set({
            ...initialState,
            isConnected: get().isConnected,
            walletAddress: get().walletAddress,
            network: get().network,
          }, false, 'resetAllData'),
      }),
      {
        name: 'blockchain-store',
        partialize: (state) => ({
          network: state.network,
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
      }
    ),
    {
      name: 'blockchain-store',
    }
  )
);

export default useBlockchainStore;
