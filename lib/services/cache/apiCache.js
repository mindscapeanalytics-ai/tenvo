/**
 * Lightweight API Caching Service
 * 
 * Simple in-memory cache with TTL support for expensive read operations.
 * Designed to reduce database load for data that doesn't change frequently 
 * (e.g., historical analytics, reports, settings).
 */

const cache = new Map();

export const apiCache = {
    /**
     * Get or set cache value
     * 
     * @param {string} key - Unique cache key
     * @param {Function} fetcher - Async function to fetch data if not cached
     * @param {number} ttlMs - Time to live in milliseconds (default 5 mins)
     */
    async get(key, fetcher, ttlMs = 300000) {
        const cached = cache.get(key);
        const now = Date.now();

        if (cached && cached.expiry > now) {
            return cached.value;
        }

        // Fetch new data
        const value = await fetcher();

        // Update cache
        cache.set(key, {
            value,
            expiry: now + ttlMs
        });

        return value;
    },

    /**
     * Invalidate specific key or pattern
     */
    invalidate(keyOrPattern) {
        if (typeof keyOrPattern === 'string') {
            cache.delete(keyOrPattern);
        } else if (keyOrPattern instanceof RegExp) {
            for (const key of cache.keys()) {
                if (keyOrPattern.test(key)) {
                    cache.delete(key);
                }
            }
        }
    },

    /**
     * Clear all cache for a specific business
     */
    clearBusinessCache(businessId) {
        const pattern = new RegExp(`^biz:${businessId}:`);
        this.invalidate(pattern);
    },

    /**
     * Helper to generate a standardized cache key
     */
    generateKey(businessId, module, params = {}) {
        const paramStr = JSON.stringify(params);
        return `biz:${businessId}:${module}:${paramStr}`;
    }
};
