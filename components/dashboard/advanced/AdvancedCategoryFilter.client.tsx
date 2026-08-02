'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type CategoryFilterMode = 'revenue' | 'asset';

const CATEGORY_FILTER_OPTIONS: Array<{ id: CategoryFilterMode; label: string }> = [
    { id: 'revenue', label: 'By Revenue' },
    { id: 'asset', label: 'By Asset Value' },
];

interface AdvancedCategoryFilterProps {
    mode: CategoryFilterMode;
    onModeChange: (mode: CategoryFilterMode) => void;
    className?: string;
}

export function AdvancedCategoryFilter({ mode, onModeChange, className }: AdvancedCategoryFilterProps) {
    const activeLabel = useMemo(
        () => CATEGORY_FILTER_OPTIONS.find((option) => option.id === mode)?.label ?? &apos;By Revenue&apos;,
        [mode]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600',
                        className
                    )}
                    aria-label={activeLabel}
                >
                    {activeLabel}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
                {CATEGORY_FILTER_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.id}
                        className={cn('text-xs', mode === option.id && 'bg-slate-50 font-semibold text-slate-900')}
                        onSelect={() => onModeChange(option.id)}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function useCategoryFilterMode(defaultMode: CategoryFilterMode = 'revenue') {
    return useState<CategoryFilterMode>(defaultMode);
}
