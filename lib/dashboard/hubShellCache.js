/**
 * sessionStorage cache for hub shell bootstrap (Zoho-style warm paint).
 * Soft stale: always return cached payload for instant UI; React Query staleTime drives refetch.
 */

const CACHE_PREFIX = 'tenvo:hubShell:v2:';

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
        const payload = parsed.payload;
        // Reject empty / corrupt payloads so we never paint a false "ready" shell.
        if (!payload || typeof payload !== 'object') return null;
        const hasKpis = payload.kpis != null || payload.finance != null;
        const hasLists =
            Array.isArray(payload.invoices) ||
            Array.isArray(payload.products) ||
            Array.isArray(payload.activity);
        if (!hasKpis && !hasLists) return null;
        return payload;
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
 * Clear a single hub-shell cache entry (preferred on date-range revalidate).
 * @param {string} cacheKey
 */
export function clearHubShellCacheKey(cacheKey) {
    if (typeof window === 'undefined' || !cacheKey) return;
    try {
        window.sessionStorage.removeItem(cacheKey);
    } catch {
        // ignore
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
