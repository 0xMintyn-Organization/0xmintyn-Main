/**
 * JWT Token Helper Utilities
 * Decodes JWT tokens and checks expiration
 */

export interface TokenPayload {
  id: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

/**
 * Decode JWT token without verification
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Get JWT token from cookies (client-side only)
 * Note: HTTP-only cookies cannot be accessed via JavaScript
 * This function attempts to get token from document.cookie as fallback
 * @returns Token string or null
 */
export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Get token from localStorage (if available)
 * @returns Token string or null
 */
export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Get token from any available source (cookie or localStorage)
 * @returns Token string or null
 */
export function getToken(): string | null {
  return getTokenFromCookie() || getTokenFromStorage();
}

/**
 * Check if token is expired
 * @param token JWT token string
 * @returns true if expired, false if valid, null if error
 */
export function isTokenExpired(token: string | null): boolean | null {
  if (!token) return true;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get token expiration timestamp (Unix epoch in seconds)
 * @param token JWT token string
 * @returns Expiration timestamp or null
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  return payload.exp;
}

/**
 * Get remaining time until token expiration in milliseconds
 * @param token JWT token string
 * @returns Remaining milliseconds or null if expired/invalid
 */
export function getTokenTimeRemaining(token: string | null): number | null {
  if (!token) return null;

  const expiration = getTokenExpiration(token);
  if (!expiration) return null;

  const now = Math.floor(Date.now() / 1000);
  const remaining = expiration - now;

  return remaining > 0 ? remaining * 1000 : 0;
}

/**
 * Check if token will expire within specified minutes
 * @param token JWT token string
 * @param minutes Minutes before expiration to check
 * @returns true if expiring soon, false otherwise
 */
export function isTokenExpiringSoon(token: string | null, minutes: number = 5): boolean {
  if (!token) return true;

  const remaining = getTokenTimeRemaining(token);
  if (remaining === null) return true;

  const minutesRemaining = remaining / (1000 * 60);
  return minutesRemaining <= minutes;
}

/**
 * Format remaining time as human-readable string
 * @param milliseconds Remaining time in milliseconds
 * @returns Formatted string (e.g., "5m 30s")
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0s';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

