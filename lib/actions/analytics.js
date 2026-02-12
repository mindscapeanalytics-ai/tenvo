'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId);
    }
    return session;
}

/**
 * Get Monthly Sales Trend (Last 6 Months)
 * Optimized SQL Aggregation
 */
export async function getSalesTrendAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // Postgres Series generation for last 6 months to ensure we have checking for empty months
            const result = await client.query(`
                WITH months AS (
                    SELECT generate_series(
                        date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
                        date_trunc('month', CURRENT_DATE),
                        '1 month'::interval
                    ) as month
                )
                SELECT 
                    to_char(m.month, 'Mon') as date,
                    COALESCE(SUM(i.grand_total), 0) as sales,
                    COALESCE(COUNT(i.id), 0) as count
                FROM months m
                LEFT JOIN invoices i ON date_trunc('month', i.date) = m.month 
                    AND i.business_id = $1 
                    AND i.status != 'cancelled'
                GROUP BY m.month
                ORDER BY m.month ASC
            `, [businessId]);

            return {
                success: true,
                data: result.rows.map(row => ({
                    date: row.date,
                    revenue: parseFloat(row.sales),
                    profit: parseFloat(row.sales) * 0.2, // Estimated 20% margin until we check COGS
                    sales: parseInt(row.count)
                }))
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Sales Trend Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get Top Moving Products (Revenue & Volume)
 */
export async function getTopProductsAction(businessId, limit = 5) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.category,
                    COALESCE(SUM(ii.quantity), 0) as volume,
                    COALESCE(SUM(ii.amount), 0) as revenue
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                JOIN products p ON ii.product_id = p.id
                WHERE i.business_id = $1 
                  AND i.status != 'cancelled'
                  AND i.date >= (CURRENT_DATE - INTERVAL '6 months') -- Last 6 months trend
                GROUP BY p.id, p.name, p.category
                ORDER BY revenue DESC
                LIMIT $2
            `, [businessId, limit]);

            return {
                success: true,
                data: result.rows.map(row => ({
                    name: row.name,
                    value: parseFloat(row.revenue), // Reusing 'value' for charts
                    volume: parseInt(row.volume),
                    category: row.category
                }))
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Top Products Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get Category Distribution (Asset Value)
 */
export async function getCategoryDistributionAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    COALESCE(category, 'Uncategorized') as name,
                    COUNT(*) as count,
                    COALESCE(SUM(stock * price), 0) as value
                FROM products
                WHERE business_id = $1
                GROUP BY category
                ORDER BY value DESC
                LIMIT 6
            `, [businessId]);

            return {
                success: true,
                data: result.rows.map(row => ({
                    name: row.name,
                    value: parseInt(row.count), // Count for Pie Chart
                    assetValue: parseFloat(row.value)
                }))
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Category Dist Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get KPI Metrics (Growth, Retention, Asset)
 */
export async function getKPIMetricsAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // 1. Inventory Asset Value
            const inventoryRes = await client.query(`
                SELECT COALESCE(SUM(stock * price), 0) as total_value 
                FROM products WHERE business_id = $1
            `, [businessId]);

            // 2. Growth (Current Month vs Last Month)
            const growthRes = await client.query(`
                WITH monthly_sales AS (
                    SELECT 
                        date_trunc('month', date) as month,
                        SUM(grand_total) as total
                    FROM invoices
                    WHERE business_id = $1 AND status != 'cancelled'
                      AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                    GROUP BY month
                )
                SELECT 
                    (SELECT total FROM monthly_sales WHERE month = date_trunc('month', CURRENT_DATE)) as current_month,
                    (SELECT total FROM monthly_sales WHERE month = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')) as last_month
            `, [businessId]);

            const current = parseFloat(growthRes.rows[0]?.current_month || 0);
            const last = parseFloat(growthRes.rows[0]?.last_month || 0);

            let growthPercent = 0;
            if (last > 0) {
                growthPercent = ((current - last) / last) * 100;
            } else if (current > 0) {
                growthPercent = 100;
            }

            // 3. Customer Retention (Repeat Customers)
            // Customers with more than 1 invoice
            const retentionRes = await client.query(`
                WITH customer_counts AS (
                    SELECT customer_id, COUNT(*) as inv_count
                    FROM invoices
                    WHERE business_id = $1 AND customer_id IS NOT NULL
                    GROUP BY customer_id
                )
                SELECT 
                    COUNT(*) FILTER (WHERE inv_count > 1) as repeat_customers,
                    COUNT(*) as total_active_customers
                FROM customer_counts
            `, [businessId]);

            const repeat = parseInt(retentionRes.rows[0]?.repeat_customers || 0);
            const total = parseInt(retentionRes.rows[0]?.total_active_customers || 0);
            const retentionRate = total > 0 ? (repeat / total) * 100 : 0;

            return {
                success: true,
                data: {
                    inventoryAsset: parseFloat(inventoryRes.rows[0].total_value),
                    growth: {
                        value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`,
                        trend: growthPercent >= 0 ? 'up' : 'down'
                    },
                    retention: `${retentionRate.toFixed(0)}%`
                }
            };

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('KPI Metrics Error:', error);
        return { success: false, error: error.message };
    }
}

import { AIOrderForecaster } from '@/lib/services/ai/forecasting';

/**
 * Get Demand Forecast Data
 * Calculates sales velocity and integrates AI forecasting logic
 */
export async function getDemandForecastAction(businessId, intelligence = {}, useAI = true) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // 1. Get products and their last 6 months of sales aggregates
            const result = await client.query(`
                SELECT 
                    p.id, p.name, p.sku, p.stock, p.category, p.reorder_point,
                    COALESCE(SUM(ii.quantity), 0) as total_sold,
                    to_char(date_trunc('month', i.date), 'YYYY-MM') as month_key
                FROM products p
                LEFT JOIN invoice_items ii ON p.id = ii.product_id
                LEFT JOIN invoices i ON ii.invoice_id = i.id 
                    AND i.status != 'cancelled'
                    AND i.date >= (CURRENT_DATE - INTERVAL '6 months')
                WHERE p.business_id = $1 AND p.is_active = true
                GROUP BY p.id, p.name, p.sku, p.stock, p.category, p.reorder_point, month_key
                ORDER BY p.id, month_key DESC
            `, [businessId]);

            const productMap = {};
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            result.rows.forEach(row => {
                if (!productMap[row.id]) {
                    productMap[row.id] = {
                        id: row.id,
                        name: row.name,
                        sku: row.sku,
                        stock: parseFloat(row.stock),
                        reorder_point: parseFloat(row.reorder_point || 0),
                        history: [0, 0, 0, 0, 0, 0],
                        rawHistory: [] // For AI
                    };
                }

                if (row.month_key) {
                    const [y, m] = row.month_key.split('-').map(Number);
                    const monthDiff = (currentYear - y) * 12 + (currentMonth - (m - 1));
                    if (monthDiff >= 0 && monthDiff < 6) {
                        productMap[row.id].history[5 - monthDiff] = parseFloat(row.total_sold);
                        productMap[row.id].rawHistory.push({ date: row.month_key, quantity: parseFloat(row.total_sold) });
                    }
                }
            });

            const products = Object.values(productMap);
            const forecastData = [];

            // 2. Process forecasts (Mix of AI and WMA)
            for (const p of products) {
                let forecast;

                if (useAI && p.rawHistory.length > 0) {
                    // Use AI for deeper insights
                    const aiResult = await AIOrderForecaster.forecastDemand(businessId, p, p.rawHistory);
                    forecast = {
                        qty: aiResult.forecastedQuantity,
                        confidence: aiResult.confidenceScore,
                        insight: aiResult.reasoning,
                        isAi: aiResult.confidenceScore > 0.5
                    };
                } else {
                    // Fallback to WMA
                    const weights = [0.05, 0.1, 0.15, 0.2, 0.25, 0.25];
                    const wma = p.history.reduce((acc, val, i) => acc + (val * weights[i]), 0);
                    forecast = {
                        qty: Math.ceil(wma),
                        confidence: 0.5,
                        insight: 'Calculated using historical moving average.',
                        isAi: false
                    };
                }

                const dailyDemand = forecast.qty / 30;
                const leadTime = intelligence.leadTime || 7;
                const safetyFactor = intelligence.seasonality === 'high' ? 2.0 : 1.5;
                const safetyStock = Math.ceil(dailyDemand * leadTime * safetyFactor);
                const recommendedStock = Math.ceil(forecast.qty + safetyStock);

                const trend = p.history[5] > p.history[4] ? 'up' : 'down';
                const priority = p.stock < recommendedStock * 0.4 ? 'high' : 'normal';

                forecastData.push({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    current: p.stock,
                    forecast: forecast.qty,
                    recommended: recommendedStock,
                    confidence: forecast.confidence,
                    insight: forecast.insight,
                    isAi: forecast.isAi,
                    trend,
                    priority,
                    variance: Math.abs(p.stock - recommendedStock)
                });
            }

            // 3. Sort and filter for dashboard relevance
            forecastData.sort((a, b) => {
                if (a.priority === 'high' && b.priority !== 'high') return -1;
                if (b.priority === 'high' && a.priority !== 'high') return 1;
                return b.variance - a.variance;
            });

            return { success: true, data: forecastData.slice(0, 10) };

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Forecast Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get Dashboard Metrics (Consolidated)
 * Single source of truth for main dashboard KPIs
 */
export async function getDashboardMetricsAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // 1. Revenue (from GL - Revenue accounts)
            const revenueRes = await client.query(`
                SELECT COALESCE(SUM(e.credit - e.debit), 0) as total_revenue
                FROM gl_entries e
                JOIN gl_accounts a ON e.account_id = a.id
                WHERE a.business_id = $1 
                  AND a.type = 'Revenue'
                  AND e.transaction_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
            `, [businessId]);

            // 2. Orders Count (Active invoices only)
            const ordersRes = await client.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status NOT IN ('cancelled', 'draft')) as active_orders,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                    COUNT(*) FILTER (WHERE status = 'paid') as paid_orders
                FROM invoices
                WHERE business_id = $1
                  AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
            `, [businessId]);

            // 3. Products Count (Active only)
            const productsRes = await client.query(`
                SELECT COUNT(*) as active_products
                FROM products
                WHERE business_id = $1 AND is_active = true
            `, [businessId]);

            // 4. Growth (Current vs Last Month Revenue)
            const growthRes = await client.query(`
                WITH monthly_revenue AS (
                    SELECT 
                        date_trunc('month', e.transaction_date) as month,
                        SUM(e.credit - e.debit) as revenue
                    FROM gl_entries e
                    JOIN gl_accounts a ON e.account_id = a.id
                    WHERE a.business_id = $1 
                      AND a.type = 'Revenue'
                      AND e.transaction_date >= date_trunc('month', CURRENT_DATE - INTERVAL '2 months')
                    GROUP BY month
                )
                SELECT 
                    (SELECT revenue FROM monthly_revenue WHERE month = date_trunc('month', CURRENT_DATE)) as current_month,
                    (SELECT revenue FROM monthly_revenue WHERE month = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')) as last_month
            `, [businessId]);

            const currentRevenue = parseFloat(growthRes.rows[0]?.current_month || 0);
            const lastRevenue = parseFloat(growthRes.rows[0]?.last_month || 0);

            let growthPercent = 0;
            if (lastRevenue > 0) {
                growthPercent = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
            } else if (currentRevenue > 0) {
                growthPercent = 100;
            }

            // 5. Alerts (Low Stock, Overdue Invoices)
            const alertsRes = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM products WHERE business_id = $1 AND stock <= min_stock AND is_active = true) as low_stock_count,
                    (SELECT COUNT(*) FROM invoices WHERE business_id = $1 AND status = 'pending' AND due_date < CURRENT_DATE) as overdue_invoices
            `, [businessId]);

            return {
                success: true,
                data: {
                    revenue: parseFloat(revenueRes.rows[0].total_revenue),
                    orders: {
                        total: parseInt(ordersRes.rows[0].active_orders),
                        pending: parseInt(ordersRes.rows[0].pending_orders),
                        paid: parseInt(ordersRes.rows[0].paid_orders)
                    },
                    products: parseInt(productsRes.rows[0].active_products),
                    growth: {
                        value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`,
                        trend: growthPercent >= 0 ? 'up' : 'down',
                        percentage: Math.abs(growthPercent)
                    },
                    alerts: {
                        lowStock: parseInt(alertsRes.rows[0].low_stock_count),
                        overdueInvoices: parseInt(alertsRes.rows[0].overdue_invoices)
                    }
                }
            };

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Dashboard Metrics Error:', error);
        return { success: false, error: error.message };
    }
}
