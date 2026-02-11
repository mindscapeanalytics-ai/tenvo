/**
 * Consolidated Server Actions for Business Dashboard
 * Replaces API client calls with type-safe Server Actions
 */

'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import pool from '@/lib/db';
import { validateSchema } from '@/lib/validation/schemas';
import { createProductSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Product Actions
// ============================================================================

export async function getProductsAction(businessId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: 'Unauthorized' };

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM products 
        WHERE business_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [businessId]);

            return { success: true, products: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get products error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function createProductAction(data: unknown) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: 'Unauthorized' };

        const validated = validateSchema(createProductSchema, data);
        await verifyBusinessAccess(session.user.id, validated.business_id);

        const client = await pool.connect();
        try {
            const result = await client.query(`
        INSERT INTO products (
          business_id, name, sku, barcode, description, category, brand,
          price, cost_price, mrp, stock, min_stock,
          unit, hsn_code, tax_percent, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
                validated.business_id,
                validated.name,
                validated.sku,
                validated.barcode,
                validated.description,
                validated.category,
                validated.brand,
                validated.price,
                validated.cost_price,
                validated.mrp,
                validated.stock,
                validated.min_stock,
                validated.unit,
                validated.hsn_code,
                validated.tax_percent,
                validated.is_active
            ]);

            revalidatePath(`/business/${validated.business_id}`);
            return { success: true, product: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create product error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============================================================================
// Customer Actions
// ============================================================================

export async function getCustomersAction(businessId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: 'Unauthorized' };

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM customers 
        WHERE business_id = $1
        ORDER BY created_at DESC
      `, [businessId]);

            return { success: true, customers: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get customers error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============================================================================
// Vendor Actions
// ============================================================================

export async function getVendorsAction(businessId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: 'Unauthorized' };

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM vendors 
        WHERE business_id = $1
        ORDER BY created_at DESC
      `, [businessId]);

            return { success: true, vendors: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get vendors error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============================================================================
// Dashboard Stats Actions
// ============================================================================

export async function getDashboardStatsAction(businessId: string, dateRange?: { from: Date; to: Date }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: 'Unauthorized' };

        await verifyBusinessAccess(session.user.id, businessId);

        const from = dateRange?.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const to = dateRange?.to || new Date();

        const client = await pool.connect();
        try {
            // Parallel queries for better performance
            const [invoiceStats, productStats, customerStats] = await Promise.all([
                client.query(`
          SELECT 
            COUNT(*) as total_invoices,
            SUM(CASE WHEN status = 'paid' THEN grand_total ELSE 0 END) as total_revenue,
            SUM(grand_total) as gross_revenue
          FROM invoices
          WHERE business_id = $1 
            AND date >= $2 
            AND date <= $3
        `, [businessId, from, to]),

                client.query(`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_count
          FROM products
          WHERE business_id = $1 AND is_active = true
        `, [businessId]),

                client.query(`
          SELECT COUNT(*) as total_customers
          FROM customers
          WHERE business_id = $1
        `, [businessId])
            ]);

            return {
                success: true,
                stats: {
                    totalRevenue: Number(invoiceStats.rows[0].total_revenue) || 0,
                    grossRevenue: Number(invoiceStats.rows[0].gross_revenue) || 0,
                    totalOrders: Number(invoiceStats.rows[0].total_invoices) || 0,
                    totalProducts: Number(productStats.rows[0].total_products) || 0,
                    lowStockCount: Number(productStats.rows[0].low_stock_count) || 0,
                    totalCustomers: Number(customerStats.rows[0].total_customers) || 0
                }
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============================================================================
// Utility Actions
// ============================================================================

export async function refreshDataAction(businessId: string) {
    revalidatePath(`/business/${businessId}`);
    return { success: true };
}
