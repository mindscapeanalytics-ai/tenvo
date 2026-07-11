'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { expandScanCandidates } from '@/lib/utils/barcodeUtils';

/**
 * Tenant-scoped product lookup by scan code (barcode, SKU, UUID, variant SKU).
 * Used when client-side catalog is partial or paginated.
 */
export async function lookupProductByScanCodeAction(businessId, code) {
  const trimmed = String(code || '').trim();
  if (!trimmed || !businessId) {
    return { success: false, error: 'Missing scan code or business' };
  }

  try {
    await withGuard(businessId, { permission: 'inventory.view' });
    const candidates = expandScanCandidates(trimmed);
    if (!candidates.length) {
      return { success: true, product: null };
    }

    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT ON (p.id)
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.price,
          p.cost_price,
          p.stock,
          p.min_stock,
          p.category,
          p.unit,
          p.tax_percent,
          p.brand,
          p.hsn_code,
          p.image_url,
          p.is_active,
          p.domain_data,
          p.business_id,
          pv.id AS matched_variant_id,
          pv.variant_sku AS matched_variant_sku
        FROM products p
        LEFT JOIN product_variants pv
          ON pv.product_id = p.id AND pv.business_id = p.business_id
        WHERE p.business_id = $1
          AND COALESCE(p.is_deleted, false) = false
          AND COALESCE(p.is_active, true) = true
          AND (
            LOWER(TRIM(COALESCE(p.barcode, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(p.sku, ''))) = ANY($2::text[])
            OR p.id::text = ANY($3::text[])
            OR (
              pv.id IS NOT NULL
              AND COALESCE(pv.is_deleted, false) = false
              AND LOWER(TRIM(COALESCE(pv.variant_sku, ''))) = ANY($2::text[])
            )
          )
        ORDER BY p.id
        LIMIT 1
      `;

      const lowerCandidates = candidates.map((c) => c.toLowerCase());
      const idCandidates = candidates;
      const result = await client.query(query, [
        businessId,
        lowerCandidates,
        idCandidates,
      ]);

      if (!result.rows.length) {
        return { success: true, product: null };
      }

      const row = result.rows[0];
      const {
        matched_variant_id: matchedVariantId,
        matched_variant_sku: matchedVariantSku,
        ...productRow
      } = row;

      const product = {
        ...productRow,
        price: productRow.price != null ? Number(productRow.price) : 0,
        cost_price: productRow.cost_price != null ? Number(productRow.cost_price) : null,
        stock: productRow.stock != null ? Number(productRow.stock) : 0,
        min_stock: productRow.min_stock != null ? Number(productRow.min_stock) : null,
        tax_percent: productRow.tax_percent != null ? Number(productRow.tax_percent) : null,
      };

      return {
        success: true,
        product,
        matchedVariantId: matchedVariantId || null,
        matchedVariantSku: matchedVariantSku || null,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('lookupProductByScanCodeAction:', error);
    return { success: false, error: error.message };
  }
}
