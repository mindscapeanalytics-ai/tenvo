'use client';

import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIItem {
    label: string;
    value: string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    colorClass?: string;
}

interface PerformanceKPIsProps {
    revenue: string;
    revenueChange: number;
    orders: number;
    ordersChange: number;
    customers: number;
    customersChange: number;
    avgOrderValue: string;
    avgOrderValueChange?: number;
    className?: string;
}

export const PerformanceKPIs = memo(function PerformanceKPIs({
    revenue,
    revenueChange,
    orders,
    ordersChange,
    customers,
    customersChange,
    avgOrderValue,
    avgOrderValueChange,
    className,
}: PerformanceKPIsProps) {
    const kpis: KPIItem[] = [
        {
            label: 'Revenue',
            value: revenue,
            change: revenueChange,
            trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral',
            colorClass: 'text-emerald-600',
        },
        {
            label: 'Orders',
            value: orders.toString(),
            change: ordersChange,
            trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'neutral',
            colorClass: 'text-cyan-600',
        },
        {
            label: 'Customers',
            value: customers.toString(),
            change: customersChange,
            trend: customersChange > 0 ? 'up' : customersChange < 0 ? 'down' : 'neutral',
            colorClass: 'text-violet-600',
        },
        {
            label: 'Avg Order',
            value: avgOrderValue,
            change: avgOrderValueChange,
            trend: avgOrderValueChange && avgOrderValueChange > 0 ? 'up' : avgOrderValueChange && avgOrderValueChange < 0 ? 'down' : 'neutral',
            colorClass: 'text-amber-600',
        },
    ];

    return (
        <Card className={cn('flex h-full flex-col border-slate-200 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-3 py-2">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                    Period Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center p-2">
                <div className="grid grid-cols-2 gap-1.5">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-2"
                        >
                            <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                    {kpi.label}
                                </span>
                                {kpi.change !== undefined ? (
                                    <span
                                        className={cn(
                                            'inline-flex shrink-0 items-center gap-0.5 text-[9px] font-semibold tabular-nums',
                                            kpi.trend === 'up' && 'text-emerald-600',
                                            kpi.trend === 'down' && 'text-red-600',
                                            kpi.trend === 'neutral' && 'text-slate-400'
                                        )}
                                    >
                                        {kpi.trend === 'up' ? (
                                            <TrendingUp className="h-2.5 w-2.5" aria-hidden />
                                        ) : kpi.trend === 'down' ? (
                                            <TrendingDown className="h-2.5 w-2.5" aria-hidden />
                                        ) : (
                                            <Minus className="h-2.5 w-2.5" aria-hidden />
                                        )}
                                        {kpi.change > 0 ? '+' : ''}
                                        {kpi.change.toFixed(0)}%
                                    </span>
                                ) : null}
                            </div>
                            <p className={cn('mt-0.5 truncate text-sm font-semibold tabular-nums leading-tight', kpi.colorClass)}>
                                {kpi.value}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
});
