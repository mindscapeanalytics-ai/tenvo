'use client';

import { BRAND_PRIMARY } from '@/lib/theme/brandTokens';
import { memo } from 'react';
import { Portlet } from '@/components/ui/portlet';
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { HUB_MICRO_LABEL, HUB_STAT_VALUE } from '@/lib/utils/typography';
import { cn } from '@/lib/utils';

interface KPIMeterProps {
    title?: string;
    value?: number;
    target?: number;
    prefix?: string;
    suffix?: string;
    color?: string;
    trendValue?: number;
    trendLabel?: string;
    className?: string;
    additionalMetrics?: Array<{
        label: string;
        value: string;
        trend?: 'up' | 'down';
    }>;
}

export const KPIMeter = memo(function KPIMeter({
    title = "Inventory Health",
    value = 85,
    target = 100,
    prefix = "",
    suffix = "%",
    color = BRAND_PRIMARY,
    trendValue = 0,
    trendLabel = "vs previous period",
    className,
    additionalMetrics = []
}: KPIMeterProps) {
    const safeValue = Math.max(0, Math.min(Number(value) || 0, Number(target) || 100));
    const valueColor = safeValue >= 90 ? '#059669' : safeValue >= 70 ? color : '#B45309';

    const data = [
        { name: 'Value', value: safeValue, fill: valueColor },
        { name: 'Gap', value: Math.max(0, target - safeValue), fill: '#F3F4F6' }
    ];

    return (
        <Portlet title={title} className={cn('flex h-full min-h-[22rem] flex-col', className)}>
            <div className="flex h-full min-h-0 flex-col items-center justify-between gap-3">
                <div className="relative flex h-[9.5rem] w-full shrink-0 items-center justify-center sm:h-[11rem]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="58%"
                            innerRadius="68%"
                            outerRadius="100%"
                            barSize={12}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                        >
                            <RadialBar
                                dataKey="value"
                                cornerRadius={10}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Centered Value — sit in gauge bowl */}
                    <div className="pointer-events-none absolute inset-x-0 top-[42%] flex flex-col items-center justify-center">
                        <span className="text-3xl font-semibold leading-none text-gray-900 tabular-nums">
                            {prefix}{safeValue}{suffix}
                        </span>
                        <div className="mt-1.5 flex max-w-[90%] items-center justify-center gap-1 px-1">
                            <TrendingUp className={`h-3 w-3 shrink-0 ${trendValue >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
                            <span className={`text-center text-[10px] font-semibold uppercase tracking-wide leading-tight ${trendValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trendValue >= 0 ? '+' : ''}{trendValue}% {trendLabel}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between gap-2 border-t border-gray-100 pt-3 sm:justify-center sm:gap-6">
                    <div className="min-w-0 flex-1 text-center sm:flex-none">
                        <p className={cn(HUB_MICRO_LABEL, 'mb-1 text-neutral-400')}>Current</p>
                        <p className={cn(HUB_STAT_VALUE, 'text-sm text-neutral-800 tabular-nums')}>{prefix}{safeValue}{suffix}</p>
                    </div>
                    <div className="hidden h-8 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />
                    <div className="min-w-0 flex-1 text-center sm:flex-none">
                        <p className={cn(HUB_MICRO_LABEL, 'mb-1 text-neutral-400')}>Target</p>
                        <p className={cn(HUB_STAT_VALUE, 'text-sm text-neutral-800 tabular-nums')}>{prefix}{target}{suffix}</p>
                    </div>
                    <div className="hidden h-8 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />
                    <div className="min-w-0 flex-1 text-center sm:flex-none">
                        <p className={cn(HUB_MICRO_LABEL, 'mb-1 text-neutral-400')}>Gap</p>
                        <p className={cn(HUB_STAT_VALUE, 'text-sm text-red-600 tabular-nums')}>{Math.max(0, target - safeValue)}{suffix}</p>
                    </div>
                </div>

                {additionalMetrics && additionalMetrics.length > 0 && (
                    <div className="mt-2 grid w-full grid-cols-3 gap-2 border-t border-gray-100 pt-2.5">
                        {additionalMetrics.map((metric, idx) => (
                            <div key={idx} className="px-1 text-center sm:px-2">
                                <p className={cn(HUB_MICRO_LABEL, 'mb-1 truncate text-neutral-400')}>{metric.label}</p>
                                <div className="flex items-center justify-center gap-1">
                                    {metric.trend && (
                                        <TrendingUp 
                                            className={cn(
                                                'h-3 w-3',
                                                metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500 rotate-180'
                                            )} 
                                        />
                                    )}
                                    <p className={cn(
                                        HUB_STAT_VALUE, 
                                        'text-xs',
                                        metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-red-600' : 'text-neutral-800'
                                    )}>
                                        {metric.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Portlet>
    );
});
