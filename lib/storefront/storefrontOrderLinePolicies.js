import { isPharmacyElevatedStore } from '@/lib/storefront/pharmacyStorefront';
import { isPrescriptionRequiredProduct } from '@/lib/storefront/pharmacyProducts';
import {
  isFitnessBookableProduct,
  isFitnessElevatedStore,
} from '@/lib/storefront/fitnessStorefront';

/**
 * Load product rows needed for pharmacy Rx / fitness bookable policy checks.
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {string[]} productIds
 */
export async function loadStorefrontPolicyProducts(client, businessId, productIds) {
  const ids = [...new Set((productIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const res = await client.query(
    `SELECT id, name, description, category, domain_data
     FROM products
     WHERE business_id = $1::uuid
       AND id = ANY($2::uuid[])
       AND COALESCE(is_deleted, false) = false`,
    [businessId, ids]
  );

  return new Map(res.rows.map((row) => [String(row.id), row]));
}

/**
 * Reject prescription and fitness-bookable lines that must not go through online checkout.
 * Shared by cart validate and POST orders so UI cannot be the only gate.
 *
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {string | null | undefined} businessCategory
 * @param {Array<{ productId: string, name?: string }>} items
 * @returns {Promise<Array<{ productId: string, name?: string, message: string, removed?: boolean }>>}
 */
export async function collectStorefrontOrderLinePolicyIssues(
  client,
  businessId,
  businessCategory,
  items
) {
  const pharmacyStore = isPharmacyElevatedStore(businessCategory);
  const fitnessStore = isFitnessElevatedStore(businessCategory);
  if (!pharmacyStore && !fitnessStore) return [];

  const productMap = await loadStorefrontPolicyProducts(
    client,
    businessId,
    (items || []).map((item) => item.productId)
  );

  const issues = [];

  for (const item of items || []) {
    const product = productMap.get(String(item.productId));
    if (!product) continue;

    if (pharmacyStore && isPrescriptionRequiredProduct(product)) {
      issues.push({
        productId: item.productId,
        name: item.name || product.name,
        message: `${product.name} requires a valid prescription. Upload your Rx from the store contact page before ordering.`,
        removed: true,
      });
      continue;
    }

    if (fitnessStore && isFitnessBookableProduct(product)) {
      issues.push({
        productId: item.productId,
        name: item.name || product.name,
        message: `${product.name} is booked through the store contact or booking page, not online checkout.`,
        removed: true,
      });
    }
  }

  return issues;
}
