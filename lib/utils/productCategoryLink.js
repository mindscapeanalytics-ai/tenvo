import 'server-only';

import { slugifyCategoryName } from '@/lib/utils/registrationSeed';

/**
 * Resolve product_categories.id from a display name or slug.
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {string | null | undefined} categoryLabel
 * @returns {Promise<string | null>}
 */
export async function resolveProductCategoryId(client, businessId, categoryLabel) {
  const label = String(categoryLabel || '').trim();
  if (!label || !businessId) return null;

  const slug = slugifyCategoryName(label);
  const result = await client.query(
    `SELECT id FROM product_categories
     WHERE business_id = $1::uuid
       AND COALESCE(is_active, true) = true
       AND (LOWER(name) = LOWER($2) OR slug = $3)
     ORDER BY sort_order NULLS LAST, name
     LIMIT 1`,
    [businessId, label, slug]
  );

  return result.rows[0]?.id || null;
}

/**
 * Attach category_id when only a string category label is present.
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {Record<string, unknown>} productData
 */
export async function enrichProductDataWithCategoryId(client, businessId, productData) {
  if (!productData || productData.category_id) return productData;
  const categoryId = await resolveProductCategoryId(client, businessId, productData.category);
  if (!categoryId) return productData;
  return { ...productData, category_id: categoryId };
}

/**
 * Build a lookup map after category seeding (name + slug → id).
 * @param {import('@prisma/client').Prisma.TransactionClient} prismaTx
 * @param {string} businessId
 */
export async function buildProductCategoryIdMap(prismaTx, businessId) {
  const rows = await prismaTx.product_categories.findMany({
    where: { business_id: businessId, is_active: true },
    select: { id: true, name: true, slug: true },
  });

  const map = new Map();
  for (const row of rows) {
    if (row.name) map.set(String(row.name).trim().toLowerCase(), row.id);
    if (row.slug) map.set(String(row.slug).trim().toLowerCase(), row.id);
  }
  return map;
}

/**
 * @param {Map<string, string>} categoryMap
 * @param {string | null | undefined} categoryLabel
 */
export function lookupCategoryIdFromMap(categoryMap, categoryLabel) {
  const label = String(categoryLabel || '').trim();
  if (!label || !categoryMap?.size) return null;
  return (
    categoryMap.get(label.toLowerCase()) ||
    categoryMap.get(slugifyCategoryName(label).toLowerCase()) ||
    null
  );
}
