'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDomainOperationsSnapshot } from '@/lib/hooks/useDomainOperationsSnapshot';
import {
    buildOperationsKpiTiles,
    resolveOperationsProfile,
} from '@/lib/dashboard/domainOperationsIntelligence';
import { cn } from '@/lib/utils';

interface AdvancedDomainOpsStripProps {
    businessId?: string;
    category: string;
    domainKnowledge?: Record<string, unknown>;
    business?: Record<string, unknown> | null;
    dateRange: { from: Date; to: Date };
    formatCurrencyCompact: (value: number) => string;
    onNavigate?: (actionId: string) => void;
    enabled?: boolean;
    className?: string;
}

export function AdvancedDomainOpsStrip({
    businessId,
    category,
    domainKnowledge,
    business,
    dateRange,
    formatCurrencyCompact,
    onNavigate,
    enabled = true,
    className,
}: AdvancedDomainOpsStripProps) {
    const { snapshot, loading } = useDomainOperationsSnapshot({
        businessId,
        category,
        dateRange,
        enabled: enabled && Boolean(businessId),
    });

    const profile = useMemo(
        () => resolveOperationsProfile(category, domainKnowledge, business),
        [category, domainKnowledge, business]
    );

    const tiles = useMemo(() => {
        if (!snapshot) return [];
        return buildOperationsKpiTiles(profile, snapshot, {
            formatCurrency: formatCurrencyCompact,
        }).slice(0, 4);
    }, [snapshot, profile, formatCurrencyCompact]);

    if (!enabled || (!loading && tiles.length === 0)) return null;

    return (
        <Card className={cn('rounded-xl border border-slate-200/90 bg-white shadow-sm', className)}>
            <CardHeader className="border-b border-slate-100 px-3 py-2.5">
                <CardTitle className="text-sm font-semibold text-slate-900">
                    {profile.tabLabel || 'Domain Operations'}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-2 md:grid-cols-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                      ))
                    : tiles.map((tile) => (
                          <button
                              key={tile.id}
                              type="button"
                              onClick={() => tile.actionTab && onNavigate?.(tile.actionTab)}
                              className={cn(
                                  'rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-2 text-left',
                                  tile.actionTab && 'hover:bg-slate-50'
                              )}
                          >
                              <p className="text-[10px] font-medium text-slate-500">{tile.label}</p>
                              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                                  {tile.value}
                              </p>
                              {tile.hint ? (
                                  <p className="mt-0.5 truncate text-[9px] text-slate-400">{tile.hint}</p>
                              ) : null}
                          </button>
                      ))}
            </CardContent>
        </Card>
    );
}
