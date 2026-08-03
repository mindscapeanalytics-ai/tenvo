'use client';

import { cn } from '@/lib/utils';

interface DomainBadge {
    label: string;
    tone?: 'default' | 'season' | 'capability';
}

interface AdvancedDomainChromeStripProps {
    badges: DomainBadge[];
    seasonLabel?: string | null;
    className?: string;
}

export function AdvancedDomainChromeStrip({
    badges,
    seasonLabel,
    className,
}: AdvancedDomainChromeStripProps) {
    if (!seasonLabel && badges.length === 0) return null;

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-1.5',
                className
            )}
        >
            {seasonLabel ? (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    {seasonLabel}
                </span>
            ) : null}
            {badges.map((badge) => (
                <span
                    key={badge.label}
                    className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-medium',
                        badge.tone === 'season'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200/80'
                    )}
                >
                    {badge.label}
                </span>
            ))}
        </div>
    );
}
