export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';

/**
 * GET /api/v1/vendors?businessId=xxx
 * List all active vendors for a business
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');
        if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

        await withGuard(businessId, { permission: 'vendors.view' });

        const client = await pool.connect();
        try {
            const search = searchParams.get('search') || '';
            const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
            const offset = parseInt(searchParams.get('offset') || '0');

            let query = `
                SELECT id, name, email, phone, company, city, country,
                       outstanding_balance, is_active, created_at
                FROM vendors
                WHERE business_id = $1 AND is_deleted = false
            `;
            const params = [businessId];
            let idx = 2;

            if (search) {
                query += ` AND (name ILIKE $${idx} OR email ILIKE $${idx} OR company ILIKE $${idx})`;
                params.push(`%${search}%`);
                idx++;
            }

            query += ` ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`;
            params.push(limit, offset);

            const result = await client.query(query, params);
            const countRes = await client.query(
                `SELECT COUNT(*)::int as total FROM vendors WHERE business_id = $1 AND is_deleted = false`,
                [businessId]
            );

            return NextResponse.json({
                success: true,
                vendors: result.rows,
                total: countRes.rows[0].total,
                limit, offset
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('GET /api/v1/vendors error:', error);
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 403 : 500 });
    }
}

/**
 * POST /api/v1/vendors
 * Create a new vendor
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { business_id: businessId, ...vendorData } = body;
        if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

        await withGuard(businessId, { permission: 'vendors.create' });

        const client = await pool.connect();
        try {
            const result = await client.query(`
                INSERT INTO vendors (
                    business_id, name, email, phone, company, address, city, country,
                    payment_terms, notes, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
                RETURNING *
            `, [
                businessId, vendorData.name, vendorData.email, vendorData.phone,
                vendorData.company, vendorData.address, vendorData.city,
                vendorData.country || 'Pakistan', vendorData.payment_terms,
                vendorData.notes
            ]);

            return NextResponse.json({ success: true, vendor: result.rows[0] }, { status: 201 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('POST /api/v1/vendors error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

