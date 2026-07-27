'use client';

import { ArrowDownRight, ArrowUpRight, Package, PackageCheck, PackageX, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTrendBadge, shouldShowTrendBadge } from '@/lib/dashboard/advancedDashboardTokens';
import { AdvancedPeriodFilter, type DashboardDatePreset } from './AdvancedPeriodFilter.client';
import { cn } from '@/lib/utils';

export interface OrderSummaryTile {
    label: string;
    value: number | string;
    trend?: number;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    invertTrend?: boolean;
}

interface AdvancedOrdersSummaryCardProps {
    tiles: OrderSummaryTile[];
    periodLabel: string;
    activePreset?: DashboardDatePreset;
    onDateRangePresetChange?: (preset: Exclude<DashboardDatePreset, 'custom'>) => void;
    isLoading?: boolean;
    className?: string;
}

function SummaryTile({
    tile,
    bordered,
}: {
    tile: OrderSummaryTile;
    bordered?: 'right' | 'bottom' | 'both';
}) {
    const trendPositive = tile.invertTrend ? (tile.trend ?? 0) < 0 : (tile.trend ?? 0) > 0;
    const showTrend = shouldShowTrendBadge(tile.trend);

    return (
        <div
            className={cn(
                'flex min-h-[72px] items-start gap-2.5 p-3',
                bordered === 'right' && 'border-r border-slate-100',
                bordered === 'bottom' && 'border-b border-slate-100',
                bordered === 'both' && 'border-r border-b border-slate-100'
            )}
        >
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tile.iconBg)}>
                <tile.icon className={cn('h-3.5 w-3.5', tile.iconColor)} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                    <p className="text-[11px] font-medium text-slate-500">{tile.label}</p>
                    {showTrend ? (
                        <span
                            className={cn(
                                'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px] font-semibold tabular-nums',
                                trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                            )}
                        >
                            {trendPositive ? (
                                <ArrowUpRight className="h-2 w-2" aria-hidden />
                            ) : (
                                <ArrowDownRight className="h-2 w-2" aria-hidden />
                            )}
                            {formatTrendBadge(tile.trend ?? 0, tile.invertTrend)}
                        </span>
                    ) : null}
                </div>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{tile.value}</p>
            </div>
        </div>
    );
}

export function AdvancedOrdersSummaryCard({
    tiles,
    periodLabel,
    activePreset,
    onDateRangePresetChange,
    isLoading = false,
    className,
}: AdvancedOrdersSummaryCardProps) {
    const defaultTiles: OrderSummaryTile[] = [
        { label: 'Open Orders', value: 0, icon: Package, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
        { label: 'Pending Orders', value: 0, icon: ShoppingCart, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'Completed Orders', value: 0, icon: PackageCheck, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
        { label: 'Cancelled Orders', value: 0, icon: PackageX, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', invertTrend: true },
    ];

    const displayTiles = tiles.length >= 4 ? tiles.slice(0, 4) : defaultTiles;

    if (isLoading) {
        return (
            <Card className={cn('rounded-xl border border-slate-200/90 bg-white shadow-sm animate-pulse', className)}>
                <CardHeader className="border-b border-slate-100 px-3 py-2.5">
                    <div className="h-4 w-28 bg-slate-100 rounded" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 p-0">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[72px] border border-slate-50 p-3" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-slate-900">Orders Summary</CardTitle>
                    <AdvancedPeriodFilter
                        periodLabel={periodLabel}
                        activePreset={activePreset}
                        onPresetChange={onDateRangePresetChange}
                        compact
                        buttonClassName="border-slate-200 px-2 py-0.5"
                    />
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 p-0">
                <SummaryTile tile={displayTiles[0]!} bordered="both" />
                <SummaryTile tile={displayTiles[1]!} bordered="bottom" />
                <SummaryTile tile={displayTiles[2]!} bordered="right" />
                <SummaryTile tile={displayTiles[3]!} />
            </CardContent>
        </Card>
    );
}
