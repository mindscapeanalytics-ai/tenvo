'use client';

import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DATE_RANGE_PRESETS } from '@/lib/utils/datePresets';
import { cn } from '@/lib/utils';

export type DashboardDatePreset =
    | 'today'
    | 'yesterday'
    | '7d'
    | '30d'
    | '90d'
    | 'mtd'
    | 'last_month'
    | 'ytd'
    | 'custom';

interface AdvancedPeriodFilterProps {
    periodLabel: string;
    activePreset?: DashboardDatePreset;
    onPresetChange?: (preset: Exclude<DashboardDatePreset, 'custom'>) => void;
    className?: string;
    buttonClassName?: string;
    compact?: boolean;
}

export function AdvancedPeriodFilter({
    periodLabel,
    activePreset,
    onPresetChange,
    className,
    buttonClassName,
    compact = false,
}: AdvancedPeriodFilterProps) {
    const disabled = !onPresetChange;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-600 shadow-sm',
                        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
                        disabled && 'cursor-default opacity-90',
                        buttonClassName
                    )}
                    aria-label={`Period: ${periodLabel}`}
                >
                    {periodLabel}
                    <ChevronDown className={cn('text-slate-400', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden />
                </button>
            </DropdownMenuTrigger>
            {onPresetChange ? (
                <DropdownMenuContent align="end" className="min-w-[9rem]">
                    {DATE_RANGE_PRESETS.map((preset) => (
                        <DropdownMenuItem
                            key={preset.key}
                            className={cn(
                                'text-xs',
                                activePreset === preset.key && 'bg-slate-50 font-semibold text-slate-900'
                            )}
                            onSelect={() =>
                                onPresetChange(preset.key as Exclude<DashboardDatePreset, 'custom'>)
                            }
                        >
                            {preset.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            ) : null}
        </DropdownMenu>
    );
}
