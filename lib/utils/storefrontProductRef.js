/**
 * Storefront product identity — cart and stock APIs expect tenant-scoped UUIDs.
 */
export const STOREFRONT_PRODUCT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @param {unknown} value
 */
export function isStorefrontProductUuid(value) {
  return typeof value === 'string' && STOREFRONT_PRODUCT_UUID_RE.test(value.trim());
}

const ACTIVE_PRODUCT_FILTER = `
  COALESCE(is_deleted, false) = false AND is_active = true
`;

/**
 * Resolve a product ref (UUID, SKU, barcode, variant SKU, or slug) to products.id for one tenant.
 * @param {import('pg').PoolClient} client
 * @param {string} productRef
 * @param {string} businessId
 * @returns {Promise<string | null>}
 */
export async function resolveStorefrontProductId(client, productRef, businessId) {
  const ref = String(productRef || '').trim();
  if (!ref || !businessId) return null;

  if (isStorefrontProductUuid(ref)) {
    const owned = await client.query(
      `SELECT id FROM products
       WHERE id = $1::uuid AND business_id = $2::uuid
         AND ${ACTIVE_PRODUCT_FILTER}
       LIMIT 1`,
      [ref, businessId]
    );
    return owned.rows[0]?.id || null;
  }

  const normalized = ref.toLowerCase();

  const bySku = await client.query(
    `SELECT id FROM products
     WHERE business_id = $1::uuid
       AND LOWER(TRIM(COALESCE(sku, ''))) = $2
       AND ${ACTIVE_PRODUCT_FILTER}
     LIMIT 1`,
    [businessId, normalized]
  );
  if (bySku.rows[0]?.id) return bySku.rows[0].id;

  const byBarcode = await client.query(
    `SELECT id FROM products
     WHERE business_id = $1::uuid
       AND barcode IS NOT NULL
       AND TRIM(barcode) <> ''
       AND LOWER(TRIM(barcode)) = $2
       AND ${ACTIVE_PRODUCT_FILTER}
     LIMIT 1`,
    [businessId, normalized]
  );
  if (byBarcode.rows[0]?.id) return byBarcode.rows[0].id;

  const byVariantSku = await client.query(
    `SELECT p.id FROM products p
     INNER JOIN product_variants pv
       ON pv.product_id = p.id AND pv.business_id = p.business_id
     WHERE p.business_id = $1::uuid
       AND pv.variant_sku IS NOT NULL
       AND TRIM(pv.variant_sku) <> ''
       AND LOWER(TRIM(pv.variant_sku)) = $2
       AND COALESCE(p.is_deleted, false) = false
       AND p.is_active = true
     LIMIT 1`,
    [businessId, normalized]
  );
  if (byVariantSku.rows[0]?.id) return byVariantSku.rows[0].id;

  try {
    const bySlug = await client.query(
      `SELECT id FROM products
       WHERE business_id = $1::uuid AND slug = $2
         AND ${ACTIVE_PRODUCT_FILTER}
       LIMIT 1`,
      [businessId, ref]
    );
    if (bySlug.rows[0]?.id) return bySlug.rows[0].id;
  } catch (err) {
    if (err?.code !== '42703') throw err;
  }

  return null;
}
