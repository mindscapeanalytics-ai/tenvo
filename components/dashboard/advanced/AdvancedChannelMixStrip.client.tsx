'use client';

import { cn } from '@/lib/utils';

export interface ChannelMixItem {
    id: string;
    label: string;
    value: string;
    sharePct: number;
}

interface AdvancedChannelMixStripProps {
    channels: ChannelMixItem[];
    className?: string;
}

export function AdvancedChannelMixStrip({ channels, className }: AdvancedChannelMixStripProps) {
    if (!channels.length) return null;

    return (
        <div
            className={cn(
                'rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm',
                className
            )}
        >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Revenue by channel
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {channels.map((channel) => (
                    <div key={channel.id} className="min-w-0 rounded-md bg-slate-50/80 px-2.5 py-2">
                        <div className="flex items-baseline justify-between gap-1">
                            <p className="truncate text-[11px] font-medium text-slate-600">{channel.label}</p>
                            <p className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-400">
                                {channel.sharePct.toFixed(0)}%
                            </p>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-slate-900">
                            {channel.value}
                        </p>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/80">
                            <div
                                className="h-full rounded-full bg-blue-500/70"
                                style={{ width: `${Math.min(100, Math.max(0, channel.sharePct))}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
