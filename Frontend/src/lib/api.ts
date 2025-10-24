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

export default api;
