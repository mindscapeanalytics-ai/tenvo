'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { hubAnalyticsQueryKey } from '@/lib/dashboard/hubQueryKeys';
import { sameTenantPlaceholderData } from '@/lib/dashboard/hubQueryKeys';
import {
    fetchHubAnalyticsBundle,
    normalizeCategoryChartRows,
    type CategoryChartMode,
    type HubAnalyticsChartBundle,
} from '@/lib/dashboard/hubAnalyticsBundle';
import { ADVANCED_DONUT_COLORS } from '@/lib/dashboard/advancedDashboardTokens';
import { CHART_PALETTE } from '@/lib/theme/brandTokens';
import { AdvancedCategoryFilter } from './AdvancedCategoryFilter.client';
import { cn } from '@/lib/utils';

interface AdvancedTopCategoriesCardProps {
    businessId?: string;
    dateRange?: { from: Date; to: Date };
    totalRevenueLabel: string;
    currency?: string;
    colors?: Record<string, unknown>;
    className?: string;
}

/** Screenshot-aligned donut palette */
const CATEGORY_DONUT_COLORS = [...ADVANCED_DONUT_COLORS];

export function AdvancedTopCategoriesCard({
    businessId,
    dateRange,
    totalRevenueLabel,
    currency,
    colors,
    className,
}: AdvancedTopCategoriesCardProps) {
    const resolvedBusinessId = useResolvedBusinessId(businessId);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [shouldLoad, setShouldLoad] = useState(false);
    const [categoryMode, setCategoryMode] = useState<CategoryChartMode>('revenue');

    const dateFilter = useMemo(() => {
        const from = toAnalyticsIsoDate(dateRange?.from);
        const to = toAnalyticsIsoDate(dateRange?.to);
        if (!from || !to) return {};
        return { from, to };
    }, [dateRange]);

    useEffect(() => {
        if (shouldLoad) return undefined;
        const node = containerRef.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            const timer = setTimeout(() => setShouldLoad(true), 0);
            return () => clearTimeout(timer);
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [shouldLoad]);

    const fromKey = dateFilter.from || '';
    const toKey = dateFilter.to || '';

    const analyticsQuery = useQuery<HubAnalyticsChartBundle>({
        queryKey: hubAnalyticsQueryKey(resolvedBusinessId || '__pending__', fromKey, toKey),
        enabled: Boolean(shouldLoad && resolvedBusinessId && fromKey && toKey),
        queryFn: async () => {
            if (!resolvedBusinessId) throw new Error('businessId required');
            return fetchHubAnalyticsBundle(resolvedBusinessId, dateFilter);
        },
        staleTime: 60_000,
        placeholderData: (previousData, previousQuery) =>
            sameTenantPlaceholderData(previousData, previousQuery, resolvedBusinessId),
    });

    const categoryRows = useMemo(
        () => normalizeCategoryChartRows(analyticsQuery.data, categoryMode),
        [analyticsQuery.data, categoryMode]
    );

    const tooltipLabel = categoryMode === 'asset' ? 'Asset value' : 'Revenue';

    const total = useMemo(
        () => categoryRows.reduce((sum, item) => sum + item.value, 0),
        [categoryRows]
    );

    const centerLabel = useMemo(() => {
        if (total <= 0) return totalRevenueLabel;
        const code = currency || 'PKR';
        return `${code} ${Math.round(total).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }, [total, totalRevenueLabel, currency]);

    const loading = !shouldLoad || analyticsQuery.isLoading;

    const palette =
        Array.isArray(colors?.chartPalette) && (colors.chartPalette as string[]).length > 0
            ? (colors.chartPalette as string[])
            : CATEGORY_DONUT_COLORS.length
              ? CATEGORY_DONUT_COLORS
              : CHART_PALETTE;

    return (
        <div ref={containerRef} className={cn('min-w-0 h-full', className)}>
            <Card className="flex h-full flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <CardHeader className="shrink-0 border-b border-slate-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-semibold text-slate-900">Top Categories</CardTitle>
                        <AdvancedCategoryFilter mode={categoryMode} onModeChange={setCategoryMode} />
                    </div>
                </CardHeader>
                <CardContent className="relative min-h-[200px] flex-1 p-2">
                    {loading ? (
                        <div className="flex h-[200px] items-center justify-center animate-pulse">
                            <div className="h-36 w-36 rounded-full bg-slate-100" />
                        </div>
                    ) : categoryRows.length > 0 && total > 0 ? (
                        <div className="flex h-[200px] items-center gap-1">
                            <div className="relative h-full min-w-0 flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryRows}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="54%"
                                            outerRadius="82%"
                                            dataKey="value"
                                            nameKey="name"
                                            paddingAngle={2}
                                            stroke="#fff"
                                            strokeWidth={2}
                                        >
                                            {categoryRows.map((_, index) => (
                                                <Cell
                                                    key={`cat-${index}`}
                                                    fill={palette[index % palette.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value) => [
                                                Number(value).toLocaleString(),
                                                tooltipLabel,
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <p className="max-w-[4.5rem] text-center text-[11px] font-semibold tabular-nums leading-tight text-slate-900">
                                        {centerLabel}
                                    </p>
                                </div>
                            </div>
                            <div className="w-[46%] shrink-0 space-y-1.5 pr-0.5">
                                {categoryRows.slice(0, 5).map((item, index) => {
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    return (
                                        <div
                                            key={`legend-${item.name}-${index}`}
                                            className="flex items-center justify-between gap-1"
                                        >
                                            <div className="flex min-w-0 items-center gap-1">
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-sm"
                                                    style={{
                                                        backgroundColor: palette[index % palette.length],
                                                    }}
                                                />
                                                <span className="truncate text-[10px] text-slate-600">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-500">
                                                {pct}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                            <p className="text-sm text-slate-500">
                                {categoryMode === 'asset'
                                    ? 'Category asset mix appears after inventory is added'
                                    : 'Category revenue mix appears after sales in this period'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
