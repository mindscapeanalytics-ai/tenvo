import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Cycle Count Detail API
 * GET: Get cycle count details with items
 * PATCH: Update cycle count and process variance
 */
export async function GET(request, { params }) {
    try {
        const { id } = params;

        const client = await pool.connect();
        try {
            const ccRes = await client.query(`
                SELECT * FROM cycle_counts WHERE id = $1
            `, [id]);

            if (ccRes.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Cycle count not found' },
                    { status: 404 }
                );
            }

            const cycleCount = ccRes.rows[0];

            const itemsRes = await client.query(`
                SELECT * FROM cycle_count_items WHERE cycle_count_id = $1
            `, [id]);

            return NextResponse.json({
                ...cycleCount,
                items: itemsRes.rows,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in GET /api/v1/inventory/cycle-counts/[id]:', error);
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

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { items, status } = body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Calculate variance
            let varianceCount = 0;
            const adjustments = [];

            for (const item of items || []) {
                const variance = (item.counted_quantity || 0) - (item.system_quantity || 0);
                if (variance !== 0) {
                    varianceCount++;
                    adjustments.push({
                        product_id: item.product_id,
                        variance,
                        unit_price: item.unit_price,
                        cycle_count_id: id,
                    });
                }

                // Update cycle count item
                await client.query(`
                    UPDATE cycle_count_items
                    SET counted_quantity = $1
                    WHERE cycle_count_id = $2 AND product_id = $3
                `, [item.counted_quantity || 0, id, item.product_id]);
            }

            // Update cycle count status
            const ccRes = await client.query(`
                UPDATE cycle_counts
                SET status = $1, variance_count = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `, [status || 'completed', varianceCount, id]);

            const cycleCount = ccRes.rows[0];

            // Auto-reconcile inventory if approved
            if (status === 'completed') {
                for (const adj of adjustments) {
                    // Create inventory adjustment record
                    await client.query(`
                        INSERT INTO inventory_adjustments
                        (cycle_count_id, product_id, adjustment_qty, reason, created_at)
                        VALUES ($1, $2, $3, 'Cycle count variance', NOW())
                    `, [id, adj.product_id, adj.variance]);

                    // Adjust stock (this would integrate with InventoryService in production)
                    // For now, just record the variance
                }
            }

            await client.query('COMMIT');

            return NextResponse.json(cycleCount);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in PATCH /api/v1/inventory/cycle-counts/[id]:', error);
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
