'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MetricSparkline } from '@/components/dashboard/MetricSparkline';
import { KPI_THEMES, type KpiTheme } from '@/lib/dashboard/kpiThemes';
import { formatTrendBadge, shouldShowTrendBadge } from '@/lib/dashboard/advancedDashboardTokens';
import { cn } from '@/lib/utils';

export interface AdvancedKpiCardProps {
    label: string;
    value: string | number;
    /** Prior-period comparison, e.g. "vs PKR 67,500" */
    comparisonLabel?: string;
    trend?: number;
    trendHint?: string;
    icon: React.ElementType;
    theme?: KpiTheme;
    sparkline?: number[];
    invertTrendColor?: boolean;
    actionId?: string;
    onNavigate?: (actionId: string) => void;
    isLoading?: boolean;
    className?: string;
}

export function AdvancedKpiCard({
    label,
    value,
    comparisonLabel,
    trend,
    trendHint,
    icon: Icon,
    theme = 'slate',
    sparkline,
    invertTrendColor = false,
    actionId,
    onNavigate,
    isLoading = false,
    className,
}: AdvancedKpiCardProps) {
    const palette = KPI_THEMES[theme];
    const trendPositive = invertTrendColor ? (trend ?? 0) < 0 : (trend ?? 0) > 0;
    const showTrend = Boolean(trendHint || shouldShowTrendBadge(trend));
    const isClickable = Boolean(actionId && onNavigate);

    const handleActivate = () => {
        if (actionId && onNavigate) onNavigate(actionId);
    };

    if (isLoading) {
        return (
            <Card className={cn('h-full rounded-xl border border-slate-200/90 bg-white shadow-sm animate-pulse', className)}>
                <CardContent className="space-y-2.5 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100" />
                            <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                        <div className="h-5 w-12 bg-slate-100 rounded-full" />
                    </div>
                    <div className="h-6 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                    <div className="h-7 w-full bg-slate-50 rounded" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleActivate : undefined}
            onKeyDown={
                isClickable
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleActivate();
                          }
                      }
                    : undefined
            }
            className={cn(
                'group h-full rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md',
                palette.card,
                isClickable &&
                    'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                className
            )}
        >
            <CardContent className="flex h-full flex-col p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <div
                            className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm',
                                palette.icon
                            )}
                        >
                            <Icon className="h-3.5 w-3.5 text-white" aria-hidden />
                        </div>
                        <p className="truncate text-xs font-medium text-slate-600">{label}</p>
                    </div>
                    {showTrend ? (
                        <span
                            className={cn(
                                'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                trendHint
                                    ? 'bg-amber-50 text-amber-700'
                                    : trendPositive
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-600'
                            )}
                        >
                            {!trendHint && trend !== undefined && trend !== 0 ? (
                                trendPositive ? (
                                    <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                                ) : (
                                    <ArrowDownRight className="h-2.5 w-2.5" aria-hidden />
                                )
                            ) : null}
                            {trendHint ??
                                (trend !== undefined && Number.isFinite(trend)
                                    ? formatTrendBadge(trend, invertTrendColor)
                                    : '0%')}
                        </span>
                    ) : null}
                </div>

                <div className="mt-2 min-w-0">
                    <p className="text-xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
                    {comparisonLabel ? (
                        <p className="mt-0.5 text-[11px] text-slate-500">{comparisonLabel}</p>
                    ) : null}
                </div>

                <div className="mt-auto pt-2">
                    {sparkline && sparkline.length >= 2 ? (
                        <MetricSparkline
                            values={sparkline}
                            strokeClassName={palette.sparkStroke}
                            fillClassName={palette.sparkFill}
                            positiveDirection={invertTrendColor ? 'down' : 'up'}
                            filled
                            className="h-7 w-full"
                        />
                    ) : (
                        <div className="h-7 w-full rounded bg-slate-50/80" aria-hidden />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
