'use server';

import pool from '@/lib/db';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';
import { InvoiceService } from '@/lib/services/InvoiceService';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { withGuard } from '@/lib/rbac/serverGuard';

async function checkAuth(businessId, permission = 'sales.view') {
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Record a payment against an invoice
 */
export async function recordInvoicePaymentAction(params) {
    try {
        const { businessId, invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes, userId } = params;
        
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const session = await checkAuth(businessId, 'sales.record_payment');
        
        const result = await InvoicePaymentService.recordPayment({
            businessId,
            invoiceId,
            amount,
            paymentMethod,
            paymentDate,
            referenceNumber,
            notes,
            userId: userId || session.user.id
        });

        auditWrite({
            businessId,
            action: 'record_payment',
            entityType: 'invoice_payment',
            entityId: result.payment.id,
            description: `Recorded ${paymentMethod} payment of ${amount} against invoice ${result.invoice.invoice_number}`,
            metadata: { 
                invoiceId, 
                amount, 
                paymentMethod,
                invoiceNumber: result.invoice.invoice_number,
                isFullyPaid: result.invoice.is_fully_paid
            }
        });

        return actionSuccess(result);
    } catch (error) {
        console.error('Record Invoice Payment Error:', error);
        return actionFailure(
            error.code || 'RECORD_PAYMENT_FAILED',
            await getErrorMessage(error)
        );
    }
}

/**
 * Get payments for an invoice
 */
export async function getInvoicePaymentsAction(businessId, invoiceId) {
    try {
        await checkAuth(businessId, 'sales.view');
        
        const payments = await InvoicePaymentService.getPaymentsForInvoice(businessId, invoiceId);
        const summary = await InvoicePaymentService.getPaymentSummary(businessId, invoiceId);
        
        return actionSuccess({ payments, summary });
    } catch (error) {
        console.error('Get Invoice Payments Error:', error);
        return actionFailure('GET_PAYMENTS_FAILED', await getErrorMessage(error));
    }
}

/**
 * Get payment summary for an invoice
 */
export async function getInvoicePaymentSummaryAction(businessId, invoiceId) {
    try {
        await checkAuth(businessId, 'sales.view');
        
        const summary = await InvoicePaymentService.getPaymentSummary(businessId, invoiceId);
        
        return actionSuccess({ summary });
    } catch (error) {
        console.error('Get Invoice Payment Summary Error:', error);
        return actionFailure('GET_PAYMENT_SUMMARY_FAILED', await getErrorMessage(error));
    }
}

/**
 * Void a payment
 */
export async function voidInvoicePaymentAction(params) {
    try {
        const { businessId, paymentId, reason } = params;
        
        const session = await checkAuth(businessId, 'sales.void_payment');
        
        const result = await InvoicePaymentService.voidPayment(
            businessId,
            paymentId,
            session.user.id,
            reason
        );

        auditWrite({
            businessId,
            action: 'void_payment',
            entityType: 'invoice_payment',
            entityId: paymentId,
            description: `Voided payment of ${result.voided_amount}`,
            metadata: { paymentId, reason, voidedAmount: result.voided_amount }
        });

        return actionSuccess(result);
    } catch (error) {
        console.error('Void Invoice Payment Error:', error);
        return actionFailure('VOID_PAYMENT_FAILED', await getErrorMessage(error));
    }
}

/**
 * Get aging report
 */
export async function getInvoiceAgingReportAction(businessId, options = {}) {
    try {
        await checkAuth(businessId, 'sales.view');
        
        const report = await InvoicePaymentService.getAgingReport(businessId, options);
        
        return actionSuccess(report);
    } catch (error) {
        console.error('Get Invoice Aging Report Error:', error);
        return actionFailure('GET_AGING_REPORT_FAILED', await getErrorMessage(error));
    }
}

/**
 * Pre-validate stock for invoice items
 * Checks if sufficient stock is available before creating invoice
 */
export async function prevalidateInvoiceStockAction(businessId, items) {
    try {
        await checkAuth(businessId, 'sales.view');
        
        const client = await pool.connect();
        try {
            const validationResults = [];
            
            for (const item of items) {
                if (!item.product_id) {
                    validationResults.push({
                        item: item.name || 'Unnamed Item',
                        productId: null,
                        requested: item.quantity,
                        available: null,
                        isValid: true, // Non-product items don't need stock validation
                        skipReason: 'No product linked'
                    });
                    continue;
                }
                
                // Canonical stock: products.stock minus active reservations (see InventoryService.getAvailableStock)
                const stockRes = await client.query(`
                    SELECT 
                        COALESCE(p.stock, 0) as total_stock,
                        COALESCE((SELECT SUM(quantity) 
                         FROM inventory_reservations 
                         WHERE product_id = $1 
                           AND business_id = $2
                           AND status = 'active'), 0) as reserved
                    FROM products p
                    WHERE p.id = $1 AND p.business_id = $2
                `, [item.product_id, businessId]);
                
                const totalStock = Number(stockRes.rows[0]?.total_stock || 0);
                const reserved = Number(stockRes.rows[0]?.reserved || 0);
                const available = totalStock - reserved;
                
                validationResults.push({
                    item: item.name,
                    productId: item.product_id,
                    requested: item.quantity,
                    available: available,
                    reserved: reserved,
                    totalStock: totalStock,
                    isValid: available >= item.quantity,
                    shortfall: Math.max(0, item.quantity - available)
                });
            }
            
            const allValid = validationResults.every(r => r.isValid);
            const totalShortfall = validationResults.reduce((sum, r) => sum + (r.shortfall || 0), 0);
            
            return actionSuccess({
                items: validationResults,
                allValid,
                totalShortfall,
                canProceed: allValid
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Prevalidate Invoice Stock Error:', error);
        return actionFailure('STOCK_VALIDATION_FAILED', await getErrorMessage(error));
    }
}
