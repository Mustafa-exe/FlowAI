/**
 * In-memory TTL cache for AI responses.
 *
 * Keyed by a hash of (uid + message). Identical messages from the same user
 * within the TTL window return the cached response instantly — no Gemini call.
 *
 * TTL: 5 minutes (configurable).
 * Max entries: 500 (LRU eviction when full).
 */

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES   = 500;

const store = new Map<string, CacheEntry>();

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

function evictOldest() {
  // Map preserves insertion order — delete the first (oldest) entry
  const firstKey = store.keys().next().value;
  if (firstKey) store.delete(firstKey);
}

export function cacheGet(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key: string, value: string, ttlMs = CACHE_TTL_MS): void {
  evictExpired();
  if (store.size >= MAX_ENTRIES) evictOldest();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function makeCacheKey(uid: string, message: string): string {
  // Simple deterministic key — uid + normalized message
  return `${uid}:${message.trim().toLowerCase().slice(0, 200)}`;
}
