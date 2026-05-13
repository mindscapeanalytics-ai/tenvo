import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Low Stock Alert Detail API
 * PATCH: Dismiss an alert
 */
export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { status } = body;

        const client = await pool.connect();
        try {
            const res = await client.query(`
                UPDATE low_stock_alerts
                SET status = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `, [status || 'dismissed', id]);

            if (res.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Alert not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in PATCH /api/v1/inventory/low-stock-alerts/[id]:', error);
        if (error?.code === '42P01') {
            return NextResponse.json(
                { error: 'Low-stock alert tables are not initialized. Apply latest migrations first.' },
                { status: 503 }
            );
        }
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
