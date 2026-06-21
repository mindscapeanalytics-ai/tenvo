'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';
import { normalizePaymentType, isReceiptType } from '@/lib/utils/paymentTypes';

function bucketAgingRows(rows, balanceKey = 'balance', daysKey = 'days_overdue') {
    const summary = {
        total_balance: 0,
        total_current: 0,
        total_1_30: 0,
        total_31_60: 0,
        total_61_90: 0,
        total_over_90: 0,
    };

    const items = rows.map((row) => {
        const balance = Number(row[balanceKey] || 0);
        const days = Math.max(0, Number(row[daysKey] || 0));
        let current = 0;
        let days_1_30 = 0;
        let days_31_60 = 0;
        let days_61_90 = 0;
        let days_over_90 = 0;

        if (days === 0) current = balance;
        else if (days <= 30) days_1_30 = balance;
        else if (days <= 60) days_31_60 = balance;
        else if (days <= 90) days_61_90 = balance;
        else days_over_90 = balance;

        summary.total_balance += balance;
        summary.total_current += current;
        summary.total_1_30 += days_1_30;
        summary.total_31_60 += days_31_60;
        summary.total_61_90 += days_61_90;
        summary.total_over_90 += days_over_90;

        return {
            ...row,
            balance,
            days_overdue: days,
            current_amount: current,
            days_1_30,
            days_31_60,
            days_61_90,
            days_over_90,
        };
    });

    return { items, summary, count: items.length };
}

/**
 * Accounts receivable aging (invoice balances).
 */
export async function getAccountsReceivableAgingAction(businessId, options = {}) {
    try {
        await withGuard(businessId, { permission: 'finance.view_reports' });
        const report = await InvoicePaymentService.getAgingReport(businessId, options);
        return actionSuccess(report);
    } catch (error) {
        console.error('AR aging error:', error);
        return actionFailure('GET_AR_AGING_FAILED', await getErrorMessage(error));
    }
}

/**
 * Accounts payable aging from received purchase bills minus vendor payment allocations.
 */
export async function getAccountsPayableAgingAction(businessId) {
    const client = await pool.connect();
    try {
        await withGuard(businessId, { permission: 'finance.view_reports' });

        const result = await client.query(`
            SELECT
                p.id,
                p.purchase_number,
                p.date,
                p.vendor_id,
                v.name AS vendor_name,
                p.total_amount::numeric AS total_amount,
                COALESCE(alloc.paid, 0)::numeric AS paid_amount,
                GREATEST(p.total_amount::numeric - COALESCE(alloc.paid, 0), 0)::numeric AS balance,
                GREATEST(CURRENT_DATE - p.date::date, 0)::int AS days_overdue
            FROM purchases p
            LEFT JOIN vendors v ON p.vendor_id = v.id AND v.business_id = p.business_id
            LEFT JOIN (
                SELECT purchase_id, SUM(amount)::numeric AS paid
                FROM payment_allocations
                WHERE purchase_id IS NOT NULL
                GROUP BY purchase_id
            ) alloc ON alloc.purchase_id = p.id
            WHERE p.business_id = $1
              AND p.status = 'received'
              AND (p.is_deleted = false OR p.is_deleted IS NULL)
              AND GREATEST(p.total_amount::numeric - COALESCE(alloc.paid, 0), 0) > 0
            ORDER BY days_overdue DESC, p.date ASC
        `, [businessId]);

        const report = bucketAgingRows(result.rows);
        return actionSuccess({
            purchases: report.items,
            summary: report.summary,
            count: report.count,
        });
    } catch (error) {
        console.error('AP aging error:', error);
        return actionFailure('GET_AP_AGING_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}

/**
 * Unified read-only register: legacy payments + direct invoice payments.
 */
export async function getUnifiedPaymentRegisterAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await withGuard(businessId, { permission: 'payments.view' });

        const limit = Math.min(Number(filters.limit) || 200, 500);

        const legacyRes = await client.query(`
            SELECT
                p.id,
                p.payment_type,
                p.payment_date,
                p.amount,
                p.payment_mode,
                p.notes,
                p.reference_type,
                p.reference_id,
                c.name AS customer_name,
                v.name AS vendor_name
            FROM payments p
            LEFT JOIN customers c ON p.customer_id = c.id AND c.business_id = p.business_id
            LEFT JOIN vendors v ON p.vendor_id = v.id AND v.business_id = p.business_id
            WHERE p.business_id = $1
              AND (p.is_deleted = false OR p.is_deleted IS NULL)
            ORDER BY p.payment_date DESC, p.created_at DESC
            LIMIT $2
        `, [businessId, limit]);

        const invoicePayRes = await client.query(`
            SELECT
                ip.id,
                ip.payment_date,
                ip.amount,
                ip.payment_method,
                ip.notes,
                ip.reference_number,
                i.invoice_number,
                c.name AS customer_name
            FROM invoice_payments ip
            JOIN invoices i ON ip.invoice_id = i.id
            LEFT JOIN customers c ON i.customer_id = c.id AND c.business_id = i.business_id
            WHERE i.business_id = $1
              AND (ip.is_deleted = false OR ip.is_deleted IS NULL)
              AND (ip.reference_number IS NULL OR ip.reference_number NOT LIKE 'legacy-payment:%')
            ORDER BY ip.payment_date DESC, ip.created_at DESC
            LIMIT $2
        `, [businessId, limit]);

        const rows = [
            ...legacyRes.rows.map((p) => {
                const paymentType = normalizePaymentType(p.payment_type) || p.payment_type;
                return {
                    id: p.id,
                    source: 'legacy',
                    payment_type: paymentType,
                    payment_date: p.payment_date,
                    amount: Number(p.amount),
                    payment_mode: p.payment_mode,
                    party_name: isReceiptType(paymentType) ? p.customer_name : p.vendor_name,
                    reference_label: p.reference_type || null,
                    notes: p.notes,
                };
            }),
            ...invoicePayRes.rows.map((ip) => ({
                id: ip.id,
                source: 'invoice_payment',
                payment_type: 'receipt',
                payment_date: ip.payment_date,
                amount: Number(ip.amount),
                payment_mode: ip.payment_method,
                party_name: ip.customer_name,
                reference_label: ip.invoice_number,
                notes: ip.notes,
            })),
        ].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

        return actionSuccess({
            payments: serializeDecimalsDeep(rows.slice(0, limit)),
        });
    } catch (error) {
        console.error('Unified payment register error:', error);
        return actionFailure('GET_PAYMENT_REGISTER_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}
