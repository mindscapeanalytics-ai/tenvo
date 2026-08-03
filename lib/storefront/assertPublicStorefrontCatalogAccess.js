import 'server-only';

import { cache } from 'react';
import pool from '@/lib/db';
import { actionFailure } from '@/lib/actions/_shared/result';
import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';

function parseSettingsJson(raw) {
  if (raw == null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }
  return {};
}

function isApprovalBlocked(approvalStatus) {
  const status = String(approvalStatus ?? '')
    .trim()
    .toLowerCase();
  if (!status) return false;
  return status !== 'approved' && status !== 'auto_approved';
}

function isStorefrontDisabledRow(row) {
  const settings = parseSettingsJson(row?.settings);
  return (
    isApprovalBlocked(row?.approval_status) ||
    row?.is_storefront_enabled === false ||
    settings.storefront?.enabled === false ||
    settings.enabled === false
  );
}

/**
 * Request-cached gate: public catalog actions must not serve disabled tenants by UUID alone.
 * @param {string} businessId
 * @returns {Promise<import('@/lib/actions/_shared/result').ActionResult | null>}
 */
export const assertPublicStorefrontCatalogAccess = cache(async (businessId) => {
  if (!businessId || !isStorefrontProductUuid(String(businessId))) {
    return actionFailure('INVALID_INPUT', 'Valid business ID is required');
  }

  const client = await pool.connect();
  try {
    let result;
    try {
      // Public enable flag + chrome live on business_settings (not businesses.settings).
      result = await client.query(
        `SELECT
           COALESCE(bs.is_storefront_enabled, true) AS is_storefront_enabled,
           bs.settings AS settings,
           b.approval_status,
           b.is_active
         FROM businesses b
         LEFT JOIN business_settings bs ON bs.business_id = b.id
         WHERE b.id = $1::uuid
         LIMIT 1`,
        [businessId]
      );
    } catch (err) {
      if (err?.code === '42P01' || err?.code === '42703') {
        result = await client.query(
          `SELECT
             true AS is_storefront_enabled,
             null AS settings,
             b.approval_status,
             b.is_active
           FROM businesses b
           WHERE b.id = $1::uuid
           LIMIT 1`,
          [businessId]
        );
      } else {
        throw err;
      }
    }

    const row = result.rows[0];
    if (!row || row.is_active === false) {
      return actionFailure('NOT_FOUND', 'Store not found');
    }
    if (isStorefrontDisabledRow(row)) {
      return actionFailure('STOREFRONT_DISABLED', 'This storefront is currently unavailable');
    }
    return null;
  } finally {
    client.release();
  }
});
