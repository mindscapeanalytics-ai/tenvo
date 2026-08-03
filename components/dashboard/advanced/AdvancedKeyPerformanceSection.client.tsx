'use client';

import { AdvancedKpiCard, type AdvancedKpiCardProps } from './AdvancedKpiCard.client';
import { AdvancedPeriodFilter, type DashboardDatePreset } from './AdvancedPeriodFilter.client';
import { cn } from '@/lib/utils';

export interface KeyPerformanceMetric extends Omit<AdvancedKpiCardProps, 'onNavigate' | 'className'> {
    id: string;
}

interface AdvancedKeyPerformanceSectionProps {
    metrics: KeyPerformanceMetric[];
    periodLabel: string;
    activePreset?: DashboardDatePreset;
    onDateRangePresetChange?: (preset: Exclude<DashboardDatePreset, 'custom'>) => void;
    onNavigate?: (actionId: string) => void;
    isLoading?: boolean;
    className?: string;
}

export function AdvancedKeyPerformanceSection({
    metrics,
    periodLabel,
    activePreset,
    onDateRangePresetChange,
    onNavigate,
    isLoading = false,
    className,
}: AdvancedKeyPerformanceSectionProps) {
    return (
        <section className={cn('min-w-0', className)}>
            <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-sm font-semibold text-slate-900">Key Performance</h2>
                <AdvancedPeriodFilter
                    periodLabel={periodLabel}
                    activePreset={activePreset}
                    onPresetChange={onDateRangePresetChange}
                    compact
                />
            </div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <AdvancedKpiCard
                        key={metric.id}
                        label={metric.label}
                        value={metric.value}
                        comparisonLabel={metric.comparisonLabel}
                        trend={metric.trend}
                        trendHint={metric.trendHint}
                        icon={metric.icon}
                        theme={metric.theme}
                        sparkline={metric.sparkline}
                        invertTrendColor={metric.invertTrendColor}
                        actionId={metric.actionId}
                        onNavigate={onNavigate}
                        isLoading={isLoading || metric.isLoading}
                    />
                ))}
            </div>
        </section>
    );
}
