/**
 * Hub shell React Query fetch + sessionStorage persistence (Phase 3 SOT).
 */
import { getHubShellBootstrapAction } from '@/lib/actions/dashboard/hubShellBootstrap';
import {
    hubShellCacheKey,
    readHubShellCache,
    writeHubShellCache,
} from '@/lib/dashboard/hubShellCache';
import { scopeProductsToBusiness } from '@/lib/utils/inventoryTenancy';
import { hubShellQueryKey } from '@/lib/dashboard/hubQueryKeys';

/**
 * @param {Record<string, unknown>} result
 * @param {string} businessId
 * @param {Record<string, unknown> | null | undefined} [prevCache]
 */
export function buildHubShellCachePayload(result, businessId, prevCache = null) {
    const customersFailed = Boolean(result?.errors?.customers);
    const customersForCache = customersFailed
        ? (Array.isArray(prevCache?.customers) ? prevCache.customers : undefined)
        : (Array.isArray(result.customers) ? result.customers : []);

    return {
        kpis: result.kpis,
        finance: result.finance,
        glSummary: result.glSummary,
        chartSeries: result.chartSeries,
        expenseBreakdown: result.expenseBreakdown,
        activity: result.activity,
        invoices: result.invoices,
        ...(customersForCache !== undefined ? { customers: customersForCache } : {}),
        products: scopeProductsToBusiness(result.products, businessId),
        productTotal: result.productTotal,
        hasMoreProducts: result.hasMoreProducts,
        locations: result.locations,
        range: result.range,
        meta: result.meta,
        ...(result.errors ? { errors: result.errors } : {}),
    };
}

/**
 * @param {{ businessId: string, from: string, to: string }} args
 */
export async function fetchHubShellQuery({ businessId, from, to }) {
    const result = await getHubShellBootstrapAction(businessId, { from, to });
    if (!result?.success) {
        throw new Error(result?.error || 'Hub shell bootstrap failed');
    }

    const cacheKey = hubShellCacheKey(businessId, from, to);
    const prevShellCache = readHubShellCache(cacheKey);
    const payload = buildHubShellCachePayload(result, businessId, prevShellCache);
    payload._queryBusinessId = businessId;
    writeHubShellCache(cacheKey, payload);
    return payload;
}

/**
 * Session cache for React Query placeholderData (sync warm paint).
 * @param {string | null | undefined} businessId
 * @param {string | null | undefined} from
 * @param {string | null | undefined} to
 */
export function readHubShellPlaceholder(businessId, from, to) {
    if (!businessId || !from || !to) return undefined;
    return readHubShellCache(hubShellCacheKey(businessId, from, to)) ?? undefined;
}

/**
 * Seed RQ + sessionStorage from RSC hydrate or local patches.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} businessId
 * @param {string} from
 * @param {string} to
 * @param {Record<string, unknown>} payload
 */
export function seedHubShellQueryCache(queryClient, businessId, from, to, payload) {
    if (!queryClient || !businessId || !from || !to || !payload) return;
    queryClient.setQueryData(hubShellQueryKey(businessId, from, to), payload);
    const customersFailed = Boolean(payload?.errors?.customers);
    writeHubShellCache(hubShellCacheKey(businessId, from, to), {
        kpis: payload.kpis,
        finance: payload.finance,
        glSummary: payload.glSummary,
        chartSeries: payload.chartSeries,
        expenseBreakdown: payload.expenseBreakdown,
        activity: payload.activity,
        invoices: payload.invoices,
        ...(customersFailed
            ? {}
            : { customers: Array.isArray(payload.customers) ? payload.customers : [] }),
        products: scopeProductsToBusiness(payload.products, businessId),
        productTotal: payload.productTotal,
        hasMoreProducts: payload.hasMoreProducts,
        locations: payload.locations,
        range: payload.range,
        meta: payload.meta,
        ...(payload.errors ? { errors: payload.errors } : {}),
    });
}
