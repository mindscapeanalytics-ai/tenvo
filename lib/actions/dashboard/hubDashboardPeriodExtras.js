'use server';

import pool from '@/lib/db';
import {
    SALES_KPI_PERIOD_SQL,
    SALES_ORDER_STATUS_PERIOD_SQL,
    mapOrderStatusRow,
} from '@/lib/analytics/salesInsights';
import { resolveSalesPerformanceRange } from '@/lib/analytics/salesPerformanceFilter';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';

/**
 * Prior-period comparison + unified order status for hub dashboard cold paint.
 *
 * @param {string} businessId
 * @param {{ from?: unknown; to?: unknown }} [filter]
 */
export async function getHubDashboardPeriodExtras(businessId, filter = {}) {
    if (!businessId) {
        return actionFailure('MISSING_BUSINESS_ID', 'Business ID is required');
    }
    const client = await pool.connect();
    try {
        const { from, to, prevFrom, prevTo } = resolveSalesPerformanceRange(filter);
        const [curKpiRes, prevKpiRes, curStatusRes, prevStatusRes] = await Promise.all([
            client.query(SALES_KPI_PERIOD_SQL, [businessId, from, to, 'all']),
            client.query(SALES_KPI_PERIOD_SQL, [businessId, prevFrom, prevTo, 'all']),
            client.query(SALES_ORDER_STATUS_PERIOD_SQL, [businessId, from, to]),
            client.query(SALES_ORDER_STATUS_PERIOD_SQL, [businessId, prevFrom, prevTo]),
        ]);

        const curKpi = curKpiRes.rows[0] || {};
        const prevKpi = prevKpiRes.rows[0] || {};

        return actionSuccess({
            range: { from, to, prevFrom, prevTo },
            comparison: {
                priorRevenue: parseFloat(prevKpi.gross_total) || 0,
                priorOrders: parseInt(prevKpi.order_count, 10) || 0,
                priorCollected: parseFloat(prevKpi.collected_total) || 0,
                periodRevenue: parseFloat(curKpi.gross_total) || 0,
                periodOrders: parseInt(curKpi.order_count, 10) || 0,
                periodCollected: parseFloat(curKpi.collected_total) || 0,
                periodCustomers: parseInt(curKpi.active_customers, 10) || 0,
                priorCustomers: parseInt(prevKpi.active_customers, 10) || 0,
            },
            orderStatus: {
                current: mapOrderStatusRow(curStatusRes.rows[0] || {}),
                previous: mapOrderStatusRow(prevStatusRes.rows[0] || {}),
            },
        });
    } catch (error) {
        console.error('Hub dashboard period extras error:', error);
        return actionFailure('HUB_PERIOD_EXTRAS_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}
