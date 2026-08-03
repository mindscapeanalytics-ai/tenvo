'use client';

import {
  Building2,
  Globe2,
  LayoutDashboard,
  Timer,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { MARKETING_HONEST_STATS } from '@/lib/marketing/homeVisualThemes';
import { MARKETING_STAT_VALUE } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const ICONS = [Building2, Globe2, Timer, LayoutDashboard];

/**
 * Honest stats strip (no unverified user counts or satisfaction %).
 */
export default function HomeStatsBar() {
  return (
    <MarketingSection
      padding="tight"
      className="border-b border-neutral-200/80 bg-neutral-50"
    >
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
        {MARKETING_HONEST_STATS.map((stat, index) => {
          const Icon = ICONS[index] || Building2;
          return (
            <div
              key={stat.value}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] sm:p-5"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className={cn(MARKETING_STAT_VALUE, 'text-xl text-neutral-900 sm:text-2xl')}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs font-medium leading-snug text-neutral-500 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}
