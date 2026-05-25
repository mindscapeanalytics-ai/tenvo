'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { actionSuccess, actionFailure } from '@/lib/actions/_shared/result';

async function checkAuth(businessId, permission = 'crm.manage_promotions', feature = 'promotions_crm') {
  const { session } = await withGuard(businessId, { permission, feature });
  return session;
}

/**
 * Get all promotions for a business
 */
export async function getPromotionsAction(businessId) {
  const client = await pool.connect();
  try {
    await checkAuth(businessId, 'crm.manage_promotions', 'promotions_crm');

    let result;
    try {
      result = await client.query(
        `SELECT p.*,
                COALESCE(
                  (SELECT json_agg(pp.product_id::text)
                   FROM promotion_products pp WHERE pp.promotion_id = p.id),
                  '[]'
                ) as product_ids
         FROM promotions p
         WHERE p.business_id = $1
         ORDER BY p.created_at DESC`,
        [businessId]
      );
    } catch (tableErr) {
      // Table may not exist yet
      if (tableErr.code === '42P01') {
        return actionSuccess({ promotions: [] });
      }
      throw tableErr;
    }

    return actionSuccess({ promotions: result.rows });
  } catch (error) {
    console.error('[getPromotionsAction]', error);
    return actionFailure('FETCH_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Create a promotion
 */
export async function createPromotionAction(businessId, data) {
  const client = await pool.connect();
  try {
    await checkAuth(businessId, 'crm.manage_promotions', 'promotions_crm');
    await client.query('BEGIN');

    const {
      name, description = '', type = 'percentage',
      value = 0, min_order = 0, max_discount = null,
      buy_qty = null, get_qty = null, get_discount = 100,
      bundle_price = null,
      start_date = null, end_date = null,
      usage_limit = null, per_customer_limit = null,
      applicable_products = 'all', product_ids = [],
      category_filter = null, is_active = true,
    } = data;

    const res = await client.query(
      `INSERT INTO promotions (
        id, business_id, name, description, type, value,
        is_percentage, min_order_amount, max_discount,
        buy_qty, get_qty, get_discount, bundle_price,
        starts_at, ends_at, usage_limit, per_customer_limit,
        applicable_products, category_filter, is_active,
        usage_count, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19,
        0, NOW(), NOW()
      ) RETURNING *`,
      [
        businessId, name, description, type, parseFloat(value) || 0,
        type === 'percentage', parseFloat(min_order) || 0, max_discount ? parseFloat(max_discount) : null,
        buy_qty ? parseInt(buy_qty) : null,
        get_qty ? parseInt(get_qty) : null,
        parseFloat(get_discount) || 100,
        bundle_price ? parseFloat(bundle_price) : null,
        start_date || null, end_date || null,
        usage_limit ? parseInt(usage_limit) : null,
        per_customer_limit ? parseInt(per_customer_limit) : null,
        applicable_products, category_filter || null, is_active,
      ]
    );

    const promotion = res.rows[0];

    // Link specific products if applicable
    if (applicable_products === 'products' && product_ids.length > 0) {
      for (const productId of product_ids) {
        await client.query(
          `INSERT INTO promotion_products (id, promotion_id, product_id)
           VALUES (gen_random_uuid(), $1, $2)
           ON CONFLICT DO NOTHING`,
          [promotion.id, productId]
        );
      }
    }

    await client.query('COMMIT');
    return actionSuccess({ promotion });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createPromotionAction]', error);
    return actionFailure('CREATE_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Update a promotion
 */
export async function updatePromotionAction(businessId, promotionId, data) {
  const client = await pool.connect();
  try {
    await checkAuth(businessId, 'crm.manage_promotions', 'promotions_crm');

    const {
      name, description, type, value, min_order, max_discount,
      buy_qty, get_qty, get_discount, bundle_price,
      start_date, end_date, usage_limit, per_customer_limit,
      applicable_products, category_filter, is_active,
    } = data;

    const res = await client.query(
      `UPDATE promotions SET
        name = $1, description = $2, type = $3, value = $4,
        is_percentage = $5, min_order_amount = $6, max_discount = $7,
        buy_qty = $8, get_qty = $9, get_discount = $10, bundle_price = $11,
        starts_at = $12, ends_at = $13, usage_limit = $14, per_customer_limit = $15,
        applicable_products = $16, category_filter = $17, is_active = $18,
        updated_at = NOW()
       WHERE id = $19 AND business_id = $20
       RETURNING *`,
      [
        name, description || '', type, parseFloat(value) || 0,
        type === 'percentage', parseFloat(min_order) || 0,
        max_discount ? parseFloat(max_discount) : null,
        buy_qty ? parseInt(buy_qty) : null,
        get_qty ? parseInt(get_qty) : null,
        parseFloat(get_discount) || 100,
        bundle_price ? parseFloat(bundle_price) : null,
        start_date || null, end_date || null,
        usage_limit ? parseInt(usage_limit) : null,
        per_customer_limit ? parseInt(per_customer_limit) : null,
        applicable_products || 'all', category_filter || null,
        is_active !== undefined ? is_active : true,
        promotionId, businessId,
      ]
    );

    if (res.rows.length === 0) {
      return actionFailure('NOT_FOUND', 'Promotion not found');
    }

    return actionSuccess({ promotion: res.rows[0] });
  } catch (error) {
    console.error('[updatePromotionAction]', error);
    return actionFailure('UPDATE_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Toggle promotion active status
 */
export async function togglePromotionAction(businessId, promotionId, isActive) {
  const client = await pool.connect();
  try {
    await checkAuth(businessId, 'crm.manage_promotions', 'promotions_crm');

    await client.query(
      `UPDATE promotions SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND business_id = $3`,
      [isActive, promotionId, businessId]
    );

    return actionSuccess({ message: `Promotion ${isActive ? 'activated' : 'paused'}` });
  } catch (error) {
    console.error('[togglePromotionAction]', error);
    return actionFailure('TOGGLE_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Delete a promotion
 */
export async function deletePromotionAction(businessId, promotionId) {
  const client = await pool.connect();
  try {
    await checkAuth(businessId, 'crm.manage_promotions', 'promotions_crm');

    await client.query(
      `DELETE FROM promotions WHERE id = $1 AND business_id = $2`,
      [promotionId, businessId]
    );

    return actionSuccess({ message: 'Promotion deleted' });
  } catch (error) {
    console.error('[deletePromotionAction]', error);
    return actionFailure('DELETE_ERROR', error.message);
  } finally {
    client.release();
  }
}
