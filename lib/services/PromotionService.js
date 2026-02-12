import pool from '@/lib/db';
import { createModuleLogger } from './logging/logger';
import { recordAuditLog } from './audit/auditService';

const log = createModuleLogger('promotions');

/**
 * PromotionService
 * 
 * Handles the 2026 AI Revenue Engine's discount and promotion logic.
 * Supports:
 * - Simple discounts (Fixed/Percentage)
 * - BOGO (Buy X Get Y)
 * - Minimum order value thresholds
 * - AI-generated dynamic promotions
 */
export const PromotionService = {
    /**
     * Create a new promotion
     */
    async createPromotion(businessId, data, userId = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                name,
                description,
                type,
                value,
                is_percentage,
                starts_at,
                ends_at,
                min_order_amount = 0,
                max_discount = null,
                usage_limit = null,
                product_ids = [],
                is_ai_generated = false
            } = data;

            const res = await client.query(`
                INSERT INTO promotions (
                    id, business_id, name, description, type, value, is_percentage,
                    starts_at, ends_at, min_order_amount, max_discount, usage_limit,
                    is_ai_generated, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
                ) RETURNING id
            `, [
                businessId, name, description, type, value, is_percentage,
                starts_at, ends_at, min_order_amount, max_discount, usage_limit,
                is_ai_generated
            ]);

            const promotionId = res.rows[0].id;

            // Link products if applicable
            if (product_ids.length > 0) {
                for (const productId of product_ids) {
                    await client.query(`
                        INSERT INTO promotion_products (id, promotion_id, product_id)
                        VALUES (gen_random_uuid(), $1, $2)
                    `, [promotionId, productId]);
                }
            }

            await client.query('COMMIT');

            await recordAuditLog(businessId, {
                action: 'CREATE_PROMOTION',
                entity_type: 'promotion',
                entity_id: promotionId,
                description: `Created ${type} promotion: ${name}`,
                userId
            });

            log.info('Promotion created', { businessId, promotionId, type, name });
            return promotionId;
        } catch (error) {
            await client.query('ROLLBACK');
            log.error('Failed to create promotion', { error, businessId, data });
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Calculate and apply promotions to a list of items (cart/invoice)
     * 
     * @param {string} businessId
     * @param {Array} items - [{ product_id, quantity, unit_price }]
     * @param {number} subtotal
     * @returns {Promise<object>} { discount_amount, applied_promotions: [] }
     */
    async calculateAppliedDiscounts(businessId, items, subtotal) {
        const client = await pool.connect();
        try {
            // 1. Get all active promotions for this business
            const res = await client.query(`
                SELECT p.*, 
                       ARRAY(SELECT product_id::text FROM promotion_products WHERE promotion_id = p.id) as product_ids
                FROM promotions p
                WHERE p.business_id = $1
                  AND p.is_active = true
                  AND (p.starts_at IS NULL OR p.starts_at <= NOW())
                  AND (p.ends_at IS NULL OR p.ends_at >= NOW())
                  AND (p.usage_limit IS NULL OR p.usage_count < p.usage_limit)
                ORDER BY p.is_percentage ASC, p.value DESC -- Apply fixed amounts first, then percentages (common practice)
            `, [businessId]);

            const activePromotions = res.rows;
            let totalDiscount = 0;
            const applied = [];

            for (const promo of activePromotions) {
                // Check minimum order amount
                if (subtotal < parseFloat(promo.min_order_amount || 0)) continue;

                let discountForThisPromo = 0;

                if (promo.type === 'discount') {
                    if (promo.product_ids.length === 0) {
                        // Global discount
                        if (promo.is_percentage) {
                            discountForThisPromo = subtotal * (parseFloat(promo.value) / 100);
                        } else {
                            discountForThisPromo = parseFloat(promo.value);
                        }
                    } else {
                        // Product-specific discount
                        const eligibleItems = items.filter(item => promo.product_ids.includes(String(item.product_id)));
                        const eligibleSubtotal = eligibleItems.reduce((acc, item) => acc + (parseFloat(item.unit_price) * item.quantity), 0);

                        if (eligibleSubtotal > 0) {
                            if (promo.is_percentage) {
                                discountForThisPromo = eligibleSubtotal * (parseFloat(promo.value) / 100);
                            } else {
                                // Fixed discount per product is complex, usually it's per eligible subtotal or per unit
                                // Here we assume fixed amount off the specific group of products
                                discountForThisPromo = parseFloat(promo.value);
                            }
                        }
                    }
                }

                // Cap the discount if max_discount is set
                if (promo.max_discount && discountForThisPromo > parseFloat(promo.max_discount)) {
                    discountForThisPromo = parseFloat(promo.max_discount);
                }

                if (discountForThisPromo > 0) {
                    totalDiscount += discountForThisPromo;
                    applied.push({
                        id: promo.id,
                        name: promo.name,
                        amount: discountForThisPromo
                    });

                    // Note: In a real system, we'd check if promotions are stackable.
                    // For now, we apply them cumulatively.
                }
            }

            return {
                discount_amount: totalDiscount,
                applied_promotions: applied
            };
        } catch (error) {
            log.error('Discount Calculation Error', { error, businessId });
            return { discount_amount: 0, applied_promotions: [], error: error.message };
        } finally {
            client.release();
        }
    },

    /**
     * AI Prompt Helper: Get recommendations for promotions based on stock/sales
     * This is a "Thinking" tool for the AI agent
     */
    async getPromotionRecommendations(businessId) {
        const client = await pool.connect();
        try {
            // Get overstock items (stock > 2x max_stock or expiring soon)
            const overstockRes = await client.query(`
                SELECT id, name, sku, stock, min_stock, price, expiry_date
                FROM products
                WHERE business_id = $1
                  AND is_active = true
                  AND (
                    (stock > 0 AND expiry_date IS NOT NULL AND expiry_date < NOW() + INTERVAL '3 months')
                    OR (stock > 100 AND stock > min_stock * 5)
                  )
                LIMIT 5
            `, [businessId]);

            // Get slow moving items (no sales in 30 days but have stock)
            const slowMovingRes = await client.query(`
                SELECT p.id, p.name, p.sku, p.stock, p.price
                FROM products p
                LEFT JOIN invoice_items ii ON p.id = ii.product_id
                WHERE p.business_id = $1
                  AND p.stock > 10
                  AND p.is_active = true
                GROUP BY p.id
                HAVING MAX(ii.created_at) IS NULL OR MAX(ii.created_at) < NOW() - INTERVAL '30 days'
                LIMIT 5
            `, [businessId]);

            return {
                overstock: overstockRes.rows,
                slow_moving: slowMovingRes.rows,
                recommendations: [
                    {
                        strategy: 'Clearance',
                        reason: 'Expiring items or high overstock',
                        suggested_discount: '25-40%',
                        product_ids: overstockRes.rows.map(p => p.id)
                    },
                    {
                        strategy: 'Bundle',
                        reason: 'Slow moving inventory',
                        suggested_discount: 'Buy 2 Get 1 Free',
                        product_ids: slowMovingRes.rows.map(p => p.id)
                    }
                ]
            };
        } finally {
            client.release();
        }
    }
};
