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
 */
export function hubAnalyticsQueryKey(businessId, from, to) {
    return ['hubAnalytics', businessId, from, to];
}

/**
 * @param {string} businessId
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @param {string} [channel]
 * @param {string|null} [category]
 */
export function hubSalesPerformanceQueryKey(businessId, from, to, channel = 'all', category = null) {
    return ['hubSalesPerformance', businessId, from, to, channel, category ?? null];
}

/**
 * Same-tenant keep-previous for React Query placeholderData.
 * Never paints another business's rows.
 *
 * @param {unknown} previousData
 * @param {{ queryKey?: readonly unknown[] } | undefined} previousQuery
 * @param {string | null | undefined} businessId
 * @param {number} [businessIdIndex=1]
 */
export function sameTenantPlaceholderData(previousData, previousQuery, businessId, businessIdIndex = 1) {
    if (!previousData || !businessId || !previousQuery?.queryKey) return undefined;
    if (previousQuery.queryKey[businessIdIndex] !== businessId) return undefined;
    return previousData;
}
