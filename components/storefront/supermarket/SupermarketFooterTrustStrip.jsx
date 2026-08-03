'use client';

import { Truck, RotateCcw, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveSupermarketFooterTrust } from '@/lib/storefront/supermarketStorefront';

const ICONS = { truck: Truck, refresh: RotateCcw, shield: Shield, credit: CreditCard };

/**
 * Naheed-style value proposition bar above the footer.
 */
export function SupermarketFooterTrustStrip({
  settings,
  businessCategory,
  accent = '#f97316',
  className,
}) {
  const items = resolveSupermarketFooterTrust(settings, businessCategory);
  if (!items.length) return null;

  return (
    <div className={cn('border-b border-slate-200 bg-white', className)}>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item) => {
            const Icon = ICONS[item.icon] || Shield;
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ color: accent, backgroundColor: `${accent}14` }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 sm:text-sm">{item.label}</p>
                  {item.desc ? (
                    <p className="text-[10px] text-slate-500 sm:text-xs">{item.desc}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
