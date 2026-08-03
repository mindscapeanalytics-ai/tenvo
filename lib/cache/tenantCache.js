import 'server-only';

import { tenantCacheKey } from '@/lib/cache/redisKeys';
import { isRedisConfigured, redisGet, redisSetEx, redisDel } from '@/lib/cache/redis';

/**
 * Tenant-scoped Redis cache layer for hub hot-path reads.
 *
 * This supplements the Next.js Data Cache (storefront) with tenant-aware
 * caching for hub/POS data that changes frequently but is read many times
 * between mutations (product lists, dashboard KPIs, customer lookups).
 *
 * TTLs are kept short (30-120s) to balance freshness vs. DB load.
 * Explicit invalidation via `purgeTenantCacheKey` is called from mutation paths.
 */

/** @typedef {'products' | 'dashboard' | 'customer' | 'pos-products' | 'invoice-list'} TenantCacheKind */

const TENANT_CACHE_TTL = {
  /** Product list page (paginated hub grid) */
  products: 60,
  /** Dashboard KPI aggregates */
  dashboard: 120,
  /** Customer profile + balance */
  customer: 90,
  /** POS product lookup (fast scan) */
  'pos-products': 30,
  /** Invoice list (recent invoices) */
  'invoice-list': 60,
};

/**
 * Read a tenant-scoped cached value.
 * @param {string} businessId
 * @param {TenantCacheKind} kind
 * @param {string} [suffix] — e.g. page number, customer ID
 * @returns {Promise<unknown | null>}
 */
export async function getTenantCache(businessId, kind, suffix = '') {
  if (!isRedisConfigured() || !businessId) return null;
  try {
    const key = tenantCacheKey(businessId, kind, suffix);
    const raw = await redisGet(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write a tenant-scoped cached value.
 * @param {string} businessId
 * @param {TenantCacheKind} kind
 * @param {unknown} data — must be JSON-serializable
 * @param {string} [suffix]
 * @returns {Promise<boolean>}
 */
export async function setTenantCache(businessId, kind, data, suffix = '') {
  if (!isRedisConfigured() || !businessId || data === undefined) return false;
  try {
    const key = tenantCacheKey(businessId, kind, suffix);
    const ttl = TENANT_CACHE_TTL[kind] || 60;
    return await redisSetEx(key, JSON.stringify(data), ttl);
  } catch {
    return false;
  }
}

/**
 * Purge a specific tenant cache entry.
 * @param {string} businessId
 * @param {TenantCacheKind} kind
 * @param {string} [suffix]
 * @returns {Promise<boolean>}
 */
export async function purgeTenantCacheKey(businessId, kind, suffix = '') {
  if (!businessId) return false;
  try {
    const key = tenantCacheKey(businessId, kind, suffix);
    return await redisDel(key);
  } catch {
    return false;
  }
}

/**
 * Purge all known cache kinds for a tenant (after major mutations).
 * Fire-and-forget — safe from sync mutation handlers.
 * @param {string} businessId
 */
export function purgeTenantCacheAll(businessId) {
  if (!businessId) return;
  const kinds = Object.keys(TENANT_CACHE_TTL);
  void Promise.allSettled(
    kinds.map((kind) => purgeTenantCacheKey(businessId, kind))
  );
}
