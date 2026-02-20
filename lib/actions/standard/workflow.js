'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId, client = null) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) await verifyBusinessAccess(session.user.id, businessId, [], client);
    return session;
}

/**
 * Submit an approval request
 */
export async function submitApprovalAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);

        // Determine approver from workflow rules or fallback to business owner
        let approverId = data.approverId;
        if (!approverId) {
            const ruleRes = await client.query(`
                SELECT approver_role FROM workflow_rules
                WHERE business_id = $1 AND document_type = $2 AND is_active = true
                AND (min_amount IS NULL OR $3 >= min_amount)
                ORDER BY min_amount DESC NULLS LAST LIMIT 1
            `, [data.businessId, data.requestType, data.amount || 0]);

            if (ruleRes.rows.length > 0) {
                // Find a user with the required role
                const approverRes = await client.query(`
                    SELECT user_id FROM business_users
                    WHERE business_id = $1 AND role = $2 AND status = 'active' LIMIT 1
                `, [data.businessId, ruleRes.rows[0].approver_role]);
                approverId = approverRes.rows[0]?.user_id;
            }

            // Fallback to business owner
            if (!approverId) {
                const ownerRes = await client.query(
                    `SELECT user_id FROM business_users WHERE business_id = $1 AND role = 'owner' LIMIT 1`,
                    [data.businessId]
                );
                approverId = ownerRes.rows[0]?.user_id;
            }
        }

        const result = await client.query(`
            INSERT INTO approval_requests (
                business_id, request_type, reference_id,
                requested_by, approver_id, amount, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [
            data.businessId, data.requestType, data.referenceId || null,
            session.user.id, approverId, data.amount || null,
            data.description || null
        ]);

        return { success: true, request: result.rows[0] };
    } catch (error) {
        console.error('Submit approval error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Approve or reject a request
 */
export async function resolveApprovalAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);

        // Verify the user is the designated approver
        const reqRes = await client.query(
            `SELECT * FROM approval_requests WHERE id = $1 AND business_id = $2 AND status = 'pending'`,
            [data.requestId, data.businessId]
        );
        if (reqRes.rows.length === 0) throw new Error('Approval request not found or already resolved');

        const request = reqRes.rows[0];
        if (request.approver_id && request.approver_id !== session.user.id) {
            // Check if current user has admin/owner role (can override)
            const roleRes = await client.query(
                `SELECT role FROM business_users WHERE business_id = $1 AND user_id = $2`,
                [data.businessId, session.user.id]
            );
            const role = roleRes.rows[0]?.role;
            if (!['admin', 'owner'].includes(role)) {
                throw new Error('You are not authorized to resolve this request');
            }
        }

        const newStatus = data.action === 'approve' ? 'approved' : 'rejected';

        await client.query(`
            UPDATE approval_requests SET
                status = $1,
                approver_id = $2,
                rejection_reason = $3,
                resolved_at = NOW()
            WHERE id = $4
        `, [newStatus, session.user.id, data.rejectionReason || null, data.requestId]);

        return { success: true, status: newStatus };
    } catch (error) {
        console.error('Resolve approval error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get pending approvals for a user
 */
export async function getPendingApprovalsAction(businessId) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(businessId, client);

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
        await checkAuth(businessId, client);

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
