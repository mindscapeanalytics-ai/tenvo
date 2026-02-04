'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Server Action: Seed initial products for a new business
 * This replaces the client-side Supabase seeding in registration
 */
export async function seedBusinessProductsAction({ businessId, items }) {
    try {
        // Get session to verify user
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify user owns this business
        const client = await pool.connect();
        try {
            const bizCheck = await client.query(
                'SELECT id FROM businesses WHERE id = $1 AND user_id = $2',
                [businessId, session.user.id]
            );

            if (bizCheck.rows.length === 0) {
                return { success: false, error: 'Unauthorized: Business not found or access denied' };
            }

            // Insert products
            if (!items || items.length === 0) {
                return { success: true, message: 'No products to seed' };
            }

            // Build bulk insert query
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            // Define valid columns in the database
            const VALID_COLUMNS = [
                'business_id', 'name', 'sku', 'barcode', 'description', 'category',
                'brand', 'price', 'cost_price', 'mrp', 'stock', 'min_stock',
                'max_stock', 'reorder_point', 'reorder_quantity', 'unit',
                'hsn_code', 'sac_code', 'tax_percent', 'image_url', 'is_active',
                'domain_data', 'batches', 'serial_numbers', 'variants',
                'expiry_date', 'manufacturing_date'
            ];

            // 1. Identify all keys present in the data from VALID_COLUMNS
            const presentKeys = VALID_COLUMNS.filter(col =>
                items.some(item => item[col] !== undefined)
            );

            if (presentKeys.length === 0) {
                return { success: true, message: 'No valid product data to seed' };
            }

            // 2. Build bulk insert query with consistent structure
            const filteredItems = items.map(item => {
                const filtered = {};
                presentKeys.forEach(key => {
                    filtered[key] = item[key] !== undefined ? item[key] : null;
                });
                return filtered;
            });

            console.log("Seeding with columns:", presentKeys.join(', '));

            filteredItems.forEach((item, idx) => {
                const vals = Object.values(item);
                const rowPlaceholders = vals.map(() => `$${paramIndex++}`);
                placeholders.push(`(${rowPlaceholders.join(', ')})`);
                values.push(...vals);
            });

            const columns = presentKeys.join(', ');

            const insertQuery = `
                INSERT INTO products (${columns})
                VALUES ${placeholders.join(', ')}
                RETURNING id
            `;

            const result = await client.query(insertQuery, values);

            return {
                success: true,
                message: `Seeded ${result.rowCount} products`,
                productIds: result.rows.map(r => r.id)
            };

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Product seeding error:', error);
        return {
            success: false,
            error: error.message || 'Failed to seed products'
        };
    }
}
