/**
 * Normalizes hub analytics React Query cache payloads.
 * Prefetch (DataContext) and VisualAnalyticsPanel store the full bundle object;
 * consumers must never assume an array-only shape.
 */

import { getAnalyticsBundleAction } from '@/lib/actions/premium/ai/analytics';

export type HubAnalyticsChartBundle = {
    salesTrend: Array<Record<string, unknown>>;
    topProducts: Array<Record<string, unknown>>;
    categoryData: Array<Record<string, unknown>>;
    categoryRevenueData: Array<Record<string, unknown>>;
    dailyRevenueTrend: Array<Record<string, unknown>>;
    comparison: Record<string, unknown> | null;
    orderStatus: {
        current: Record<string, unknown>;
        previous: Record<string, unknown>;
    } | null;
    kpi?: {
        retention?: string;
        retentionDetail?: { repeatCustomers?: number; invoicedCustomers?: number; rate?: number };
    } | null;
};

export const EMPTY_HUB_ANALYTICS_BUNDLE: HubAnalyticsChartBundle = {
    salesTrend: [],
    topProducts: [],
    categoryData: [],
    categoryRevenueData: [],
    dailyRevenueTrend: [],
    comparison: null,
    orderStatus: null,
    kpi: null,
};

export type CategoryChartRow = {
    name: string;
    value: number;
};

export type CategoryChartMode = 'revenue' | 'asset';

export function normalizeHubAnalyticsBundle(data: unknown): HubAnalyticsChartBundle {
    if (Array.isArray(data)) {
        return {
            ...EMPTY_HUB_ANALYTICS_BUNDLE,
            categoryData: data as Array<Record<string, unknown>>,
        };
    }
    if (data && typeof data === 'object') {
        const row = data as Record<string, unknown>;
        return {
            salesTrend: Array.isArray(row.salesTrend) ? row.salesTrend : [],
            topProducts: Array.isArray(row.topProducts) ? row.topProducts : [],
            categoryData: Array.isArray(row.categoryData) ? row.categoryData : [],
            categoryRevenueData: Array.isArray(row.categoryRevenueData) ? row.categoryRevenueData : [],
            dailyRevenueTrend: Array.isArray(row.dailyRevenueTrend) ? row.dailyRevenueTrend : [],
            comparison:
                row.comparison && typeof row.comparison === 'object'
                    ? (row.comparison as Record<string, unknown>)
                    : null,
            orderStatus:
                row.orderStatus && typeof row.orderStatus === 'object'
                    ? (row.orderStatus as HubAnalyticsChartBundle['orderStatus'])
                    : null,
            kpi:
                row.kpi && typeof row.kpi === 'object'
                    ? (row.kpi as HubAnalyticsChartBundle['kpi'])
                    : null,
        };
    }
    return EMPTY_HUB_ANALYTICS_BUNDLE;
}

export function normalizeCategoryChartRows(
    data: unknown,
    mode: CategoryChartMode = 'revenue'
): CategoryChartRow[] {
    const bundle = normalizeHubAnalyticsBundle(data);
    const source =
        mode === 'asset'
            ? bundle.categoryData.map((item) => ({
                  name: String(item.name ?? item.category ?? 'Other'),
                  value: Number(item.assetValue) || Number(item.value) || 0,
              }))
            : bundle.categoryRevenueData.map((item) => ({
                  name: String(item.name ?? item.category ?? 'Other'),
                  value: Number(item.revenue) || Number(item.value) || 0,
              }));
    return source.filter((item) => item.value > 0);
}

function resolveProfitValue(profit: unknown, revenue: unknown): number {
    const profitNum = Number(profit);
    if (Number.isFinite(profitNum) && profitNum !== 0) return profitNum;
    const revenueNum = Number(revenue);
    return Number.isFinite(revenueNum) ? revenueNum : 0;
}

export function normalizeDailyRevenueTrend(data: unknown): Array<{ date: string; revenue: number; profit: number }> {
    return normalizeHubAnalyticsBundle(data).dailyRevenueTrend
        .map((row) => {
            const revenue = Number(row.revenue) || 0;
            return {
                date: String(row.date ?? ''),
                revenue,
                profit: resolveProfitValue(row.profit, revenue),
            };
        })
        .filter((row) => row.date && row.revenue > 0);
}

export function normalizeMonthlySalesTrend(
    data: unknown
): Array<{ date: string; revenue: number; profit: number }> {
    return normalizeHubAnalyticsBundle(data).salesTrend
        .map((row) => {
            const revenue = Number(row.revenue) || Number(row.sales) || 0;
            return {
                date: String(row.date ?? ''),
                revenue,
                profit: resolveProfitValue(row.profit, revenue),
            };
        })
        .filter((row) => row.date);
}

export async function fetchHubAnalyticsBundle(
    businessId: string,
    dateFilter: { from?: string; to?: string }
): Promise<HubAnalyticsChartBundle> {
    const bundle = await getAnalyticsBundleAction(businessId, dateFilter);
    if (!bundle?.success || !bundle.data) {
        return EMPTY_HUB_ANALYTICS_BUNDLE;
    }
    return normalizeHubAnalyticsBundle(bundle.data);
}
