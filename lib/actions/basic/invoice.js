'use server';

import pool, { db } from '@/lib/db';
import { invoiceSchema, validateWithSchema } from '@/lib/validation/schemas';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { assertEntityBelongsToBusiness } from '@/lib/actions/_shared/tenant';
import { isTrustedAuthBypassActive } from '@/lib/actions/_shared/trustedAuthBypass';
import { withGuard } from '@/lib/rbac/serverGuard';

import { InvoiceService } from '@/lib/services/InvoiceService';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

async function checkAuth(businessId, permission = 'sales.view') {
    if (isTrustedAuthBypassActive()) return null;
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Server Action: Create invoice with automated stock and ledger integration
 */
export async function createInvoiceAction(params) {
    try {
        const { invoiceData, items: rawItems } = params;
        const session = await checkAuth(invoiceData.business_id, 'sales.create_invoice');

        // Note: Validation already happens via Zod in the original structure, 
        // will keep for schema compatibility but delegate logic to service.
        const validation = validateWithSchema(invoiceSchema, { ...invoiceData, items: rawItems });
        if (!validation.success) return await actionFailure('VALIDATION_ERROR', 'Validation failed', validation.errors);

        const validated = { ...validation.data };
        // Bridge total_tax ↔ tax_total so InvoiceService.createInvoice always sees tax_total.
        const resolvedTax = Number(validated.total_tax ?? validated.tax_total ?? 0);
        validated.total_tax = Number.isFinite(resolvedTax) ? resolvedTax : 0;
        validated.tax_total = validated.total_tax;

        const invoice = await InvoiceService.createInvoice(validated, session.user.id);

        auditWrite({
            businessId: invoice.business_id, action: 'create', entityType: 'invoice', entityId: invoice.id,
            description: `Created invoice ${invoice.invoice_number}`,
            metadata: { invoiceNumber: invoice.invoice_number, grandTotal: invoice.grand_total, customerId: invoice.customer_id },
        });

        return await actionSuccess({ invoice: serializeDecimalsDeep(invoice) });
    } catch (e) {
        console.error("Create Invoice Action Error:", e);
        return await actionFailure(
            e?.code || 'CREATE_INVOICE_FAILED',
            await getErrorMessage(e),
            {
                requiredPlan: e?.requiredPlan || null,
                limitKey: e?.limitKey || null,
                limit: Number.isFinite(Number(e?.limit)) ? Number(e.limit) : null,
            }
        );
    }
}

/**
 * List invoices for hub sales/dashboard.
 * @param {string} businessId
 * @param {{
 *   limit?: number | null;
 *   offset?: number;
 *   dateFrom?: string | Date | null;
 *   dateTo?: string | Date | null;
 *   includeItems?: boolean;
 *   customerId?: string | null;
 *   statusIn?: string[] | null;
 * }} [options]
 * Defaults: take 500 newest, slim line items. Pass limit: null for unbounded (export).
 */
export async function getInvoicesAction(businessId, options = {}) {
    try {
        const {
            limit = 500,
            offset = 0,
            dateFrom = null,
            dateTo = null,
            includeItems = true,
            customerId = null,
            statusIn = null,
        } = options;

        await checkAuth(businessId, 'sales.view');

        const useLimit = limit !== null && limit !== undefined;
        const take = useLimit ? Math.min(Math.max(Number(limit) || 500, 1), 2000) : undefined;
        const skip = useLimit ? Math.max(Number(offset) || 0, 0) : undefined;

        const dateFilter = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom);
        if (dateTo) dateFilter.lte = new Date(dateTo);

        const normalizedStatuses = Array.isArray(statusIn)
            ? statusIn.map((s) => String(s).toLowerCase()).filter(Boolean)
            : null;

        const invoices = await db.invoices.findMany({
            where: {
                business_id: businessId,
                is_deleted: false,
                ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
                ...(customerId ? { customer_id: customerId } : {}),
                ...(normalizedStatuses?.length
                    ? { status: { in: normalizedStatuses, mode: 'insensitive' } }
                    : {}),
            },
            orderBy: { date: 'desc' },
            ...(useLimit ? { take, skip } : {}),
            include: {
                customers: {
                    select: { name: true, email: true }
                },
                ...(includeItems
                    ? {
                        invoice_items: {
                            select: {
                                id: true,
                                product_id: true,
                                name: true,
                                quantity: true,
                                unit_price: true,
                                total_amount: true,
                                tax_percent: true,
                                tax_amount: true,
                                discount_amount: true,
                                metadata: true,
                            },
                        },
                    }
                    : {}),
            }
        });

        // Map Prisma relational fields to match the legacy expected names
        const mappedInvoices = invoices.map(inv => {
            const { customers, invoice_items, ...rest } = inv;
            const taxHeader = Number(rest.tax_total ?? rest.total_tax ?? 0);
            return serializeDecimalsDeep({
                ...rest,
                tax_total: taxHeader,
                total_tax: taxHeader,
                customer_name: customers?.name || null,
                customer_email: customers?.email || null,
                items: invoice_items || []
            });
        });

        // Enrich open balances via calculate_invoice_balance (partial payments) for Easy AR tiles.
        if (mappedInvoices.length > 0) {
            try {
                const ids = mappedInvoices.map((inv) => inv.id).filter(Boolean);
                const balRes = await pool.query(
                    `
                    SELECT id,
                           COALESCE(calculate_invoice_balance(id), grand_total, 0) AS balance
                    FROM invoices
                    WHERE business_id = $1::uuid
                      AND id = ANY($2::uuid[])
                      AND COALESCE(is_deleted, false) = false
                    `,
                    [businessId, ids]
                );
                const balById = new Map(
                    (balRes.rows || []).map((row) => [String(row.id), Number(row.balance) || 0])
                );
                for (const inv of mappedInvoices) {
                    if (balById.has(String(inv.id))) {
                        const balance = balById.get(String(inv.id));
                        inv.balance = balance;
                        const grand = Number(inv.grand_total) || 0;
                        // Align payment_status with live AR for list/stats (do not rewrite status).
                        if (balance <= 0.009 && grand > 0) {
                            inv.payment_status = 'paid';
                        } else if (balance < grand - 0.009 && balance > 0.009) {
                            inv.payment_status = 'partial';
                        } else if (balance >= grand - 0.009 && grand > 0) {
                            inv.payment_status = inv.payment_status || 'unpaid';
                        }
                    }
                }
            } catch (balErr) {
                // Function may be missing in some envs — fall back to grand_total in UI helpers.
                console.warn('Invoice balance enrichment skipped:', balErr?.message || balErr);
            }
        }

        return await actionSuccess({
            invoices: mappedInvoices,
            hasMore: useLimit ? mappedInvoices.length >= take : false,
        });
    } catch (e) {
        return await actionFailure('GET_INVOICES_FAILED', await getErrorMessage(e));
    }
}

/**
 * Server Action: Void/Delete invoice with automated stock and ledger reversal
 */
export async function deleteInvoiceAction(businessId, invoiceId) {
    try {
        const session = await checkAuth(businessId, 'sales.delete_invoice');

        await assertEntityBelongsToBusiness(null, 'invoice', invoiceId, businessId);
        await InvoiceService.voidInvoice(businessId, invoiceId, session.user.id);

        auditWrite({
            businessId, action: 'void', entityType: 'invoice', entityId: invoiceId,
            description: `Voided/Deleted invoice ${invoiceId}`,
        });

        return await actionSuccess();
    } catch (e) {
        return await actionFailure('DELETE_INVOICE_FAILED', await getErrorMessage(e));
    }
}
export async function updateInvoiceAction(params) {
    try {
        const { invoiceId, invoiceData, items } = params;
        if (!invoiceData?.business_id) throw new Error('Business ID is missing in invoice data');

        // Sanitize numeric fields (Top Level)
        const numericFields = ['subtotal', 'tax_total', 'discount_total', 'grand_total', 'total_tax'];
        const sanitizedData = { ...invoiceData };

        if (sanitizedData.total_tax === undefined && sanitizedData.tax_total !== undefined) {
            sanitizedData.total_tax = sanitizedData.tax_total;
        }

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        // Sanitize Items
        const sanitizedItems = items.map(item => {
            const newItem = { ...item };
            ['quantity', 'unit_price', 'tax_percent', 'tax_amount', 'discount_amount', 'total_amount'].forEach(f => {
                if (newItem[f] !== undefined) {
                    if (typeof newItem[f] === 'string') {
                        const val = parseFloat(newItem[f]);
                        newItem[f] = isNaN(val) ? 0 : val;
                    } else if (newItem[f] === null) {
                        newItem[f] = 0;
                    }
                }
            });
            return newItem;
        });

        // Validate with Zod
        const validation = validateWithSchema(invoiceSchema, { ...sanitizedData, items: sanitizedItems });
        if (!validation.success) {
            return actionFailure('VALIDATION_ERROR', 'Validation failed', validation.errors);
        }

        const validated = validation.data;
        const session = await checkAuth(validated.business_id, 'sales.edit_invoice');

        // Tenant isolation check (Prisma-native)
        await assertEntityBelongsToBusiness(null, 'invoice', invoiceId, validated.business_id);

        // Delegate to InvoiceService (handles stock reversal, header update, item replacement,
        // new stock deduction, GL journal reversal + re-posting, and customer balance correction)
        const invoice = await InvoiceService.updateInvoice(invoiceId, validated, session.user.id);

        auditWrite({
            businessId: invoice.business_id, action: 'update', entityType: 'invoice', entityId: invoice.id,
            description: `Updated invoice ${invoice.invoice_number}`,
            metadata: { invoiceNumber: invoice.invoice_number, grandTotal: invoice.grand_total, customerId: invoice.customer_id },
        });

        return await actionSuccess({ invoice: serializeDecimalsDeep(invoice) });
    } catch (e) {
        console.error("Update Invoice Action Error:", e);
        return await actionFailure('UPDATE_INVOICE_FAILED', await getErrorMessage(e));
    }
}
