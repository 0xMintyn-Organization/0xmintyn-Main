import { useEffect } from 'react';
import { useTokenRefresh } from '@/utils/tokenRefresh';

/**
 * Hook for managing long operations that might exceed token expiry
 * Automatically refreshes tokens during long operations
 */
export function useLongOperation(operationName: string) {
  const { startRefresh, stopRefresh, refreshIfNeeded } = useTokenRefresh();

  useEffect(() => {
    console.log(`Starting long operation: ${operationName}`);
    
    // Start token refresh for this operation
    startRefresh(30); // Refresh every 30 minutes
    
    // Proactively refresh if token is near expiry
    refreshIfNeeded();

    // Cleanup when operation ends
    return () => {
      console.log(`Ending long operation: ${operationName}`);
      stopRefresh();
    };
  }, [operationName, startRefresh, stopRefresh, refreshIfNeeded]);

  return {
    refreshToken: refreshIfNeeded,
  };
}
