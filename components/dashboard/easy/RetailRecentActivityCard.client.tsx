'use client';

import { memo } from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MARKETING_STAT_VALUE } from '@/lib/utils/typography';
import { formatRetailRecentLabel } from '@/lib/dashboard/retailSimpleSidebar';

export interface RetailRecentActivityItem {
  id: string;
  title: string;
  amount: number;
  date?: string | Date;
  source?: string;
}

interface RetailRecentActivityCardProps {
  items: RetailRecentActivityItem[];
  formatCurrency: (amount: number) => string;
  isLoading?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export const RetailRecentActivityCard = memo(function RetailRecentActivityCard({
  items,
  formatCurrency,
  isLoading = false,
  onViewAll,
  className,
}: RetailRecentActivityCardProps) {
  return (
    <Card className={cn('border-neutral-200 shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 px-4 py-3">
        <CardTitle className="text-sm font-semibold text-neutral-900">Recent Activity</CardTitle>
        {onViewAll ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] font-semibold text-neutral-500"
            onClick={onViewAll}
          >
            View all
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 py-1">
        {isLoading ? (
          <ul className="space-y-2 py-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-neutral-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded bg-neutral-100" />
                </div>
                <div className="h-3 w-12 rounded bg-neutral-100" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-xs text-neutral-500">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-2 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 text-neutral-400">
                  <User className="h-3.5 w-3.5" aria-hidden />
                </div>
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-900">
                  {item.title}
                </p>
                <span className={cn(MARKETING_STAT_VALUE, 'shrink-0 text-xs text-neutral-900')}>
                  {formatCurrency(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});

/** Map unified sales activity rows to retail sidebar items. */
export function mapSalesActivityRows(
  rows: Array<Record<string, unknown>> = []
): RetailRecentActivityItem[] {
  const seen = new Set<string>();
  return rows.slice(0, 6).map((row, index) => {
    const base = `${String(row.source || 'sale')}-${String(row.id || row.ref || index)}`;
    let id = base;
    if (seen.has(id)) id = `${base}-${index}`;
    seen.add(id);
    return {
      id,
      title: formatRetailRecentLabel(row),
      amount: Number(row.amount) || 0,
      date: row.date as string | Date | undefined,
      source: String(row.source || ''),
    };
  });
}

/** Map audit feed rows to retail sidebar items. */
export function mapAuditActivityRows(
  rows: Array<Record<string, unknown>> = []
): RetailRecentActivityItem[] {
  const seen = new Set<string>();
  return rows.slice(0, 6).map((row, index) => {
    const base = String(row.id || `${row.type || 'activity'}-${row.description || index}`);
    let id = base;
    if (seen.has(id)) id = `${base}-${index}`;
    seen.add(id);
    return {
      id,
      title: String(row.description || 'Activity'),
      amount: Number(row.amount) || 0,
      date: row.date as string | Date | undefined,
      source: String(row.type || ''),
    };
  });
}
