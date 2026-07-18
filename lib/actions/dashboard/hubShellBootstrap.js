'use server';

import { getDashboardKPIs } from '@/lib/actions/basic/dashboard';
import { getUnifiedActivityFeedAction } from '@/lib/actions/basic/audit';
import { getInvoicesAction } from '@/lib/actions/basic/invoice';
import { getExpenseBreakdownAction } from '@/lib/actions/premium/ai/analytics';
import { getProductsAction } from '@/lib/actions/standard/inventory/product';
import { getWarehouseLocationsAction } from '@/lib/actions/standard/inventory/warehouse';
import {
    getAccountingSummaryAction,
    getMonthlyFinancialsAction,
} from '@/lib/actions/standard/report';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { withGuard } from '@/lib/rbac/serverGuard';
import { resolveAnalyticsRange } from '@/lib/utils/analyticsRange';
import {
    HUB_SHELL_ACTIVITY_LIMIT,
    HUB_SHELL_INVOICE_LIMIT,
    HUB_SHELL_PRODUCT_PAGE_LIMIT,
} from '@/lib/dashboard/hubShellBootstrapConstants';

function settledValue(result, fallback = null) {
    if (result.status !== 'fulfilled') return fallback;
    return result.value;
}

/**
 * Single-auth hub Overview bootstrap (Zoho/Busy-style cold paint).
 * Nested helpers use skipAuth so membership SQL runs once.
 *
 * @param {string} businessId
 * @param {{ from?: unknown; to?: unknown }} [filter]
 */
export async function getHubShellBootstrapAction(businessId, filter = {}) {
    try {
        await withGuard(businessId, { permission: 'sales.view' });

        const { from, to } = resolveAnalyticsRange(filter);
        const fromDate = new Date(`${from}T00:00:00`);
        const toDate = new Date(`${to}T23:59:59.999`);
        const errors = {};

        const [
            kpisSettled,
            glSettled,
            monthlySettled,
            expenseSettled,
            invoicesSettled,
            productsSettled,
            locationsSettled,
            activitySettled,
        ] = await Promise.allSettled([
            getDashboardKPIs(businessId, {
                dateFrom: fromDate,
                dateTo: toDate,
                skipAuth: true,
            }),
            getAccountingSummaryAction(
                businessId,
                fromDate.toISOString(),
                toDate.toISOString(),
                { skipAuth: true }
            ).catch(() => ({ success: false })),
            getMonthlyFinancialsAction(businessId, 6, { skipAuth: true }),
            getExpenseBreakdownAction(businessId, { from, to, skipAuth: true }),
            getInvoicesAction(businessId, {
                limit: HUB_SHELL_INVOICE_LIMIT,
                offset: 0,
                dateFrom: from,
                dateTo: to,
                includeItems: false,
                skipAuth: true,
            }),
            getProductsAction(businessId, {
                limit: HUB_SHELL_PRODUCT_PAGE_LIMIT,
                offset: 0,
                includeSerials: false,
                skipAuth: true,
            }),
            getWarehouseLocationsAction(businessId, { skipAuth: true }),
            getUnifiedActivityFeedAction(businessId, HUB_SHELL_ACTIVITY_LIMIT, {
                skipAuth: true,
            }),
        ]);

        const kpisRes = settledValue(kpisSettled, { success: false });
        if (kpisSettled.status === 'rejected' || !kpisRes?.success) {
            errors.kpis =
                kpisSettled.status === 'rejected'
                    ? String(kpisSettled.reason?.message || kpisSettled.reason || 'KPIs failed')
                    : kpisRes?.error || 'Could not load dashboard KPIs';
            return await actionFailure(
                'HUB_SHELL_BOOTSTRAP_FAILED',
                errors.kpis
            );
        }

        const glRes = settledValue(glSettled, { success: false });
        if (glSettled.status === 'rejected' || !glRes?.success) {
            errors.glSummary =
                glSettled.status === 'rejected'
                    ? String(glSettled.reason?.message || 'GL summary failed')
                    : glRes?.error || 'GL summary unavailable';
        }

        const monthlyRes = settledValue(monthlySettled, { success: false });
        if (monthlySettled.status === 'rejected' || !monthlyRes?.success) {
            errors.chartSeries =
                monthlySettled.status === 'rejected'
                    ? String(monthlySettled.reason?.message || 'Monthly financials failed')
                    : monthlyRes?.error || 'Monthly financials unavailable';
        }

        const expenseRes = settledValue(expenseSettled, { success: false });
        if (expenseSettled.status === 'rejected' || !expenseRes?.success) {
            errors.expenseBreakdown =
                expenseSettled.status === 'rejected'
                    ? String(expenseSettled.reason?.message || 'Expense breakdown failed')
                    : expenseRes?.error || 'Expense breakdown unavailable';
        }

        const invoicesRes = settledValue(invoicesSettled, { success: false });
        if (invoicesSettled.status === 'rejected' || !invoicesRes?.success) {
            errors.invoices =
                invoicesSettled.status === 'rejected'
                    ? String(invoicesSettled.reason?.message || 'Invoices failed')
                    : invoicesRes?.error || 'Invoices unavailable';
        }

        const productsRes = settledValue(productsSettled, { success: false });
        if (productsSettled.status === 'rejected' || !productsRes?.success) {
            errors.products =
                productsSettled.status === 'rejected'
                    ? String(productsSettled.reason?.message || 'Products failed')
                    : productsRes?.error || 'Products unavailable';
        }

        const locationsRes = settledValue(locationsSettled, { success: false });
        if (locationsSettled.status === 'rejected' || !locationsRes?.success) {
            errors.locations =
                locationsSettled.status === 'rejected'
                    ? String(locationsSettled.reason?.message || 'Locations failed')
                    : locationsRes?.error || 'Locations unavailable';
        }

        const activityRes = settledValue(activitySettled, { success: false });
        if (activitySettled.status === 'rejected' || !activityRes?.success) {
            errors.activity =
                activitySettled.status === 'rejected'
                    ? String(activitySettled.reason?.message || 'Activity failed')
                    : activityRes?.error || 'Activity unavailable';
        }

        const gl = glRes?.success ? glRes.summary : null;
        const profitability = kpisRes.profitability || {};
        const receivables = kpisRes.receivables || {};
        const purchases = kpisRes.purchases || {};
        const payments = kpisRes.payments || {};

        const glReceivable = Number(gl?.accountsReceivable || 0);
        const glPayable = Number(gl?.accountsPayable || 0);
        const glGrossProfit = Number(gl?.grossProfit || 0);

        const receivablesTotal =
            glReceivable > 0 ? glReceivable : Number(receivables.total || 0);
        const payablesTotal =
            glPayable > 0 ? glPayable : Number(purchases.payablesTotal || 0);

        const netProfit = Number(profitability.netProfit ?? 0);
        const grossProfit =
            glGrossProfit > 0 ? glGrossProfit : Number(profitability.grossProfit || 0);

        const products = productsRes?.success ? productsRes.products || [] : [];
        const productTotal = productsRes?.success
            ? Number(productsRes.total ?? products.length)
            : 0;
        const hasMoreProducts = productsRes?.success
            ? Boolean(productsRes.hasMore ?? products.length < productTotal)
            : false;

        const invoices = invoicesRes?.success ? invoicesRes.invoices || [] : [];
        const hasMoreInvoices = invoicesRes?.success
            ? Boolean(invoicesRes.hasMore)
            : false;

        return await actionSuccess({
            range: { from, to },
            kpis: {
                revenue: kpisRes.revenue,
                orders: kpisRes.orders,
                receivables: kpisRes.receivables,
                inventory: kpisRes.inventory,
                expenses: kpisRes.expenses,
            },
            finance: {
                netProfit,
                grossProfit,
                netMargin: Number(profitability.netMargin || gl?.margin || 0),
                receivables: receivablesTotal,
                receivableCount: Number(receivables.count || 0),
                payables: payablesTotal,
                overdueAmount: Number(receivables.overdueTotal || 0),
                overdueCount: Number(receivables.overdueCount || 0),
                netCashFlow: Number(payments.netCashFlow || 0),
                paymentsReceived: Number(payments.received || 0),
                paymentsMade: Number(payments.made || 0),
                periodRevenue: Number(kpisRes.revenue?.total || 0),
                periodExpenses: Number(kpisRes.expenses?.total || 0),
                source: gl ? 'gl_merged' : 'operational',
            },
            glSummary: gl || null,
            chartSeries: monthlyRes?.success ? monthlyRes.analytics || [] : [],
            expenseBreakdown: expenseRes?.success ? expenseRes.data || [] : [],
            activity: activityRes?.success ? activityRes.data || [] : [],
            invoices,
            hasMoreInvoices,
            products,
            productTotal,
            hasMoreProducts,
            locations: locationsRes?.success ? locationsRes.locations || [] : [],
            meta: {
                generatedAt: new Date().toISOString(),
                range: { from, to },
                productPageLimit: HUB_SHELL_PRODUCT_PAGE_LIMIT,
                invoiceLimit: HUB_SHELL_INVOICE_LIMIT,
                activityLimit: HUB_SHELL_ACTIVITY_LIMIT,
                invoiceTruncated: hasMoreInvoices,
            },
            ...(Object.keys(errors).length ? { errors } : {}),
        });
    } catch (error) {
        console.error('Hub shell bootstrap error:', error);
        return await actionFailure('HUB_SHELL_BOOTSTRAP_FAILED', await getErrorMessage(error));
    }
}
