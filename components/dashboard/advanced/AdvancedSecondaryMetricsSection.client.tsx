'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SecondaryMetricItem {
    id: string;
    label: string;
    value: string | number;
    hint?: string;
    tone?: string;
    actionId?: string;
}

interface AdvancedSecondaryMetricsSectionProps {
    metrics: SecondaryMetricItem[];
    onNavigate?: (actionId: string) => void;
    isLoading?: boolean;
    className?: string;
}

export function AdvancedSecondaryMetricsSection({
    metrics,
    onNavigate,
    isLoading = false,
    className,
}: AdvancedSecondaryMetricsSectionProps) {
    if (!metrics.length && !isLoading) return null;

    return (
        <Card className={cn('border border-slate-200/80 bg-white shadow-sm', className)}>
            <CardHeader className="border-b border-slate-100 px-4 py-3">
                <CardTitle className="text-base font-semibold text-slate-900">Operations & Finance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-px bg-slate-100 p-px md:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="animate-pulse bg-white p-4">
                              <div className="h-3 w-16 rounded bg-slate-100" />
                              <div className="mt-2 h-5 w-20 rounded bg-slate-200" />
                          </div>
                      ))
                    : metrics.map((metric) => {
                          const clickable = Boolean(metric.actionId && onNavigate);
                          return (
                              <button
                                  key={metric.id}
                                  type="button"
                                  disabled={!clickable}
                                  onClick={() => metric.actionId && onNavigate?.(metric.actionId)}
                                  className={cn(
                                      'group flex min-w-0 flex-col bg-white p-4 text-left transition-colors',
                                      clickable && 'cursor-pointer hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30'
                                  )}
                              >
                                  <div className="flex items-start justify-between gap-1">
                                      <p className="truncate text-xs font-medium text-slate-500">{metric.label}</p>
                                      {clickable ? (
                                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                                      ) : null}
                                  </div>
                                  <p
                                      className={cn(
                                          'mt-1 text-lg font-semibold tabular-nums tracking-tight',
                                          metric.tone ?? 'text-slate-900'
                                      )}
                                  >
                                      {metric.value}
                                  </p>
                                  {metric.hint ? (
                                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{metric.hint}</p>
                                  ) : null}
                              </button>
                          );
                      })}
            </CardContent>
        </Card>
    );
}
