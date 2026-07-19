/**
 * Canonical React Query / session cache keys for hub SWR paint.
 * Date parts are always YYYY-MM-DD (matches resolveAnalyticsRange / shell bootstrap).
 */

import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';

/**
 * @param {unknown} from
 * @param {unknown} to
 * @returns {{ from: string; to: string } | null}
 */
export function toHubRangeKeys(from, to) {
    const fromKey = toAnalyticsIsoDate(from);
    const toKey = toAnalyticsIsoDate(to);
    if (!fromKey || !toKey) return null;
    return { from: fromKey, to: toKey };
}

/**
 * @param {string} businessId
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @returns {readonly ['hubAnalytics', string, string, string]}
 */
export function hubAnalyticsQueryKey(businessId, from, to) {
    return /** @type {const} */ (['hubAnalytics', businessId, from, to]);
}

/**
 * @param {string} businessId
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @param {string} [channel]
 * @param {string|null} [category]
 * @returns {readonly ['hubSalesPerformance', string, string, string, string, string|null]}
 */
export function hubSalesPerformanceQueryKey(businessId, from, to, channel = 'all', category = null) {
    return /** @type {const} */ ([
        'hubSalesPerformance',
        businessId,
        from,
        to,
        channel,
        category ?? null,
    ]);
}

/**
 * Same-tenant keep-previous for React Query placeholderData.
 * Never paints another business's rows.
 *
 * @template T
 * @param {T | undefined} previousData
 * @param {{ queryKey?: readonly unknown[] } | undefined} previousQuery
 * @param {string | null | undefined} businessId
 * @param {number} [businessIdIndex=1]
 * @returns {T | undefined}
 */
export function sameTenantPlaceholderData(previousData, previousQuery, businessId, businessIdIndex = 1) {
    if (previousData == null || !businessId || !previousQuery?.queryKey) return undefined;
    if (previousQuery.queryKey[businessIdIndex] !== businessId) return undefined;
    return previousData;
}
