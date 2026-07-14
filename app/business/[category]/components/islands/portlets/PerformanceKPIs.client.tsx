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
        <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2 pt-3 px-3.5 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Period Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5">
                <div className="grid grid-cols-2 gap-2">
                    {kpis.map((kpi, idx) => (
                        <div
                            key={idx}
                            className="rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-2 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                                    {kpi.label}
                                </span>
                                {kpi.change !== undefined && (
                                    <div className="flex items-center gap-0.5">
                                        {kpi.trend === 'up' && (
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        )}
                                        {kpi.trend === 'down' && (
                                            <TrendingDown className="w-3 h-3 text-red-500" />
                                        )}
                                        {kpi.trend === 'neutral' && (
                                            <Minus className="w-3 h-3 text-slate-400" />
                                        )}
                                        <span
                                            className={cn(
                                                'text-[9px] font-semibold tabular-nums',
                                                kpi.trend === 'up' && 'text-emerald-600',
                                                kpi.trend === 'down' && 'text-red-600',
                                                kpi.trend === 'neutral' && 'text-slate-400'
                                            )}
                                        >
                                            {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className={cn('text-base font-bold tabular-nums', kpi.colorClass)}>
                                {kpi.value}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
});
