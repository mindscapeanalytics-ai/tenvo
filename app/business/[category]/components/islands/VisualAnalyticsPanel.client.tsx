'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, PieChart, TrendingUp, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    SalesTrendAreaChart,
    RevenueBarChart,
    CategoryPieChart,
    TopProductsChart,
} from '@/components/AdvancedCharts';
import { getAnalyticsBundleAction } from '@/lib/actions/premium/ai/analytics';
import { getDomainColors } from '@/lib/domainColors';
import { resolveOperationsProfile } from '@/lib/dashboard/domainOperationsIntelligence';
import { getVisualAnalyticsCopy } from '@/lib/dashboard/visualAnalyticsLabels';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import {
    hubAnalyticsQueryKey,
} from '@/lib/dashboard/hubQueryKeys';
import { cn } from '@/lib/utils';

interface VisualAnalyticsPanelProps {
    /** Optional — falls back to BusinessContext when parents pass `business?.id` during hydrate */
    businessId?: string;
    category?: string;
    business?: { name?: string; country?: string; settings?: Record<string, unknown> } | null;
    domainKnowledge?: Record<string, unknown> | null;
    dateRange?: { from: Date; to: Date };
    currency?: string;
}

/** Lean chart payload shared with DataContext idle prefetch (`hubAnalytics`). */
type HubAnalyticsChartBundle = {
    salesTrend: Array<Record<string, unknown>>;
    topProducts: Array<Record<string, unknown>>;
    categoryData: Array<Record<string, unknown>>;
};

const EMPTY_ANALYTICS_BUNDLE: HubAnalyticsChartBundle = {
    salesTrend: [],
    topProducts: [],
    categoryData: [],
};

function buildDateFilter(dateRange?: { from: Date; to: Date }) {
    const from = toAnalyticsIsoDate(dateRange?.from);
    const to = toAnalyticsIsoDate(dateRange?.to);
    if (!from || !to) return {};
    return { from, to };
}

const CHART_ACCENTS = {
    emerald: {
        shell: 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 via-white to-white',
        icon: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30',
    },
    violet: {
        shell: 'border-violet-200/60 bg-gradient-to-br from-violet-50/40 via-white to-white',
        icon: 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30',
    },
    amber: {
        shell: 'border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-white',
        icon: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30',
    },
    cyan: {
        shell: 'border-cyan-200/60 bg-gradient-to-br from-cyan-50/40 via-white to-white',
        icon: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30',
    },
} as const;

function ChartShell({
    title,
    description,
    icon: Icon,
    accent = 'emerald',
    children,
    className,
    chartHeight = 'h-[220px]',
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    accent?: keyof typeof CHART_ACCENTS;
    children: React.ReactNode;
    className?: string;
    chartHeight?: string;
}) {
    const tone = CHART_ACCENTS[accent];
    return (
        <Card
            className={cn(
                'overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 backdrop-blur-sm',
                tone.shell,
                className
            )}
        >
            <CardHeader className="pb-1.5 pt-3 px-3 border-b border-white/80 bg-white/50">
                <div className="flex items-start gap-2">
                    <div
                        className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-md ring-2 ring-white/80',
                            tone.icon
                        )}
                    >
                        <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-xs font-semibold text-slate-900 tracking-tight">{title}</CardTitle>
                        <CardDescription className="text-[10px] mt-0.5 text-slate-500 line-clamp-1">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cn('p-2.5 pt-3', chartHeight)}>{children}</CardContent>
        </Card>
    );
}

function AnalyticsSkeleton({ containerRef }: { containerRef?: React.Ref<HTMLDivElement> }) {
    return (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
            <div className="md:col-span-2 h-[300px] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50" />
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-[280px] rounded-2xl bg-slate-100" />
            ))}
        </div>
    );
}

export function VisualAnalyticsPanel({
    businessId,
    category = 'retail-shop',
    business,
    domainKnowledge,
    dateRange,
    currency,
}: VisualAnalyticsPanelProps) {
    const resolvedBusinessId = useResolvedBusinessId(businessId);
    const colors = getDomainColors(category);
    const copy = useMemo(
        () => getVisualAnalyticsCopy(resolveOperationsProfile(category, domainKnowledge || undefined, business)),
        [category, domainKnowledge, business]
    );
    // Defer the heavy analytics bundle until the panel is near the viewport so it
    // never competes with the dashboard bootstrap fetches on cold load.
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [shouldLoad, setShouldLoad] = useState(false);
    const dateFilter = useMemo(() => buildDateFilter(dateRange), [dateRange]);

    useEffect(() => {
        if (shouldLoad) return undefined;
        const node = containerRef.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            const timer = setTimeout(() => setShouldLoad(true), 0);
            return () => clearTimeout(timer);
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [shouldLoad]);

    const canFetch = Boolean(shouldLoad && resolvedBusinessId);
    const fromKey = dateFilter.from || '';
    const toKey = dateFilter.to || '';

    const analyticsQuery = useQuery<HubAnalyticsChartBundle>({
        queryKey: hubAnalyticsQueryKey(resolvedBusinessId || '__pending__', fromKey, toKey),
        enabled: canFetch && Boolean(fromKey && toKey),
        queryFn: async (): Promise<HubAnalyticsChartBundle> => {
            // enabled requires resolvedBusinessId; narrow for TypeScript + runtime safety
            if (!resolvedBusinessId) {
                throw new Error('VisualAnalyticsPanel: businessId required when analytics query is enabled');
            }
            const bundle = await getAnalyticsBundleAction(resolvedBusinessId, dateFilter);
            if (!bundle?.success || !bundle.data) {
                return EMPTY_ANALYTICS_BUNDLE;
            }
            return {
                salesTrend: Array.isArray(bundle.data.salesTrend) ? bundle.data.salesTrend : [],
                topProducts: Array.isArray(bundle.data.topProducts) ? bundle.data.topProducts : [],
                categoryData: Array.isArray(bundle.data.categoryData) ? bundle.data.categoryData : [],
            };
        },
        staleTime: 60_000,
        // Inline tenant guard keeps TanStack placeholderData typed to HubAnalyticsChartBundle
        // (JS helper return was inferred as {} and broke useQuery overloads).
        placeholderData: (previousData, previousQuery) => {
            if (previousData == null || !resolvedBusinessId || !previousQuery?.queryKey) {
                return undefined;
            }
            if (previousQuery.queryKey[1] !== resolvedBusinessId) {
                return undefined;
            }
            return previousData;
        },
    });

    // Keep skeleton while tenant id is still hydrating — never treat that as “no sales history”.
    // Keep previous charts when revalidating (Zoho-style soft refresh).
    const loading =
        !resolvedBusinessId ||
        !shouldLoad ||
        (analyticsQuery.isLoading && !analyticsQuery.data);

    if (loading) {
        return <AnalyticsSkeleton containerRef={containerRef} />;
    }

    const salesData = analyticsQuery.data?.salesTrend || [];
    const topProducts = analyticsQuery.data?.topProducts || [];
    const categoryData = analyticsQuery.data?.categoryData || [];

    const hasData =
        salesData.some((d) => Number(d.revenue) > 0 || Number(d.profit) > 0) ||
        topProducts.length > 0 ||
        categoryData.length > 0;

    if (!hasData) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100">
                    <BarChart3 className="h-7 w-7 text-violet-500" />
                </div>
                <p className="text-sm font-bold text-slate-800">Visual studio needs more transaction history</p>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">{copy.emptyHint}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-0.5 px-0.5">
                <p className="text-xs font-semibold text-slate-800">{copy.studioSubtitle}</p>
                <p className="text-[10px] text-slate-500">Revenue, mix, and top performers for this period.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <ChartShell
                    title={copy.revenueTitle}
                    description={copy.revenueDesc}
                    icon={TrendingUp}
                    accent="emerald"
                    className="lg:col-span-8"
                    chartHeight="h-[200px]"
                >
                    <SalesTrendAreaChart data={salesData} colors={colors} currency={currency} />
                </ChartShell>

                <ChartShell
                    title={copy.topTitle}
                    description={copy.topDesc}
                    icon={Package}
                    accent="amber"
                    className="lg:col-span-4"
                    chartHeight="h-[200px]"
                >
                    <TopProductsChart data={topProducts} colors={colors} currency={currency} />
                </ChartShell>

                <ChartShell
                    title={copy.categoryTitle}
                    description={copy.categoryDesc}
                    icon={PieChart}
                    accent="violet"
                    className="lg:col-span-4"
                    chartHeight="h-[200px]"
                >
                    <CategoryPieChart data={categoryData} colors={colors} />
                </ChartShell>

                <ChartShell
                    title={copy.barTitle}
                    description={copy.barDesc}
                    icon={BarChart3}
                    accent="cyan"
                    className="lg:col-span-8"
                    chartHeight="h-[200px]"
                >
                    <RevenueBarChart data={salesData} colors={colors} currency={currency} />
                </ChartShell>
            </div>
        </div>
    );
}
