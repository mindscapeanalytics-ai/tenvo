export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import { withApiAuth } from '@/lib/api/_shared/middleware';
import { apiSuccess, apiError } from '@/lib/api/_shared/response';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';
import { assertEntityBelongsToBusiness } from '@/lib/actions/_shared/tenant';

/**
 * GET /api/v1/invoices/[id]/payments
 * 
 * Get all payments for a specific invoice
 */
export const GET = withApiAuth(async (request, { businessId, routeParams }) => {
    const client = await pool.connect();
    try {
        const invoiceId = routeParams?.params?.id;
        
        if (!invoiceId) {
            return apiError('MISSING_INVOICE_ID', 'Invoice ID is required', 400);
        }

        // Verify invoice belongs to business
        await assertEntityBelongsToBusiness(client, 'invoice', invoiceId, businessId);

        // Get payments and summary
        const payments = await InvoicePaymentService.getPaymentsForInvoice(businessId, invoiceId, client);
        const summary = await InvoicePaymentService.getPaymentSummary(businessId, invoiceId, client);

        return apiSuccess({ payments, summary }, 200);
    } catch (error) {
        console.error('[GET /api/v1/invoices/[id]/payments] Error:', error);
        
        if (error.message?.includes('does not belong')) {
            return apiError('INVOICE_NOT_FOUND', 'Invoice not found', 404);
        }
        
        return apiError('FETCH_PAYMENTS_FAILED', 'Failed to fetch payments', 500, { message: error.message });
    } finally {
        client.release();
    }
});

/**
 * POST /api/v1/invoices/[id]/payments
 * 
 * Record a new payment against an invoice
 */
const recordPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.enum(['cash', 'card', 'bank_transfer', 'check', 'digital_wallet', 'other']),
    reference_number: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
});

export const POST = withApiAuth(async (request, { businessId, session, role, routeParams }) => {
    try {
        // Check permissions
        if (role === 'viewer') {
            return apiError('FORBIDDEN', 'Insufficient permissions to record payments', 403);
        }

        const invoiceId = routeParams?.params?.id;
        
        if (!invoiceId) {
            return apiError('MISSING_INVOICE_ID', 'Invoice ID is required', 400);
        }

        const body = await request.json();
        
        // Validate request body
        const validation = recordPaymentSchema.safeParse(body);
        if (!validation.success) {
            return apiError('VALIDATION_ERROR', 'Invalid payment data', 400, { errors: validation.error.errors });
        }

        const validatedData = validation.data;

        // Record payment
        const result = await InvoicePaymentService.recordPayment({
            businessId,
            invoiceId,
            amount: validatedData.amount,
            paymentMethod: validatedData.payment_method,
            referenceNumber: validatedData.reference_number,
            notes: validatedData.notes,
            userId: session.user.id
        });

        return apiSuccess(result, 201);
    } catch (error) {
        console.error('[POST /api/v1/invoices/[id]/payments] Error:', error);
        
        if (error.message?.includes('exceeds invoice balance')) {
            return apiError('PAYMENT_EXCEEDS_BALANCE', error.message, 400);
        }
        
        if (error.message?.includes('voided')) {
            return apiError('INVOICE_VOIDED', error.message, 400);
        }
        
        return apiError('RECORD_PAYMENT_FAILED', 'Failed to record payment', 500, { message: error.message });
    }
});
