'use client';

import { memo, useState } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MARKETING_STAT_VALUE } from '@/lib/utils/typography';

export interface RetailTopSellingItem {
  id?: string;
  name: string;
  qty: number;
  revenue: number;
  price?: number;
  imageUrl?: string | null;
}

interface RetailTopSellingCardProps {
  items: RetailTopSellingItem[];
  formatCurrency: (amount: number) => string;
  isLoading?: boolean;
  className?: string;
}

function TopSellingThumb({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenant URLs may be off-domain; avoid next/image hostname crashes
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-neutral-300">
          <Package className="h-4 w-4" aria-hidden />
        </div>
      )}
    </div>
  );
}

function TopSellingRow({
  item,
  formatCurrency,
}: {
  item: RetailTopSellingItem;
  formatCurrency: (amount: number) => string;
}) {
  const qty = Number(item.qty) || 0;
  const revenue = Number(item.revenue) || 0;
  const unitPrice =
    item.price != null && Number.isFinite(item.price)
      ? item.price
      : qty > 0
        ? revenue / qty
        : revenue;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <TopSellingThumb src={item.imageUrl} alt={item.name || 'Product'} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-neutral-900">{item.name || 'Product'}</p>
        <p className={cn(MARKETING_STAT_VALUE, 'text-[11px] text-neutral-600')}>
          {formatCurrency(unitPrice)}
        </p>
      </div>
      <span className={cn(MARKETING_STAT_VALUE, 'shrink-0 text-xs text-neutral-500')}>
        {qty.toLocaleString()}
      </span>
    </li>
  );
}

export const RetailTopSellingCard = memo(function RetailTopSellingCard({
  items,
  formatCurrency,
  isLoading = false,
  className,
}: RetailTopSellingCardProps) {
  return (
    <Card className={cn('border-neutral-200 shadow-sm', className)}>
      <CardHeader className="border-b border-neutral-100 px-4 py-3">
        <CardTitle className="text-sm font-semibold text-neutral-900">Top Selling Items</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        {isLoading ? (
          <ul className="space-y-2 py-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-neutral-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-neutral-100" />
                  <div className="h-2.5 w-1/3 rounded bg-neutral-50" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-xs text-neutral-500">No sales in this period yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item, index) => (
              <TopSellingRow
                key={item.id || `${item.name}-${index}`}
                item={item}
                formatCurrency={formatCurrency}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});
