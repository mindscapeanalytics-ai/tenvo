'use server';

import { withGuard } from '@/lib/rbac/serverGuard';
import { InvoiceApprovalService } from '@/lib/services/InvoiceApprovalService';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';

async function checkAuth(businessId, permission = 'sales.view') {
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Submit invoice for approval
 */
export async function submitInvoiceForApprovalAction(businessId, invoiceId) {
    try {
        const session = await checkAuth(businessId, 'sales.approve_invoice');

        await InvoiceApprovalService.submitForApproval(businessId, invoiceId, session.user.id);

        auditWrite({
            businessId,
            action: 'update',
            entityType: 'invoice',
            entityId: invoiceId,
            description: 'Submitted invoice for approval',
            metadata: { invoiceId },
        });

        return await actionSuccess({ message: 'Invoice submitted for approval' });
    } catch (e) {
        console.error('Submit for approval error:', e);
        return await actionFailure('SUBMIT_APPROVAL_FAILED', await getErrorMessage(e));
    }
}

/**
 * Approve invoice
 */
export async function approveInvoiceAction(businessId, invoiceId, notes = '') {
    try {
        const session = await checkAuth(businessId, 'sales.approve_invoice');

        await InvoiceApprovalService.approveInvoice(businessId, invoiceId, session.user.id, notes);

        auditWrite({
            businessId,
            action: 'approve',
            entityType: 'invoice',
            entityId: invoiceId,
            description: `Approved invoice - Notes: ${notes || 'None'}`,
            metadata: { invoiceId, approverNotes: notes },
        });

        return await actionSuccess({ message: 'Invoice approved successfully' });
    } catch (e) {
        console.error('Approve invoice error:', e);
        return await actionFailure('APPROVE_INVOICE_FAILED', await getErrorMessage(e));
    }
}

/**
 * Reject invoice
 */
export async function rejectInvoiceAction(businessId, invoiceId, reason = '') {
    try {
        const session = await checkAuth(businessId, 'sales.approve_invoice');

        await InvoiceApprovalService.rejectInvoice(businessId, invoiceId, session.user.id, reason);

        auditWrite({
            businessId,
            action: 'reject',
            entityType: 'invoice',
            entityId: invoiceId,
            description: `Rejected invoice - Reason: ${reason || 'No reason provided'}`,
            metadata: { invoiceId, rejectReason: reason },
        });

        return await actionSuccess({ message: 'Invoice rejected' });
    } catch (e) {
        console.error('Reject invoice error:', e);
        return await actionFailure('REJECT_INVOICE_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get pending approvals
 */
export async function getPendingApprovalsAction(businessId) {
    try {
        await checkAuth(businessId, 'sales.approve_invoice');

        const approvals = await InvoiceApprovalService.getPendingApprovalsQueue(businessId);

        return await actionSuccess({ approvals });
    } catch (e) {
        console.error('Get pending approvals error:', e);
        return await actionFailure('GET_APPROVALS_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get approval history for a specific invoice
 */
export async function getApprovalHistoryAction(businessId, invoiceId) {
    try {
        await checkAuth(businessId, 'sales.view');

        const history = await InvoiceApprovalService.getApprovalHistory(businessId, invoiceId);

        return await actionSuccess({ history });
    } catch (e) {
        console.error('Get approval history error:', e);
        return await actionFailure('GET_HISTORY_FAILED', await getErrorMessage(e));
    }
}

/**
 * Schedule payment reminders
 */
export async function schedulePaymentRemindersAction(businessId, invoiceId) {
    try {
        await checkAuth(businessId, 'sales.create_invoice');

        // Schedule standard reminders
        await InvoiceApprovalService.schedulePaymentReminder(businessId, invoiceId, 'first_due');
        await InvoiceApprovalService.schedulePaymentReminder(businessId, invoiceId, 'overdue_7days');
        await InvoiceApprovalService.schedulePaymentReminder(businessId, invoiceId, 'overdue_14days');
        await InvoiceApprovalService.schedulePaymentReminder(businessId, invoiceId, 'overdue_30days');

        auditWrite({
            businessId,
            action: 'create',
            entityType: 'invoice_payment_reminders',
            entityId: invoiceId,
            description: 'Scheduled payment reminders',
        });

        return await actionSuccess({ message: 'Payment reminders scheduled' });
    } catch (e) {
        console.error('Schedule reminders error:', e);
        return await actionFailure('SCHEDULE_REMINDERS_FAILED', await getErrorMessage(e));
    }
}

/**
 * Get pending payment reminders
 */
export async function getPendingPaymentRemindersAction(businessId) {
    try {
        await checkAuth(businessId, 'sales.view');

        const reminders = await InvoiceApprovalService.getPendingReminders(businessId);

        return await actionSuccess({ reminders });
    } catch (e) {
        console.error('Get reminders error:', e);
        return await actionFailure('GET_REMINDERS_FAILED', await getErrorMessage(e));
    }
}
