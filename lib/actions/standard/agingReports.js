'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';
import { normalizePaymentType, isReceiptType } from '@/lib/utils/paymentTypes';
import { bucketAgingRows, toAgingAsOfDate } from '@/lib/utils/agingBuckets';

/**
 * Accounts receivable aging (invoice balances via invoice_payments).
 */
export async function getAccountsReceivableAgingAction(businessId, options = {}) {
    try {
        await withGuard(businessId, { permission: 'finance.view_reports' });
        const report = await InvoicePaymentService.getAgingReport(businessId, options);
        return actionSuccess(serializeDecimalsDeep(report));
    } catch (error) {
        console.error('AR aging error:', error);
        return actionFailure('GET_AR_AGING_FAILED', await getErrorMessage(error));
    }
}

/**
 * Accounts payable aging from received purchase bills minus active vendor payment allocations.
 */
export async function getAccountsPayableAgingAction(businessId, options = {}) {
    const client = await pool.connect();
    try {
        await withGuard(businessId, { permission: 'finance.view_reports' });
        const asOf = toAgingAsOfDate(options.asOfDate);

        const result = await client.query(
            `
            SELECT
                p.id,
                p.purchase_number,
                p.date,
                p.vendor_id,
                v.name AS vendor_name,
                p.total_amount::numeric AS total_amount,
                COALESCE(alloc.paid, 0)::numeric AS paid_amount,
                GREATEST(p.total_amount::numeric - COALESCE(alloc.paid, 0), 0)::numeric AS balance,
                GREATEST(
                    ($2::date - COALESCE(p.expected_delivery, p.date)::date),
                    0
                )::int AS days_overdue
            FROM purchases p
            LEFT JOIN vendors v ON p.vendor_id = v.id AND v.business_id = p.business_id
            LEFT JOIN (
                SELECT
                    pa.purchase_id,
                    SUM(pa.amount)::numeric AS paid
                FROM payment_allocations pa
                INNER JOIN payments pay
                    ON pay.id = pa.payment_id
                   AND pay.business_id = pa.business_id
                WHERE pa.purchase_id IS NOT NULL
                  AND pa.business_id = $1
                  AND (pay.is_deleted = false OR pay.is_deleted IS NULL)
                GROUP BY pa.purchase_id
            ) alloc ON alloc.purchase_id = p.id
            WHERE p.business_id = $1
              AND p.status = 'received'
              AND (p.is_deleted = false OR p.is_deleted IS NULL)
              AND COALESCE(LOWER(p.payment_status), '') <> 'paid'
              AND GREATEST(p.total_amount::numeric - COALESCE(alloc.paid, 0), 0) > 0
            ORDER BY days_overdue DESC, p.date ASC
            `,
            [businessId, asOf]
        );

        const report = bucketAgingRows(result.rows);
        return actionSuccess(
            serializeDecimalsDeep({
                purchases: report.items,
                summary: report.summary,
                count: report.count,
                as_of_date: asOf,
            })
        );
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

        const legacyRes = await client.query(
            `
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
            `,
            [businessId, limit]
        );

        const invoicePayRes = await client.query(
            `
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
            `,
            [businessId, limit]
        );

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
