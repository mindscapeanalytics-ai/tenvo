'use client';

import { AlertTriangle, Lightbulb, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InsightStripItem {
    id: string;
    label: string;
    value: string | number;
    sublabel?: string;
    tone?: 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal' | 'slate';
    actionId?: string;
}

interface AdvancedInsightStripProps {
    items: InsightStripItem[];
    onNavigate?: (actionId: string) => void;
    className?: string;
}

const TONE_STYLES = {
    emerald: {
        shell: 'border-emerald-100/80 bg-emerald-50/70',
        icon: 'bg-emerald-100 text-emerald-600',
        value: 'text-slate-900',
    },
    amber: {
        shell: 'border-amber-100/80 bg-amber-50/70',
        icon: 'bg-amber-100 text-amber-600',
        value: 'text-slate-900',
    },
    rose: {
        shell: 'border-rose-100/80 bg-rose-50/70',
        icon: 'bg-rose-100 text-rose-600',
        value: 'text-slate-900',
    },
    violet: {
        shell: 'border-violet-100/80 bg-violet-50/70',
        icon: 'bg-violet-100 text-violet-600',
        value: 'text-slate-900',
    },
    teal: {
        shell: 'border-teal-100/80 bg-teal-50/70',
        icon: 'bg-teal-100 text-teal-600',
        value: 'text-slate-900',
    },
    blue: {
        shell: 'border-blue-100/80 bg-blue-50/70',
        icon: 'bg-blue-100 text-blue-600',
        value: 'text-slate-900',
    },
    slate: {
        shell: 'border-slate-200/90 bg-slate-50/80',
        icon: 'bg-slate-100 text-slate-600',
        value: 'text-slate-900',
    },
} as const;

const ICONS = {
    opportunities: Lightbulb,
    alerts: AlertTriangle,
    profit: TrendingUp,
    health: Shield,
} as const;

export function AdvancedInsightStrip({ items, onNavigate, className }: AdvancedInsightStripProps) {
    if (!items.length) return null;

    return (
        <div className={cn('grid grid-cols-2 gap-2 lg:grid-cols-4', className)}>
            {items.map((item) => {
                const tone = item.tone ?? 'slate';
                const styles = TONE_STYLES[tone];
                const Icon =
                    item.id === 'opportunities'
                        ? ICONS.opportunities
                        : item.id === 'alerts'
                          ? ICONS.alerts
                          : item.id === 'profit'
                            ? ICONS.profit
                            : ICONS.health;
                const clickable = Boolean(item.actionId && onNavigate);

                return (
                    <button
                        key={item.id}
                        type="button"
                        disabled={!clickable}
                        onClick={() => item.actionId && onNavigate?.(item.actionId)}
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left shadow-sm transition-shadow',
                            styles.shell,
                            clickable &&
                                'cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30'
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                                styles.icon
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                        </div>
                        <div className="min-w-0 leading-tight">
                            {item.label ? (
                                <p className="truncate text-[10px] font-medium text-slate-500">{item.label}</p>
                            ) : null}
                            <p className={cn('truncate text-[13px] font-semibold tabular-nums', styles.value)}>
                                {item.value}
                            </p>
                            {item.sublabel ? (
                                <p className="truncate text-[10px] text-slate-500">{item.sublabel}</p>
                            ) : null}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
