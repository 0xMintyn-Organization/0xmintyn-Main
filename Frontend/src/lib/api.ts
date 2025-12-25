import axios from 'axios';

// Centralized API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1/';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to handle errors
api.interceptors.request.use(
  (config) => {
    // Ensure baseURL is always set
    if (!config.baseURL) {
      config.baseURL = API_BASE_URL;
    }
    
    // Ensure withCredentials is set for authenticated requests
    if (config.withCredentials === undefined) {
      config.withCredentials = true;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and ensure JSON responses
api.interceptors.response.use(
  (response) => {
    // Check if response is actually JSON
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', {
        url: response.config.url,
        contentType: contentType,
        status: response.status,
        data: response.data
      });
      throw new Error(`Expected JSON response but received ${contentType}`);
    }
    
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 404) {
        throw new Error('API endpoint not found');
      } else if (status >= 500) {
        throw new Error('Server error occurred');
      } else if (data && typeof data === 'string' && data.includes('<html')) {
        throw new Error('Server returned HTML instead of JSON');
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server - check if backend is running');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper function to make API calls with better error handling
export const apiCall = async (config: any) => {
  try {
    const response = await api(config);
    return response.data;
  } catch (error: any) {
    console.error('API call failed:', error.message);
    throw error;
  }
};

// Specific API functions for marketplace
export const marketplaceAPI = {
  // Products
  getProducts: (params?: any) => apiCall({
    method: 'GET',
    url: 'marketplace/products',
    params: { limit: 1000, ...params }
  }),
  
  getProduct: (id: string) => apiCall({
    method: 'GET',
    url: `marketplace/products/${id}`
  }),
  
  deleteProduct: (id: string) => apiCall({
    method: 'DELETE',
    url: `marketplace/products/${id}`
  }),
  
  // Services
  getServices: (params?: any) => apiCall({
    method: 'GET',
    url: 'marketplace/services',
    params: { limit: 1000, ...params }
  }),
  
  getService: (id: string) => apiCall({
    method: 'GET',
    url: `marketplace/services/${id}`
  }),
  
  deleteService: (id: string) => apiCall({
    method: 'DELETE',
    url: `marketplace/services/${id}`
  }),
  
  // Sellers
  getSellers: (params?: any) => apiCall({
    method: 'GET',
    url: 'marketplace/sellers',
    params
  }),
  
  deleteSeller: (id: string) => apiCall({
    method: 'DELETE',
    url: `marketplace/sellers/profile/${id}`
  }),
  
  // Orders
  getOrders: (params?: any) => apiCall({
    method: 'GET',
    url: 'marketplace/orders/buyer',
    params: { limit: 1000, ...params }
  }),
  
  // Reviews
  getSellerReviews: (sellerId: string) => apiCall({
    method: 'GET',
    url: `marketplace/reviews/seller/${sellerId}`
  }),
  
  deleteReview: (id: string) => apiCall({
    method: 'DELETE',
    url: `marketplace/reviews/${id}`
  }),
  
  // Stats
  getStats: () => apiCall({
    method: 'GET',
    url: 'marketplace/stats'
  }),
  
  // Messages
  getMessages: (params?: any) => apiCall({
    method: 'GET',
    url: 'marketplace/messages/inbox',
    params
  }),
  
  getUnreadCount: () => apiCall({
    method: 'GET',
    url: 'marketplace/messages/unread-count'
  })
};

// Dashboard API functions following marketplace naming convention
export const dashboardAPI = {
  // Stats
  getTotalUsers: () => apiCall({
    method: 'GET',
    url: 'dashboard/totalusers'
  }),

  getTotalInstructors: () => apiCall({
    method: 'GET',
    url: 'dashboard/totalinstructors'
  }),

  getTotalCourses: () => apiCall({
    method: 'GET',
    url: 'dashboard/totalcourses'
  }),

  getTotalProducts: () => apiCall({
    method: 'GET',
    url: 'dashboard/totalproducts'
  }),

  getTotalServices: () => apiCall({
    method: 'GET',
    url: 'dashboard/totalservices'
  }),

  getAvgRating: () => apiCall({
    method: 'GET',
    url: 'dashboard/avgrating'
  }),

  // Top items
  getTopInstructors: (limit?: number) => apiCall({
    method: 'GET',
    url: 'dashboard/topinstructors',
    params: limit ? { limit } : {}
  }),

  getTopProducts: (limit?: number) => apiCall({
    method: 'GET',
    url: 'dashboard/topproducts',
    params: limit ? { limit } : {}
  }),

  getTopServices: (limit?: number) => apiCall({
    method: 'GET',
    url: 'dashboard/topservices',
    params: limit ? { limit } : {}
  }),

  getTopSellers: (limit?: number) => apiCall({
    method: 'GET',
    url: 'dashboard/topsellers',
    params: limit ? { limit } : {}
  }),

  getTrendingCategories: () => apiCall({
    method: 'GET',
    url: 'dashboard/trendingcategories'
  }),

  getRecentActivity: (limit?: number) => apiCall({
    method: 'GET',
    url: 'dashboard/recentactivity',
    params: limit ? { limit } : {}
  })
};

// P2P API functions
export const p2pAPI = {
  // Merchant profile
  getMerchantProfile: () => apiCall({
    method: 'GET',
    url: 'p2p/merchant/profile'
  }),

  updateMerchantProfile: (data: {
    displayName?: string;
    paymentMethods?: string[];
    paymentMethodDetails?: Array<{
      method: string;
      accountNumber?: string;
      accountHolderName?: string;
      bankName?: string;
      iban?: string;
      swiftCode?: string;
      routingNumber?: string;
      email?: string;
      phoneNumber?: string;
      walletAddress?: string;
      notes?: string;
    }>;
    timeLimitMinutes?: number;
    terms?: string;
  }) => apiCall({
    method: 'PUT',
    url: 'p2p/merchant/profile',
    data
  }),

  // Merchant ads
  getMyAds: () => apiCall({
    method: 'GET',
    url: 'p2p/merchant/ads'
  }),

  createAd: (data: {
    asset: string;
    side: 'buy' | 'sell';
    price: number;
    available: number;
    minLimit: number;
    maxLimit: number;
  }) => apiCall({
    method: 'POST',
    url: 'p2p/merchant/ads',
    data
  }),

  updateAd: (adId: string, data: {
    asset?: string;
    side?: 'buy' | 'sell';
    price?: number;
    available?: number;
    minLimit?: number;
    maxLimit?: number;
  }) => apiCall({
    method: 'PUT',
    url: `p2p/merchant/ads/${adId}`,
    data
  }),

  toggleAdStatus: (adId: string) => apiCall({
    method: 'PATCH',
    url: `p2p/merchant/ads/${adId}/toggle`
  }),

  deleteAd: (adId: string) => apiCall({
    method: 'DELETE',
    url: `p2p/merchant/ads/${adId}`
  }),

  duplicateAd: (adId: string) => apiCall({
    method: 'POST',
    url: `p2p/merchant/ads/${adId}/duplicate`
  }),

  // Public offers
  getAllOffers: (params?: {
    asset?: string;
    side?: 'buy' | 'sell';
    minPrice?: number;
    maxPrice?: number;
    paymentMethod?: string;
  }) => apiCall({
    method: 'GET',
    url: 'p2p/offers',
    params
  }),

  getOfferById: (offerId: string) => apiCall({
    method: 'GET',
    url: `p2p/offers/${offerId}`
  }),

  // Get merchant profile by userId (public, for buyers to see payment details)
  getMerchantProfileByUserId: (userId: string) => apiCall({
    method: 'GET',
    url: `p2p/offers/merchant/${userId}`
  }),

  // P2P Trades (Orders)
  createTrade: (data: {
    offerId: string;
    amount: number;
    paymentMethod: string;
  }) => apiCall({
    method: 'POST',
    url: 'p2p/trades',
    data
  }),

  getMyTrades: (params?: {
    status?: string;
  }) => apiCall({
    method: 'GET',
    url: 'p2p/trades',
    params
  }),

  getTradeById: (tradeId: string) => apiCall({
    method: 'GET',
    url: `p2p/trades/${tradeId}`
  }),

  // P2P Messages
  getOrderMessages: (orderId: string, params?: {
    page?: number;
    limit?: number;
  }) => apiCall({
    method: 'GET',
    url: `p2p/messages/order/${orderId}`,
    params
  }),

  saveMessage: (data: {
    orderId: string;
    message: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
    }>;
  }) => apiCall({
    method: 'POST',
    url: 'p2p/messages',
    data
  }),

  markMessagesAsRead: (orderId: string) => apiCall({
    method: 'PATCH',
    url: `p2p/messages/order/${orderId}/read`
  }),

  // Swap API (Bitget)
  getSwapPairs: (params?: { baseCoin?: string; quoteCoin?: string }) => apiCall({
    method: 'GET',
    url: 'swap/pairs',
    params,
  }),

  getTickerPrice: (symbol: string) => apiCall({
    method: 'GET',
    url: `swap/ticker/${symbol}`,
  }),

  getConversionRate: (fromToken: string, toToken: string) => apiCall({
    method: 'GET',
    url: 'swap/rate',
    params: { fromToken, toToken },
  }),

  getBitgetAccount: () => apiCall({
    method: 'GET',
    url: 'swap/account',
  }),

  // Get swap quote (Bitget Wallet Swap API)
  getSwapQuote: (data: {
    fromToken: string;
    toToken: string;
    amount: number;
    fromChain?: string;
    toChain?: string;
    fromAddress?: string;
    estimateGas?: boolean;
  }) => apiCall({
    method: 'POST',
    url: 'swap/quote',
    data,
  }),

  // Place swap order (Bitget Wallet Swap API - returns calldata)
  placeSwapOrder: (data: {
    fromToken: string;
    toToken: string;
    amount: number;
    fromChain?: string;
    toChain?: string;
    fromAddress: string;
    toAddress: string;
    slippage?: number;
    market: string; // From quote response
    toMinAmount?: number;
  }) => apiCall({
    method: 'POST',
    url: 'swap/order',
    data,
  }),

  getSwapOrderStatus: (params: { orderId?: string; clientOid?: string }) => apiCall({
    method: 'GET',
    url: 'swap/order/status',
    params,
  }),
};

export default api;
