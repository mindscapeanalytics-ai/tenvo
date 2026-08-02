'use client';

import { useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADVANCED_HEALTH_DIMENSION_COLORS } from '@/lib/dashboard/advancedDashboardTokens';
import { calculateBusinessHealth, getHealthStatus } from '@/lib/analytics/health';
import { cn } from '@/lib/utils';

export interface HealthDimensionScore {
    label: string;
    score: number;
    barColor: string;
}

interface AdvancedBusinessHealthScoreCardProps {
    stats: {
        revenue?: number;
        grossProfit?: number;
        inventoryValue?: number;
        accountsReceivable?: number;
        lowStockCount?: number;
        totalProducts?: number;
        pendingInvoices?: number;
    };
    dimensions?: HealthDimensionScore[];
    className?: string;
}

function SemiGauge({ score, label }: { score: number; label: string }) {
    const gradientId = useId();
    const radius = 62;
    const stroke = 10;
    const circumference = Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const labelTone =
        score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-emerald-600' : score >= 50 ? &apos;text-amber-600&apos; : &apos;text-rose-600&apos;;

    return (
        <div className="relative mx-auto h-[96px] w-[148px] shrink-0 lg:mx-0">
            <svg
                className="h-full w-full"
                viewBox="0 0 148 96"
                aria-hidden
            >
                <path
                    d="M 14 84 A 62 62 0 0 1 134 84"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                <path
                    d="M 14 84 A 62 62 0 0 1 134 84"
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
                <p className="text-3xl font-semibold tabular-nums leading-none text-slate-900">{score}</p>
                <p className={cn('mt-1 text-sm font-semibold leading-none', labelTone)}>{label}</p>
            </div>
        </div>
    );
}

function computeDimensions(stats: AdvancedBusinessHealthScoreCardProps['stats']): HealthDimensionScore[] {
    const revenue = Number(stats.revenue) || 0;
    const grossProfit = Number(stats.grossProfit) || 0;
    const margin = revenue > 0 ? grossProfit / revenue : 0;
    const totalProducts = Math.max(Number(stats.totalProducts) || 0, 1);
    const lowStock = Number(stats.lowStockCount) || 0;
    const stockHealth = ((totalProducts - lowStock) / totalProducts) * 100;
    const ar = Number(stats.accountsReceivable) || 0;
    const pending = Number(stats.pendingInvoices) || 0;

    const financeScore = Math.min(100, Math.round(70 + margin * 60));
    const inventoryScore = Math.min(100, Math.round(stockHealth));
    const operationsScore = Math.min(100, Math.round(100 - pending * 2));
    const customerScore = Math.min(
        100,
        Math.round(100 - (revenue > 0 && ar > revenue * 0.5 ? 20 : 0))
    );
    const growthScore = Math.min(100, Math.round(75 + margin * 25));

    return [
        { label: 'Finance', score: financeScore, barColor: ADVANCED_HEALTH_DIMENSION_COLORS.Finance },
        { label: 'Inventory', score: inventoryScore, barColor: ADVANCED_HEALTH_DIMENSION_COLORS.Inventory },
        { label: 'Operations', score: operationsScore, barColor: ADVANCED_HEALTH_DIMENSION_COLORS.Operations },
        { label: 'Customers', score: customerScore, barColor: ADVANCED_HEALTH_DIMENSION_COLORS.Customers },
        { label: 'Growth', score: growthScore, barColor: ADVANCED_HEALTH_DIMENSION_COLORS.Growth },
    ];
}

function HealthDimension({ dim }: { dim: HealthDimensionScore }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col justify-end">
            <p className="truncate text-[11px] font-medium text-slate-700">{dim.label}</p>
            <p className="mt-0.5 text-[11px] tabular-nums leading-none">
                <span className="font-semibold text-slate-900">{dim.score}</span>
                <span className="font-normal text-slate-400">/100</span>
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={cn('h-full rounded-full transition-all duration-500', dim.barColor)}
                    style={{ width: `${Math.min(100, Math.max(0, dim.score))}%` }}
                />
            </div>
        </div>
    );
}

export function AdvancedBusinessHealthScoreCard({
    stats,
    dimensions,
    className,
}: AdvancedBusinessHealthScoreCardProps) {
    const score = calculateBusinessHealth(stats);
    const status = getHealthStatus(score);
    const dims = dimensions ?? computeDimensions(stats);
    const summary =
        score >= 85
            ? &apos;Your business is performing great! Keep up the good work.&apos;
            : status.description;

    return (
        <Card className={cn('rounded-xl border border-slate-200/90 bg-white shadow-sm', className)}>
            <CardHeader className="border-b border-slate-100 px-4 py-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Business Health Score</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5 xl:gap-6">
                    <SemiGauge score={score} label={status.label} />

                    <p className="max-w-none text-center text-xs leading-relaxed text-slate-500 lg:max-w-[11rem] lg:shrink-0 lg:text-left lg:text-sm">
                        {summary}
                    </p>

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:gap-3 lg:gap-4">
                        {dims.map((dim) => (
                            <HealthDimension key={dim.label} dim={dim} />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
