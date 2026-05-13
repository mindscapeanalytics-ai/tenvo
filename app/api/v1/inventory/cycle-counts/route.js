import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Cycle Counts API
 * GET: List cycle counts
 * POST: Create new cycle count
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('business_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!businessId) {
            return NextResponse.json(
                { error: 'business_id is required' },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT 
                    cc.id, cc.business_id, cc.name, cc.category, cc.warehouse_id,
                    cc.status, cc.item_count, cc.variance_count, cc.created_at,
                    cc.updated_at
                FROM cycle_counts cc
                WHERE cc.business_id = $1
                ORDER BY cc.created_at DESC
                LIMIT $2
            `, [businessId, limit]);

            return NextResponse.json({
                cycleCounts: res.rows,
                count: res.rows.length,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in GET /api/v1/inventory/cycle-counts:', error);
        if (error?.code === '42P01') {
            return NextResponse.json({
                cycleCounts: [],
                count: 0,
                warning: 'Cycle count tables are not initialized yet. Apply latest migrations.',
            });
        }
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { business_id: businessId, name, category, warehouse_id, location_id, scheduled_date } = body;

        if (!businessId || !name) {
            return NextResponse.json(
                { error: 'business_id and name are required' },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get items to count based on category
            let items = [];
            
            if (category === 'abc-a' || category === 'abc-b' || category === 'abc-c') {
                // Get products in the specified ABC category
                const abcRes = await client.query(`
                    SELECT p.id, p.name, p.sku, p.selling_price,
                           psl.quantity as system_quantity, psl.warehouse_id
                    FROM products p
                    LEFT JOIN product_stock_location psl ON psl.product_id = p.id
                    JOIN inventory_abc_analysis iaa ON iaa.product_id = p.id
                    WHERE p.business_id = $1 AND iaa.abc_category = $2
                    ORDER BY p.name
                `, [businessId, category.split('-')[1].toUpperCase()]);
                items = abcRes.rows;
            } else if (category === 'warehouse' && warehouse_id) {
                // Get all items in a warehouse
                const whRes = await client.query(`
                    SELECT p.id, p.name, p.sku, p.selling_price,
                           psl.quantity as system_quantity, psl.warehouse_id
                    FROM products p
                    LEFT JOIN product_stock_location psl ON psl.product_id = p.id AND psl.warehouse_id = $2
                    WHERE p.business_id = $1
                    ORDER BY p.name
                `, [businessId, warehouse_id]);
                items = whRes.rows;
            } else {
                // Get all items for manual full count
                const allRes = await client.query(`
                    SELECT p.id, p.name, p.sku, p.selling_price,
                           COALESCE(SUM(psl.quantity), 0) as system_quantity
                    FROM products p
                    LEFT JOIN product_stock_location psl ON psl.product_id = p.id
                    WHERE p.business_id = $1
                    GROUP BY p.id, p.name, p.sku, p.selling_price
                    ORDER BY p.name
                `, [businessId]);
                items = allRes.rows;
            }

            // Create cycle count record
            const ccRes = await client.query(`
                INSERT INTO cycle_counts
                (business_id, name, category, warehouse_id, status, item_count, variance_count, scheduled_date, created_at)
                VALUES ($1, $2, $3, $4, 'in-progress', $5, 0, $6, NOW())
                RETURNING *
            `, [businessId, name, category, warehouse_id || null, items.length, scheduled_date || null]);

            const cycleCount = ccRes.rows[0];

            // Insert cycle count items
            for (const item of items) {
                await client.query(`
                    INSERT INTO cycle_count_items
                    (cycle_count_id, product_id, sku, product_name, system_quantity, unit_price)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [cycleCount.id, item.id, item.sku, item.name, item.system_quantity || 0, item.selling_price || 0]);
            }

            await client.query('COMMIT');

            return NextResponse.json(cycleCount, { status: 201 });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in POST /api/v1/inventory/cycle-counts:', error);
        if (error?.code === '42P01') {
            return NextResponse.json(
                { error: 'Cycle count tables are not initialized. Apply latest migrations first.' },
                { status: 503 }
            );
        }
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
