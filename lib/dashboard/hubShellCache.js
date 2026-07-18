/**
 * sessionStorage cache for hub shell bootstrap (Zoho-style warm paint).
 * Soft stale: always return cached payload for instant UI; React Query staleTime drives refetch.
 */

const CACHE_PREFIX = 'tenvo:hubShell:v1:';

/**
 * @param {string} businessId
 * @param {string} from
 * @param {string} to
 */
export function hubShellCacheKey(businessId, from, to) {
    return `${CACHE_PREFIX}${businessId}:${from}:${to}`;
}

/**
 * @param {string} businessId
 * @param {string} from
 * @param {string} to
 */
export function hubShellQueryKey(businessId, from, to) {
    return ['hubShell', businessId, from, to];
}

/**
 * @param {string} cacheKey
 * @returns {object | null}
 */
export function readHubShellCache(cacheKey) {
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
        const raw = window.sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !parsed.payload) return null;
        return parsed.payload;
    } catch {
        return null;
    }
}

/**
 * @param {string} cacheKey
 * @param {object} payload
 */
export function writeHubShellCache(cacheKey, payload) {
    if (typeof window === 'undefined' || !cacheKey || !payload) return;
    try {
        window.sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
                savedAt: Date.now(),
                payload,
            })
        );
    } catch {
        // Quota / private mode — ignore
    }
}

/**
 * @param {string} [businessId] - When set, clear only keys for that business; otherwise clear all hub shell keys.
 */
export function clearHubShellCache(businessId) {
    if (typeof window === 'undefined') return;
    try {
        const prefix = businessId ? `${CACHE_PREFIX}${businessId}:` : CACHE_PREFIX;
        const keys = [];
        for (let i = 0; i < window.sessionStorage.length; i += 1) {
            const key = window.sessionStorage.key(i);
            if (key && key.startsWith(prefix)) keys.push(key);
        }
        keys.forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
        // ignore
    }
}
