'use server';

import pool from '@/lib/db';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { withGuard } from '@/lib/rbac/serverGuard';
import { isTrustedAuthBypassActive } from '@/lib/actions/_shared/trustedAuthBypass';
import {
    SALES_TREND_UNIFIED_SQL,
    TOP_MOVING_PRODUCTS_UNIFIED_SQL,
    SALES_KPI_PERIOD_SQL,
    SALES_KPI_CATEGORY_PERIOD_SQL,
    SALES_COGS_PERIOD_SQL,
    RECENT_SALES_ACTIVITY_SQL,
    TOP_CUSTOMERS_UNIFIED_SQL,
    SALES_RETENTION_PERIOD_SQL,
    SALES_PRODUCT_CATEGORIES_SQL,
    mapSalesTrendRow,
    mapTopProductRow,
    mapTopCustomerRow,
} from '@/lib/analytics/salesInsights';
import { normalizeSalesPerformanceOptions } from '@/lib/analytics/salesPerformanceFilter';

/**
 * Dashboard KPI Server Action
 * Provides all key metrics for the main dashboard in a single query batch.
 * Optimized for performance, uses parallel CTEs to minimize round trips.
 * Zoho-competitive: Revenue, Expenses, Receivables, Payables, Inventory, Cash Flow.
 */

async function checkAuth(businessId, permission = 'sales.view') {
    if (isTrustedAuthBypassActive()) return null;
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Get comprehensive dashboard KPIs for a business
 * @param {string} businessId - Business UUID
 * @param {object} options - { period: 'today'|'week'|'month'|'quarter'|'year', dateFrom, dateTo }
 */
export async function getDashboardKPIs(businessId, options = {}) {
    try {
        // Nested callers (advanced snapshot / hub shell) use runWithTrustedAuthBypass after withGuard.
        await checkAuth(businessId, 'sales.view');

        const client = await pool.connect();
        try {
            const period = options.period || 'month';
            const now = new Date();
            let dateFrom, dateTo;

            // Explicit FilterContext / snapshot range always wins over named period defaults.
            if (options.dateFrom || options.dateTo) {
                dateFrom = options.dateFrom
                    ? new Date(options.dateFrom)
                    : new Date(now.getFullYear(), now.getMonth(), 1);
                dateTo = options.dateTo ? new Date(options.dateTo) : now;
            } else {
                // Period resolution
                switch (period) {
                    case 'today':
                        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        dateTo = now;
                        break;
                    case 'week':
                        dateFrom = new Date(now);
                        dateFrom.setDate(dateFrom.getDate() - 7);
                        dateTo = now;
                        break;
                    case 'month':
                        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
                        dateTo = now;
                        break;
                    case 'quarter':
                        dateFrom = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                        dateTo = now;
                        break;
                    case 'year':
                        dateFrom = new Date(now.getFullYear(), 0, 1);
                        dateTo = now;
                        break;
                    default:
                        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
                        dateTo = now;
                }
            }

            // Single optimized query with CTEs for all KPIs.
            // Column-minimal CTEs (no SELECT *) — aggregates only; avoids materializing full rows.
            // UNIFIED ORDER AGGREGATION: Combines invoices + POS + storefront orders
            const result = await client.query(`
                WITH period_invoices AS (
                    SELECT grand_total, status, payment_status
                    FROM invoices
                    WHERE business_id = $1
                      AND (is_deleted = false OR is_deleted IS NULL)
                      AND date BETWEEN $2 AND $3
                ),
                all_invoices AS (
                    SELECT grand_total, status, payment_status
                    FROM invoices
                    WHERE business_id = $1
                      AND (is_deleted = false OR is_deleted IS NULL)
                ),
                period_pos AS (
                    SELECT total_amount
                    FROM pos_transactions
                    WHERE business_id = $1
                      AND is_voided = false
                      AND LOWER(COALESCE(payment_status, '')) = 'completed'
                      AND created_at BETWEEN $2 AND $3
                ),
                period_storefront AS (
                    SELECT total_amount, status
                    FROM storefront_orders
                    WHERE business_id = $1
                      AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'refunded', 'voided')
                      AND created_at BETWEEN $2 AND $3
                ),
                period_restaurant AS (
                    SELECT total_amount, status
                    FROM restaurant_orders
                    WHERE business_id = $1
                      AND LOWER(COALESCE(status, '')) IN ('completed', 'served')
                      AND created_at BETWEEN $2 AND $3
                ),
                period_purchases AS (
                    SELECT total_amount, status
                    FROM purchases
                    WHERE business_id = $1
                      AND date BETWEEN $2 AND $3
                ),
                period_expenses AS (
                    SELECT amount
                    FROM expenses
                    WHERE business_id = $1
                      AND (is_deleted = false OR is_deleted IS NULL)
                      AND date BETWEEN $2 AND $3
                ),
                period_invoice_payments AS (
                    SELECT amount
                    FROM invoice_payments
                    WHERE business_id = $1
                      AND (is_deleted = false OR is_deleted IS NULL)
                      AND payment_date BETWEEN $2::date AND $3::date
                ),
                period_vendor_payments AS (
                    SELECT amount, payment_type
                    FROM payments
                    WHERE business_id = $1
                      AND (is_deleted = false OR is_deleted IS NULL)
                      AND payment_date BETWEEN $2::date AND $3::date
                      AND LOWER(COALESCE(payment_type, '')) = 'payment'
                )
                SELECT
                    -- Revenue KPIs (UNIFIED: invoices + POS + storefront + restaurant)
                    (
                        (SELECT COALESCE(SUM(grand_total), 0) FROM period_invoices 
                         WHERE status NOT IN ('draft', 'voided'))
                        + (SELECT COALESCE(SUM(total_amount), 0) FROM period_pos)
                        + (SELECT COALESCE(SUM(total_amount), 0) FROM period_storefront)
                        + (SELECT COALESCE(SUM(total_amount), 0) FROM period_restaurant)
                    ) as total_revenue,
                    -- Order count (UNIFIED: all four ledgers)
                    (
                        (SELECT COUNT(*) FROM period_invoices 
                         WHERE status NOT IN ('draft', 'voided'))
                        + (SELECT COUNT(*) FROM period_pos)
                        + (SELECT COUNT(*) FROM period_storefront)
                        + (SELECT COUNT(*) FROM period_restaurant)
                    ) as total_order_count,
                    -- Ledger breakdown for reporting
                    (SELECT COUNT(*) FROM period_invoices 
                     WHERE status NOT IN ('draft', 'voided')) as invoice_count,
                    (SELECT COUNT(*) FROM period_pos) as pos_count,
                    (SELECT COUNT(*) FROM period_storefront) as storefront_count,
                    (SELECT COUNT(*) FROM period_restaurant) as restaurant_count,
                    (SELECT COALESCE(SUM(grand_total), 0) FROM period_invoices 
                     WHERE status = 'draft') as draft_revenue,
                    (SELECT COUNT(*) FROM period_invoices 
                     WHERE status = 'draft') as draft_count,
                     
                    -- Receivables
                    (SELECT COALESCE(SUM(grand_total), 0) FROM all_invoices 
                     WHERE payment_status IN ('unpaid', 'partial')
                       AND status NOT IN ('draft', 'voided')) as total_receivables,
                    (SELECT COUNT(*) FROM all_invoices 
                     WHERE payment_status IN ('unpaid', 'partial')
                       AND status NOT IN ('draft', 'voided')) as receivable_count,
                    (SELECT COALESCE(SUM(grand_total), 0) FROM all_invoices 
                     WHERE status = 'overdue') as overdue_amount,
                    (SELECT COUNT(*) FROM all_invoices 
                     WHERE status = 'overdue') as overdue_count,
                    
                    -- Payments Collected (AR receipts from invoice_payments; vendor outflows from payments)
                    (SELECT COALESCE(SUM(amount), 0) FROM period_invoice_payments) as payments_received,
                    (SELECT COALESCE(SUM(amount), 0) FROM period_vendor_payments) as payments_made,
                     
                    -- Purchases
                    (SELECT COALESCE(SUM(total_amount), 0) FROM period_purchases 
                     WHERE status != 'cancelled') as total_purchases,
                    (SELECT COUNT(*) FROM period_purchases 
                     WHERE status != 'cancelled') as purchase_count,
                     
                    -- Payables
                    (SELECT COALESCE(SUM(total_amount), 0) FROM purchases 
                     WHERE business_id = $1
                       AND payment_status IN ('pending', 'partial')) as total_payables,
                     
                    -- Expenses
                    (SELECT COALESCE(SUM(amount), 0) FROM period_expenses) as total_expenses,
                    (SELECT COUNT(*) FROM period_expenses) as expense_count,
                    
                    -- Inventory (display stock: sellable location sum when rows exist, else headline)
                    (SELECT COUNT(*) FROM products 
                     WHERE business_id = $1 AND is_deleted = false AND is_active = true) as active_products,
                    (SELECT COUNT(*) FROM products p
                     WHERE p.business_id = $1 AND p.is_deleted = false AND p.is_active = true
                       AND (
                         CASE
                           WHEN EXISTS (
                             SELECT 1 FROM product_stock_locations psl
                             WHERE psl.product_id = p.id AND psl.business_id = p.business_id
                               AND LOWER(COALESCE(psl.state, 'sellable')) = 'sellable'
                           ) THEN (
                             SELECT COALESCE(SUM(COALESCE(psl.quantity, 0)), 0)
                             FROM product_stock_locations psl
                             WHERE psl.product_id = p.id AND psl.business_id = p.business_id
                               AND LOWER(COALESCE(psl.state, 'sellable')) = 'sellable'
                           )
                           ELSE COALESCE(p.stock, 0)
                         END
                       ) <= COALESCE(p.min_stock, p.reorder_point, 0)
                    ) as low_stock_count,
                    (SELECT COALESCE(SUM(
                      (
                        CASE
                          WHEN EXISTS (
                            SELECT 1 FROM product_stock_locations psl
                            WHERE psl.product_id = p.id AND psl.business_id = p.business_id
                              AND LOWER(COALESCE(psl.state, 'sellable')) = 'sellable'
                          ) THEN (
                            SELECT COALESCE(SUM(COALESCE(psl.quantity, 0)), 0)
                            FROM product_stock_locations psl
                            WHERE psl.product_id = p.id AND psl.business_id = p.business_id
                              AND LOWER(COALESCE(psl.state, 'sellable')) = 'sellable'
                          )
                          ELSE COALESCE(p.stock, 0)
                        END
                      ) * COALESCE(p.cost_price, 0)
                    ), 0) FROM products p
                     WHERE p.business_id = $1 AND p.is_deleted = false AND p.is_active = true) as inventory_value,
                    (SELECT COALESCE(SUM(
                      CASE
                        WHEN EXISTS (
                          SELECT 1 FROM product_stock_locations psl
                          WHERE psl.product_id = p.id AND psl.business_id = p.business_id
                            AND LOWER(COALESCE(psl.state, 'sellable')) = 'sellable'
                        ) THEN (
                          SELECT COALESCE(SUM(COALESCE(psl.quantity, 0)), 0)
                          FROM product_stock_locations psl
                          WHERE psl.product_id = p.id AND psl.business_id = p.business_id
                            AND LOWER(COALESCE(psl.state, 'sellable')) = 'sellable'
                        )
                        ELSE COALESCE(p.stock, 0)
                      END
                    ), 0) FROM products p
                     WHERE p.business_id = $1 AND p.is_deleted = false AND p.is_active = true) as total_stock_units,

                    -- Customers & Vendors
                    (SELECT COUNT(*) FROM customers 
                     WHERE business_id = $1 AND is_active = true AND is_deleted = false) as active_customers,
                    (SELECT COUNT(*) FROM vendors 
                     WHERE business_id = $1 AND is_active = true AND is_deleted = false) as active_vendors
            `, [businessId, dateFrom, dateTo]);

            const kpi = result.rows[0];

            // Compute derived KPIs — gross profit = revenue − sold COGS (not purchases PO $).
            const totalRevenue = Number(kpi.total_revenue || 0);
            const totalExpenses = Number(kpi.total_expenses || 0);
            const totalPurchases = Number(kpi.total_purchases || 0);
            const fromIso = dateFrom.toISOString().slice(0, 10);
            const toIso = dateTo.toISOString().slice(0, 10);
            const cogsRes = await client.query(SALES_COGS_PERIOD_SQL, [
                businessId,
                fromIso,
                toIso,
                'all',
                null,
            ]);
            const cogsTotal = Number(cogsRes.rows[0]?.cogs_total || 0);
            const grossProfit = totalRevenue - cogsTotal;
            const netProfit = grossProfit - totalExpenses;
            
            // Use unified order count (invoices + POS + storefront + restaurant)
            const totalOrderCount = Number(kpi.total_order_count || 0);
            const invoiceCount = Number(kpi.invoice_count || 0);
            const posCount = Number(kpi.pos_count || 0);
            const storefrontCount = Number(kpi.storefront_count || 0);
            const restaurantCount = Number(kpi.restaurant_count || 0);

            return await actionSuccess({
                period: { from: dateFrom.toISOString(), to: dateTo.toISOString(), label: period },
                revenue: {
                    total: totalRevenue,
                    // Use unified order count for accurate metrics
                    orderCount: totalOrderCount,
                    // Keep invoice-specific counts for backward compatibility
                    invoiceCount: invoiceCount,
                    draftTotal: Number(kpi.draft_revenue || 0),
                    draftCount: Number(kpi.draft_count || 0),
                    // Avg order value across all channels
                    avgOrder: totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount * 100) / 100 : 0,
                    // Legacy avg invoice (invoice channel only)
                    avgInvoice: invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount * 100) / 100 : 0,
                },
                orders: {
                    // Unified order count across all sales channels
                    total: totalOrderCount,
                    // Breakdown by ledger for transparency
                    invoices: invoiceCount,
                    pos: posCount,
                    storefront: storefrontCount,
                    restaurant: restaurantCount,
                },
                receivables: {
                    total: Number(kpi.total_receivables || 0),
                    count: Number(kpi.receivable_count || 0),
                    overdueTotal: Number(kpi.overdue_amount || 0),
                    overdueCount: Number(kpi.overdue_count || 0),
                },
                payments: {
                    received: Number(kpi.payments_received || 0),
                    made: Number(kpi.payments_made || 0),
                    netCashFlow: Number(kpi.payments_received || 0) - Number(kpi.payments_made || 0),
                },
                purchases: {
                    total: totalPurchases,
                    count: Number(kpi.purchase_count || 0),
                    payablesTotal: Number(kpi.total_payables || 0),
                },
                expenses: {
                    total: totalExpenses,
                    count: Number(kpi.expense_count || 0),
                },
                profitability: {
                    grossProfit,
                    netProfit,
                    grossMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0,
                    netMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0,
                },
                inventory: {
                    activeProducts: Number(kpi.active_products || 0),
                    lowStockCount: Number(kpi.low_stock_count || 0),
                    totalValue: Number(kpi.inventory_value || 0),
                    totalStockUnits: Number(kpi.total_stock_units || 0),
                },
                entities: {
                    activeCustomers: Number(kpi.active_customers || 0),
                    activeVendors: Number(kpi.active_vendors || 0),
                },
            });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Dashboard KPI Error:', e);
        return await actionFailure('DASHBOARD_KPI_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get recent activity feed for the dashboard
 * Shows latest invoices, payments, purchases in chronological order
 */
export async function getRecentActivity(businessId, limit = 20) {
    try {
        await checkAuth(businessId, 'sales.view');

        const client = await pool.connect();
        try {
            const result = await client.query(`
                (
                    SELECT 
                        'invoice' as type, id, invoice_number as reference,
                        grand_total as amount, status, customer_id as entity_id,
                        c.name as entity_name, date as activity_date, created_at
                    FROM invoices i
                    LEFT JOIN customers c ON i.customer_id = c.id
                    WHERE i.business_id = $1
                      AND (i.is_deleted = false OR i.is_deleted IS NULL)
                    ORDER BY i.created_at DESC LIMIT $2
                )
                UNION ALL
                (
                    SELECT 
                        'payment' as type, p.id, p.payment_mode as reference,
                        p.amount, COALESCE(p.status, 'active') as status,
                        COALESCE(p.customer_id, p.vendor_id) as entity_id,
                        COALESCE(c.name, v.name) as entity_name,
                        p.payment_date as activity_date, p.created_at
                    FROM payments p
                    LEFT JOIN customers c ON p.customer_id = c.id
                    LEFT JOIN vendors v ON p.vendor_id = v.id
                    WHERE p.business_id = $1
                      AND (p.is_deleted = false OR p.is_deleted IS NULL)
                    ORDER BY p.created_at DESC LIMIT $2
                )
                UNION ALL
                (
                    SELECT 
                        'purchase' as type, pu.id, pu.purchase_number as reference,
                        pu.total_amount as amount, pu.status,
                        pu.vendor_id as entity_id, v.name as entity_name,
                        pu.date as activity_date, pu.created_at
                    FROM purchases pu
                    LEFT JOIN vendors v ON pu.vendor_id = v.id
                    WHERE pu.business_id = $1
                    ORDER BY pu.created_at DESC LIMIT $2
                )
                ORDER BY created_at DESC
                LIMIT $2
            `, [businessId, limit]);

            return await actionSuccess({ activities: result.rows });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Recent Activity Error:', e);
        return await actionFailure('RECENT_ACTIVITY_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get sales trend data for charts (daily/weekly/monthly aggregation)
 */
export async function getSalesTrend(businessId, options = {}) {
    try {
        await checkAuth(businessId, 'sales.view');

        const client = await pool.connect();
        try {
            const groupBy = options.groupBy || 'day'; // day, week, month
            const days = options.days || 30;
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            let dateFormat;
            switch (groupBy) {
                case 'week':  dateFormat = `TO_CHAR(date_trunc('week', date), 'YYYY-MM-DD')`; break;
                case 'month': dateFormat = `TO_CHAR(date_trunc('month', date), 'YYYY-MM')`; break;
                default:      dateFormat = `TO_CHAR(date, 'YYYY-MM-DD')`; break;
            }

            const result = await client.query(`
                SELECT 
                    ${dateFormat} as period,
                    COALESCE(SUM(grand_total), 0) as revenue,
                    COUNT(*) as invoice_count
                FROM invoices
                WHERE business_id = $1
                  AND (is_deleted = false OR is_deleted IS NULL)
                  AND status NOT IN ('draft', 'voided')
                  AND date >= $2
                GROUP BY 1
                ORDER BY 1 ASC
            `, [businessId, dateFrom]);

            return await actionSuccess({ trend: result.rows, groupBy, days });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Sales Trend Error:', e);
        return await actionFailure('SALES_TREND_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get top customers by revenue
 */
export async function getTopCustomers(businessId, limit = 10) {
    try {
        await checkAuth(businessId, 'sales.view');

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    c.id, c.name, c.email, c.phone,
                    c.outstanding_balance,
                    COUNT(i.id) as total_invoices,
                    COALESCE(SUM(i.grand_total), 0) as total_revenue,
                    MAX(i.date) as last_invoice_date
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id 
                    AND (i.is_deleted = false OR i.is_deleted IS NULL)
                    AND i.status NOT IN ('draft', 'voided')
                WHERE c.business_id = $1 AND c.is_active = true AND c.is_deleted = false
                GROUP BY c.id, c.name, c.email, c.phone, c.outstanding_balance
                ORDER BY total_revenue DESC
                LIMIT $2
            `, [businessId, limit]);

            return await actionSuccess({ customers: result.rows });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Top Customers Error:', e);
        return await actionFailure('TOP_CUSTOMERS_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get top selling products
 */
export async function getTopProducts(businessId, limit = 10) {
    try {
        await checkAuth(businessId, 'sales.view');

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    p.id, p.name, p.sku, p.stock, p.price as selling_price, p.cost_price,
                    COUNT(ii.id) as times_sold,
                    COALESCE(SUM(ii.quantity), 0) as total_qty_sold,
                    COALESCE(SUM(ii.total_amount), 0) as total_revenue
                FROM products p
                LEFT JOIN invoice_items ii ON p.id = ii.product_id
                LEFT JOIN invoices i ON ii.invoice_id = i.id 
                    AND (i.is_deleted = false OR i.is_deleted IS NULL)
                    AND i.status NOT IN ('draft', 'voided')
                WHERE p.business_id = $1 AND p.is_active = true AND p.is_deleted = false
                GROUP BY p.id, p.name, p.sku, p.stock, p.price, p.cost_price
                ORDER BY total_revenue DESC
                LIMIT $2
            `, [businessId, limit]);

            return await actionSuccess({ products: result.rows });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Top Products Error:', e);
        return await actionFailure('TOP_PRODUCTS_FAILED', await getErrorMessage(e));
    }
}

function pctGrowth(cur, prev) {
    if (prev > 0) return ((cur - prev) / prev) * 100;
    return cur > 0 ? 100 : 0;
}

/**
 * Unified sales performance for the hub Sales tab, invoices, POS, and storefront.
 * @param {string} businessId
 * @param {{
 *   from?: unknown;
 *   to?: unknown;
 *   channel?: unknown;
 *   category?: unknown;
 *   topLimit?: number;
 * }} [options]
 */
export async function getSalesPerformanceAction(businessId, options = {}) {
    try {
        await checkAuth(businessId, 'sales.view');

        const client = await pool.connect();
        try {
            const opts = normalizeSalesPerformanceOptions(options);
            const {
                from: curFrom,
                to: curTo,
                prevFrom,
                prevTo,
                channel,
                category,
                topLimit,
                categoryScoped,
            } = opts;
            const categoryParam = category || null;

            const kpiSql = categoryScoped ? SALES_KPI_CATEGORY_PERIOD_SQL : SALES_KPI_PERIOD_SQL;
            const kpiParams = categoryScoped
                ? [businessId, curFrom, curTo, channel, categoryParam]
                : [businessId, curFrom, curTo, channel];
            const prevKpiParams = categoryScoped
                ? [businessId, prevFrom, prevTo, channel, categoryParam]
                : [businessId, prevFrom, prevTo, channel];

            const [
                trendRes,
                topRes,
                curKpiRes,
                prevKpiRes,
                curCogsRes,
                prevCogsRes,
                recentRes,
                retentionRes,
                topCustRes,
                categoriesRes,
            ] = await Promise.all([
                client.query(SALES_TREND_UNIFIED_SQL, [
                    businessId,
                    curFrom,
                    curTo,
                    channel,
                    categoryParam,
                ]),
                client.query(TOP_MOVING_PRODUCTS_UNIFIED_SQL, [
                    businessId,
                    topLimit,
                    curFrom,
                    curTo,
                    channel,
                    categoryParam,
                ]),
                client.query(kpiSql, kpiParams),
                client.query(kpiSql, prevKpiParams),
                client.query(SALES_COGS_PERIOD_SQL, [
                    businessId,
                    curFrom,
                    curTo,
                    channel,
                    categoryParam,
                ]),
                client.query(SALES_COGS_PERIOD_SQL, [
                    businessId,
                    prevFrom,
                    prevTo,
                    channel,
                    categoryParam,
                ]),
                client.query(RECENT_SALES_ACTIVITY_SQL, [
                    businessId,
                    8,
                    curFrom,
                    curTo,
                    channel,
                ]),
                categoryScoped
                    ? Promise.resolve({ rows: [{ repeat_customers: 0, total_customers: 0 }] })
                    : client.query(SALES_RETENTION_PERIOD_SQL, [
                          businessId,
                          curFrom,
                          curTo,
                          channel,
                      ]),
                client.query(TOP_CUSTOMERS_UNIFIED_SQL, [
                    businessId,
                    5,
                    curFrom,
                    curTo,
                    channel,
                ]),
                client.query(SALES_PRODUCT_CATEGORIES_SQL, [businessId]),
            ]);

            const cur = curKpiRes.rows[0] || {};
            const prev = prevKpiRes.rows[0] || {};
            const grossTotal = parseFloat(cur.gross_total) || 0;
            const prevGross = parseFloat(prev.gross_total) || 0;
            const orderCount = parseInt(cur.order_count, 10) || 0;
            const prevOrderCount = parseInt(prev.order_count, 10) || 0;
            const collectedRaw = cur.collected_total;
            const collected =
                categoryScoped || collectedRaw == null ? null : parseFloat(collectedRaw) || 0;
            const outstanding =
                categoryScoped || collected == null
                    ? null
                    : Math.max(0, grossTotal - collected);
            const avgOrder = orderCount > 0 ? grossTotal / orderCount : 0;
            const prevAvg = prevOrderCount > 0 ? prevGross / prevOrderCount : 0;
            const cogsTotal = parseFloat(curCogsRes.rows[0]?.cogs_total) || 0;
            const prevCogs = parseFloat(prevCogsRes.rows[0]?.cogs_total) || 0;
            // Gross profit from line qty × product cost_price (not a fixed margin heuristic).
            const profitEst = grossTotal - cogsTotal;
            const prevProfitEst = prevGross - prevCogs;
            const marginPct = grossTotal > 0 ? (profitEst / grossTotal) * 100 : 0;
            const activeCustomers = parseInt(cur.active_customers, 10) || 0;
            const prevActiveCustomers = parseInt(prev.active_customers, 10) || 0;

            const repeat = parseInt(retentionRes.rows[0]?.repeat_customers || 0, 10);
            const totalCust = parseInt(retentionRes.rows[0]?.total_customers || 0, 10);
            const retentionRate = categoryScoped
                ? null
                : totalCust > 0
                  ? Math.round((repeat / totalCust) * 100)
                  : 0;

            return await actionSuccess({
                meta: {
                    from: curFrom,
                    to: curTo,
                    channel,
                    category: categoryParam,
                    categoryScoped,
                },
                categories: (categoriesRes.rows || []).map((r) => r.category).filter(Boolean),
                salesTrend: trendRes.rows.map(mapSalesTrendRow),
                topProducts: topRes.rows.map(mapTopProductRow),
                topCustomers: topCustRes.rows.map(mapTopCustomerRow),
                recentActivity: recentRes.rows.map((row) => ({
                    source: row.source,
                    id: row.id,
                    ref: row.ref,
                    party: row.party,
                    amount: parseFloat(row.amount) || 0,
                    paymentStatus: row.payment_status,
                    status: row.status,
                    date: row.occurred_at,
                })),
                kpi: {
                    grossTotal,
                    orderCount,
                    avgOrder,
                    collected,
                    outstanding,
                    cogsTotal,
                    profitEst,
                    marginPct,
                    profitBasis: 'cost',
                    activeCustomers,
                    retentionRate,
                    categoryScoped,
                    growth: {
                        revenue: pctGrowth(grossTotal, prevGross),
                        count: pctGrowth(orderCount, prevOrderCount),
                        avg: pctGrowth(avgOrder, prevAvg),
                        customers: pctGrowth(activeCustomers, prevActiveCustomers),
                        profit: pctGrowth(profitEst, prevProfitEst),
                        retention: 0,
                    },
                },
            });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Sales Performance Error:', e);
        return await actionFailure('SALES_PERFORMANCE_FAILED', await getErrorMessage(e));
    }
}
