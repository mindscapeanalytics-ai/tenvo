'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesTrendAreaChart } from '@/components/AdvancedCharts';
import {
    ADVANCED_CHART_COLORS,
    formatTrendBadge,
    shouldShowTrendBadge,
} from '@/lib/dashboard/advancedDashboardTokens';
import {
    defaultRevenueGranularity,
    resolveRevenueChartSeries,
    type RevenueGranularity,
} from '@/lib/dashboard/revenueChartSeries';
import {
    fetchHubAnalyticsBundle,
    normalizeDailyRevenueTrend,
    normalizeMonthlySalesTrend,
    type HubAnalyticsChartBundle,
} from '@/lib/dashboard/hubAnalyticsBundle';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { hubAnalyticsQueryKey, sameTenantPlaceholderData } from '@/lib/dashboard/hubQueryKeys';
import { cn } from '@/lib/utils';

interface InvoiceLike {
    date?: string | Date;
    status?: string;
    grand_total?: number | string;
    amount?: number | string;
}

interface AdvancedRevenueOverviewCardProps {
    businessId?: string;
    totalRevenue: string;
    revenueTrend: number;
    chartData?: Array<Record<string, unknown>>;
    invoices?: InvoiceLike[];
    dateRange?: { from: Date; to: Date };
    currency?: string;
    periodLabel?: string;
    isLoading?: boolean;
    className?: string;
}

const GRANULARITY_TABS: { id: RevenueGranularity; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
];

export function AdvancedRevenueOverviewCard({
    businessId,
    totalRevenue,
    revenueTrend,
    chartData = [],
    invoices = [],
    dateRange,
    currency,
    periodLabel = 'Last 30 days',
    isLoading = false,
    className,
}: AdvancedRevenueOverviewCardProps) {
    const resolvedBusinessId = useResolvedBusinessId(businessId);
    const [granularity, setGranularity] = useState<RevenueGranularity>('weekly');

    const dateFilter = useMemo(() => {
        const from = toAnalyticsIsoDate(dateRange?.from);
        const to = toAnalyticsIsoDate(dateRange?.to);
        if (!from || !to) return {};
        return { from, to };
    }, [dateRange]);

    const fromKey = dateFilter.from || '';
    const toKey = dateFilter.to || '';

    const analyticsQuery = useQuery<HubAnalyticsChartBundle>({
        queryKey: hubAnalyticsQueryKey(resolvedBusinessId || '__pending__', fromKey, toKey),
        enabled: Boolean(resolvedBusinessId && fromKey && toKey),
        queryFn: async () => {
            if (!resolvedBusinessId) throw new Error('businessId required');
            return fetchHubAnalyticsBundle(resolvedBusinessId, dateFilter);
        },
        staleTime: 60_000,
        placeholderData: (previousData, previousQuery) =>
            sameTenantPlaceholderData(previousData, previousQuery, resolvedBusinessId),
    });

    const rangeKey = `${dateRange?.from?.getTime?.() ?? ''}-${dateRange?.to?.getTime?.() ?? ''}`;

    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
            setGranularity(defaultRevenueGranularity(dateRange));
        }
    }, [rangeKey, dateRange]);

    const series = useMemo(() => {
        const dailyRevenueTrend = normalizeDailyRevenueTrend(analyticsQuery.data);
        const monthlySalesTrend = normalizeMonthlySalesTrend(analyticsQuery.data);
        if (!dateRange?.from || !dateRange?.to) {
            return resolveRevenueChartSeries(
                chartData,
                invoices,
                { from: new Date(), to: new Date() },
                granularity,
                { dailyRevenueTrend, monthlySalesTrend }
            );
        }
        return resolveRevenueChartSeries(chartData, invoices, dateRange, granularity, {
            dailyRevenueTrend,
            monthlySalesTrend,
        });
    }, [analyticsQuery.data, chartData, invoices, dateRange, granularity]);

    const trendPositive = revenueTrend >= 0;
    const showTrend = shouldShowTrendBadge(revenueTrend);

    if (isLoading) {
        return (
            <Card className={cn('rounded-xl border border-slate-200/90 bg-white shadow-sm animate-pulse', className)}>
                <CardHeader className="border-b border-slate-100 px-3 py-2.5">
                    <div className="h-4 w-36 bg-slate-100 rounded" />
                </CardHeader>
                <CardContent className="space-y-3 p-3">
                    <div className="h-7 w-32 bg-slate-200 rounded" />
                    <div className="h-[200px] bg-slate-50 rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('flex h-full flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 space-y-0 border-b border-slate-100 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-slate-900">Revenue Overview</CardTitle>
                    <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {GRANULARITY_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setGranularity(tab.id)}
                                className={cn(
                                    'rounded-md px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                                    granularity === tab.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                    <p className="text-xl font-semibold tabular-nums tracking-tight text-slate-900">{totalRevenue}</p>
                    {showTrend ? (
                        <span
                            className={cn(
                                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                            )}
                        >
                            {trendPositive ? (
                                <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                            ) : (
                                <ArrowDownRight className="h-2.5 w-2.5" aria-hidden />
                            )}
                            {formatTrendBadge(revenueTrend)} vs prior {periodLabel.toLowerCase()}
                        </span>
                    ) : null}
                </div>
                <p className="text-[11px] text-slate-500">Total Revenue</p>
            </CardHeader>
            <CardContent className="min-h-[200px] flex-1 p-2 pt-3">
                {series.length > 0 && series.some((row) => Number(row.revenue) > 0) ? (
                    <div className="h-[200px] w-full min-w-0">
                        <SalesTrendAreaChart
                            data={series}
                            colors={ADVANCED_CHART_COLORS}
                            currency={currency}
                        />
                    </div>
                ) : (
                    <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                        <p className="text-xs text-slate-500">Revenue data will appear after your first sales</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
