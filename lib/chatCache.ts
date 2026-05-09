/**
 * In-memory TTL cache for chat history.
 *
 * Stores the last N messages per user so Gemini has conversation context
 * without re-fetching Firestore on every request.
 *
 * TTL: 10 minutes of inactivity clears the cache entry.
 * Max messages per user: 20 (keeps context window small).
 */

import type { GeminiMessage } from "@/lib/gemini";

type CacheEntry = {
  messages: GeminiMessage[];
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_MESSAGES = 20;

// Module-level map — persists across requests in the same Node.js process
const cache = new Map<string, CacheEntry>();

function prune() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(key);
  }
}

export function getCachedHistory(uid: string): GeminiMessage[] {
  prune();
  const entry = cache.get(uid);
  if (!entry || entry.expiresAt < Date.now()) return [];
  return entry.messages;
}

export function appendToCache(uid: string, messages: GeminiMessage[]): void {
  prune();
  const existing = getCachedHistory(uid);
  const combined = [...existing, ...messages].slice(-MAX_MESSAGES);
  cache.set(uid, { messages: combined, expiresAt: Date.now() + TTL_MS });
}

export function clearCache(uid: string): void {
  cache.delete(uid);
}
