export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api/_shared/middleware';
import { apiSuccess, apiError } from '@/lib/api/_shared/response';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';

/**
 * GET /api/v1/invoices/aging
 * 
 * Get aging report for overdue invoices
 * 
 * Query Parameters:
 * - customer_id (optional): Filter by specific customer
 * - as_of_date (optional): Calculate aging as of this date (ISO format)
 */
export const GET = withApiAuth(async (request, { businessId, session }) => {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');
        const asOfDate = searchParams.get('as_of_date');

        const options = {
            customerId: customerId || undefined,
            asOfDate: asOfDate ? new Date(asOfDate) : new Date()
        };

        const report = await InvoicePaymentService.getAgingReport(businessId, options);

        return apiSuccess(report, 200);
    } catch (error) {
        console.error('[GET /api/v1/invoices/aging] Error:', error);
        return apiError('GET_AGING_REPORT_FAILED', 'Failed to fetch aging report', 500, { message: error.message });
    }
});
