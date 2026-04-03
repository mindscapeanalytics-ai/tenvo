'use server';

import { WorkflowService } from '@/lib/services/WorkflowService';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { withGuard } from '@/lib/rbac/serverGuard';
import pool from '@/lib/db';

async function checkAuth(businessId, client = null, permission = 'workflows.view', feature = 'approval_workflows') {
    const { session } = await withGuard(businessId, { permission, feature, client });
    return session;
}

/**
 * Submit an approval request
 */
export async function submitApprovalAction(data) {
    try {
        const session = await checkAuth(data.businessId, null, 'approvals.request', 'approval_workflows');
        const request = await WorkflowService.submitApproval(data, session.user.id);

        auditWrite({
            businessId: data.businessId, action: 'create', entityType: 'approval_request', entityId: request.id,
            description: `Submitted ${data.requestType} approval request ${request.id}`,
        });

        return { success: true, request };
    } catch (error) {
        console.error('Submit approval action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Approve or reject a request
 */
export async function resolveApprovalAction(data) {
    try {
        const session = await checkAuth(data.businessId, null, 'approvals.approve', 'approval_workflows');
        const result = await WorkflowService.resolveApproval(data, session.user.id);

        auditWrite({
            businessId: data.businessId, action: data.action === 'approve' ? 'approve' : 'reject',
            entityType: 'approval_request', entityId: data.requestId,
            description: `${result.status} approval request ${data.requestId}`,
            metadata: { requestType: result.request.request_type, rejectionReason: data.rejectionReason },
        });

        return { success: true, status: result.status };
    } catch (error) {
        console.error('Resolve approval action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get pending approvals for a user
 */
export async function getPendingApprovalsAction(businessId) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(businessId, client, 'workflows.view', 'approval_workflows');

        const result = await client.query(`
            SELECT ar.*,
                   u.name as requester_name
            FROM approval_requests ar
            LEFT JOIN "user" u ON ar.requested_by = u.id
            WHERE ar.business_id = $1
            AND (ar.approver_id = $2 OR ar.approver_id IS NULL)
            AND ar.status = 'pending'
            ORDER BY ar.requested_at DESC
        `, [businessId, session.user.id]);

        return { success: true, requests: result.rows };
    } catch (error) {
        console.error('Get pending approvals error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get all approval history for a business
 */
export async function getApprovalHistoryAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'workflows.view', 'approval_workflows');

        let query = `
            SELECT ar.*,
                   u_req.name as requester_name,
                   u_app.name as approver_name
            FROM approval_requests ar
            LEFT JOIN "user" u_req ON ar.requested_by = u_req.id
            LEFT JOIN "user" u_app ON ar.approver_id = u_app.id
            WHERE ar.business_id = $1
        `;
        const params = [businessId];
        let idx = 2;

        if (filters.status) {
            query += ` AND ar.status = $${idx}`;
            params.push(filters.status);
            idx++;
        }
        if (filters.requestType) {
            query += ` AND ar.request_type = $${idx}`;
            params.push(filters.requestType);
            idx++;
        }

        query += ` ORDER BY ar.requested_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await client.query(query, params);
        return { success: true, requests: result.rows };
    } catch (error) {
        console.error('Get approval history error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
