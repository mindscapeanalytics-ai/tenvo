import pool from '@/lib/db';

/**
 * Workflow Service (Enterprise SOA)
 * Orchestrates Approval Requests and Resolutions.
 */
export const WorkflowService = {

    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Submit Approval Request
     */
    async submitApproval(data, userId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            // Determine approver
            let approverId = data.approverId;
            if (!approverId) {
                const ruleRes = await client.query(`
                    SELECT approver_role FROM workflow_rules
                    WHERE business_id = $1 AND document_type = $2 AND is_active = true
                    AND (min_amount IS NULL OR $3 >= min_amount)
                    ORDER BY min_amount DESC NULLS LAST LIMIT 1
                `, [data.businessId, data.requestType, data.amount || 0]);

                if (ruleRes.rows.length > 0) {
                    const approverRes = await client.query(`
                        SELECT user_id FROM business_users
                        WHERE business_id = $1 AND role = $2 AND status = 'active' LIMIT 1
                    `, [data.businessId, ruleRes.rows[0].approver_role]);
                    approverId = approverRes.rows[0]?.user_id;
                }

                if (!approverId) {
                    const ownerRes = await client.query(
                        `SELECT user_id FROM business_users WHERE business_id = $1 AND role = 'owner' LIMIT 1`,
                        [data.businessId]
                    );
                    approverId = ownerRes.rows[0]?.user_id;
                }
            }

            const res = await client.query(`
                INSERT INTO approval_requests (
                    business_id, request_type, reference_id,
                    requested_by, approver_id, amount, description
                ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            `, [
                data.businessId, data.requestType, data.referenceId,
                userId, approverId, data.amount, data.description
            ]);
            return res.rows[0];
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Resolve Approval Request
     */
    async resolveApproval(data, userId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const reqRes = await client.query(
                `SELECT * FROM approval_requests WHERE id = $1 AND business_id = $2 AND status = 'pending' FOR UPDATE`,
                [data.requestId, data.businessId]
            );
            if (reqRes.rows.length === 0) throw new Error('Approval request not found or resolved');

            const request = reqRes.rows[0];
            const newStatus = data.action === 'approve' ? 'approved' : 'rejected';

            await client.query(`
                UPDATE approval_requests SET
                    status = $1, approver_id = $2, rejection_reason = $3, resolved_at = NOW()
                WHERE id = $4
            `, [newStatus, userId, data.rejectionReason, data.requestId]);

            return { status: newStatus, request };
        } finally {
            if (!txClient) client.release();
        }
    }
};
