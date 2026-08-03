/**
 * Canonical tenant-id extraction across layers.
 *
 * Conventions (do not mix in Prisma/SQL field maps):
 * - Postgres / Prisma columns: `business_id`
 * - JS args, React props, withApiAuth context: `businessId`
 * - Business row PK from BusinessContext: `business.id`
 *
 * At API / action edges, accept snake or camel and normalize once to a UUID string.
 */

/**
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function normalizeBusinessId(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/**
 * Pick a business UUID from strings and/or plain objects.
 * Object keys tried (in order): businessId, business_id, id
 *
 * @param {...unknown} sources
 * @returns {string | undefined}
 */
export function pickBusinessId(...sources) {
  for (const source of sources) {
    if (source == null) continue;
    if (typeof source === 'string') {
      const fromString = normalizeBusinessId(source);
      if (fromString) return fromString;
      continue;
    }
    if (typeof source === 'object' && !Array.isArray(source)) {
      const record = /** @type {Record<string, unknown>} */ (source);
      const fromObject =
        normalizeBusinessId(record.businessId) ||
        normalizeBusinessId(record.business_id) ||
        normalizeBusinessId(record.id);
      if (fromObject) return fromObject;
    }
  }
  return undefined;
}

/**
 * @param {URLSearchParams | { get: (key: string) => string | null }} searchParams
 * @returns {string | undefined}
 */
export function pickBusinessIdFromSearchParams(searchParams) {
  if (!searchParams || typeof searchParams.get !== 'function') return undefined;
  return (
    normalizeBusinessId(searchParams.get('business_id')) ||
    normalizeBusinessId(searchParams.get('businessId'))
  );
}

/**
 * @param {unknown} body
 * @returns {string | undefined}
 */
export function pickBusinessIdFromBody(body) {
  return pickBusinessId(body);
}
