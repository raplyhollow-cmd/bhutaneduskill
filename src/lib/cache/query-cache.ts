/**
 * API RESPONSE CACHING
 *
 * Reduce database load with intelligent caching
 */

import { LRUCache } from "lru-cache";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// Cache configuration
const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes - frequently changing data
  MEDIUM: 60 * 15, // 15 minutes - moderately changing
  LONG: 60 * 60, // 1 hour - slowly changing
  VERY_LONG: 60 * 60 * 24, // 24 hours - rarely changing
};

// Create caches
export const cacheStore = {
  dashboard: new LRUCache<string, any>({ max: 100, ttl: CACHE_TTL.MEDIUM }),
  analytics: new LRUCache<string, any>({ max: 50, ttl: CACHE_TTL.LONG }),
  reports: new LRUCache<string, any>({ max: 20, ttl: CACHE_TTL.VERY_LONG }),
  config: new LRUCache<string, any>({ max: 200, ttl: CACHE_TTL.VERY_LONG }),
};

/**
 * Get cached data or fetch and cache
 */
export async function cachedQuery<T>(
  cache: LRUCache<string, T>,
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check cache
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const result = await fetcher();
  cache.set(key, result);
  return result;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string) {
  const cache = cacheStore.analytics;
  const keys = Array.from(cache.keys() as Iterable<string>);

  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches() {
  Object.values(cacheStore).forEach((cache) => cache.clear());
}
