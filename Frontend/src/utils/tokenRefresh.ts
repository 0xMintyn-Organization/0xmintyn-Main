import axiosInstance from './axiosInstance';

// Token refresh utility for long operations
export class TokenRefreshManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  // Start automatic token refresh for long operations
  startAutoRefresh(intervalMinutes: number = 30) {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }

    // Refresh token every 30 minutes (or specified interval)
    this.refreshInterval = setInterval(async () => {
      await this.refreshToken();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop automatic token refresh
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Manually refresh token
  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return false;
    }

    this.isRefreshing = true;

    try {
      console.log('Refreshing token for long operation...');
      const response = await axiosInstance.get('/refreshtoken');
      
      if (response.data.success) {
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed');
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Check if token is close to expiring (within 10 minutes)
  isTokenNearExpiry(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // If token expires within 10 minutes, consider it near expiry
      return timeUntilExpiry < 600; // 10 minutes
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  // Proactive token refresh if near expiry
  async refreshIfNeeded(): Promise<boolean> {
    if (this.isTokenNearExpiry()) {
      return await this.refreshToken();
    }
    return true;
  }
}

// Global instance
export const tokenRefreshManager = new TokenRefreshManager();

// Hook for long operations
export function useTokenRefresh() {
  const startRefresh = (intervalMinutes?: number) => {
    tokenRefreshManager.startAutoRefresh(intervalMinutes);
  };

  const stopRefresh = () => {
    tokenRefreshManager.stopAutoRefresh();
  };

  const refreshNow = () => {
    return tokenRefreshManager.refreshToken();
  };

  const refreshIfNeeded = () => {
    return tokenRefreshManager.refreshIfNeeded();
  };

  return {
    startRefresh,
    stopRefresh,
    refreshNow,
    refreshIfNeeded,
  };
}
