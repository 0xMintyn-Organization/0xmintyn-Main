/**
 * One-time login codes for website → MVP redirect.
 * MVP exchanges the code for a session (cookies set by API in response to MVP's request).
 */
import crypto from 'crypto';

const store = new Map<string, { userId: string; expiresAt: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes (enough for redirect + possible double-mount)

function randomCode(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function createLoginCode(userId: string): string {
  const code = randomCode();
  store.set(code, { userId, expiresAt: Date.now() + TTL_MS });
  // Simple cleanup of expired entries
  if (store.size > 1000) {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (v.expiresAt < now) store.delete(k);
  }
  return code;
}

export function consumeLoginCode(code: string): string | null {
  const entry = store.get(code);
  if (!entry) return null;
  store.delete(code);
  if (entry.expiresAt < Date.now()) return null;
  return entry.userId;
}
