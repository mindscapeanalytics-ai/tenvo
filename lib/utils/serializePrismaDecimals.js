import { Prisma } from '@prisma/client';

/**
 * Prisma.Decimal across duplicate @prisma/client copies may fail `instanceof`.
 * @param {unknown} value
 * @returns {value is import('@prisma/client/runtime/library').Decimal}
 */
function isDecimalLike(value) {
  if (value == null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  if (value instanceof Prisma.Decimal) return true;
  // Fallback when multiple @prisma/client copies break instanceof
  return (
    typeof /** @type {{ toNumber?: unknown }} */ (value).toNumber === 'function' &&
    typeof /** @type {{ toFixed?: unknown }} */ (value).toFixed === 'function'
  );
}

/**
 * Recursively replace Prisma.Decimal with plain numbers for Server Action / RSC payloads.
 * Client Components cannot receive Decimal instances.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function serializeDecimalsDeep(value) {
  if (value === null || value === undefined) return value;
  if (isDecimalLike(value)) {
    try {
      return /** @type {{ toNumber: () => number }} */ (value).toNumber();
    } catch {
      return Number(/** @type {{ toString: () => string }} */ (value).toString());
    }
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((v) => serializeDecimalsDeep(v));
  }
  const out = {};
  for (const key of Object.keys(value)) {
    out[key] = serializeDecimalsDeep(/** @type {Record<string, unknown>} */(value)[key]);
  }
  return out;
}
