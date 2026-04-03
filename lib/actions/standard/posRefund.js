'use server';

import pool from '@/lib/db';
import { POSService } from '@/lib/services/POSService';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { withGuard } from '@/lib/rbac/serverGuard';

async function checkAuth(businessId, client = null, permission = 'pos.process_refund', feature = 'pos') {
    const { session } = await withGuard(businessId, { permission, feature, client });
    return session;
}

/**
 * Process a POS refund (full or partial) with stock reversal + GL entries
 */
export async function refundPosTransactionAction(data) {
    try {
        const session = await checkAuth(data.businessId, null, 'pos.process_refund', 'pos');
        const refund = await POSService.refundTransaction(data, session.user.id);

        auditWrite({
            businessId: data.businessId,
            action: 'create',
            entityType: 'pos_refund',
            entityId: refund.id,
            description: `POS refund ${refund.refund_number} processed`,
            metadata: { refundId: refund.id, total: refund.total_amount },
        });

        return { success: true, refund };
    } catch (error) {
        console.error('POS refund action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get refunds for a transaction or business
 */
export async function getPosRefundsAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'pos.access', 'pos');

        let query = `
            SELECT r.*, t.transaction_number
            FROM pos_refunds r
            JOIN pos_transactions t ON r.transaction_id = t.id
            WHERE r.business_id = $1
        `;
        const params = [businessId];
        let idx = 2;

        if (filters.transactionId) {
            query += ` AND r.transaction_id = $${idx}`;
            params.push(filters.transactionId);
            idx++;
        }

        query += ` ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await client.query(query, params);
        return { success: true, refunds: result.rows };
    } catch (error) {
        console.error('Get POS refunds error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
