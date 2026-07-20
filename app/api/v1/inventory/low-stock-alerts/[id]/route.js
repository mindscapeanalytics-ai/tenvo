export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { withApiPermission } from '@/lib/api/_shared/middleware';
import { apiSuccess, apiError } from '@/lib/api/_shared/response';

/**
 * PATCH /api/v1/inventory/low-stock-alerts/[id]
 * Dismiss or update a low-stock alert.
 * Body: { status: 'dismissed' | 'resolved' }
 *
 * Authentication: Required (withApiAuth middleware)
 */
export const PATCH = withApiPermission('inventory.edit', async (request, { businessId, parsedBody, routeParams }) => {
    const id = routeParams?.params?.id;
    if (!id) return apiError('MISSING_ID', 'Alert ID is required', 400);

    const body = parsedBody || {};
    const status = body.status || 'dismissed';

    const allowedStatuses = ['dismissed', 'resolved', 'active'];
    if (!allowedStatuses.includes(status)) {
        return apiError('INVALID_STATUS', `Status must be one of: ${allowedStatuses.join(', ')}`, 400);
    }

    const client = await pool.connect();
    try {
        const res = await client.query(`
            UPDATE low_stock_alerts
            SET status = $1, updated_at = NOW()
            WHERE id = $2 AND business_id = $3
            RETURNING *
        `, [status, id, businessId]);

        if (res.rows.length === 0) {
            return apiError('NOT_FOUND', 'Alert not found', 404);
        }

        return apiSuccess({ alert: res.rows[0] });
    } catch (error) {
        if (error?.code === '42P01') {
            return apiError('TABLES_MISSING',
                'Low-stock alert tables are not initialized. Apply latest migrations first.', 503);
        }
        console.error('[PATCH /api/v1/inventory/low-stock-alerts/[id]]', error);
        return apiError('UPDATE_FAILED', error.message, 500);
    } finally {
        client.release();
    }
});

