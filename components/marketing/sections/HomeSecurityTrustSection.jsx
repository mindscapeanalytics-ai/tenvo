'use client';

import { Cloud, Lock, ShieldCheck } from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { CAPABILITY_STATUS_STYLE } from '@/lib/marketing/capabilities';
import { HOME_SECURITY_CLUSTERS } from '@/lib/marketing/homeVisualThemes';
import { MARKETING_EYEBROW, MARKETING_H3, MARKETING_LEAD } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const CLUSTER_ICONS = {
  0: ShieldCheck,
  1: Lock,
  2: Cloud,
};

/**
 * Light-theme security / trust section with honest capability status.
 */
export default function HomeSecurityTrustSection() {
  return (
    <MarketingSection
      padding="loose"
      className="relative overflow-hidden border-b border-neutral-200/80 bg-gradient-to-b from-slate-50 via-white to-sky-50/40"
    >
      <div className="relative z-10 mb-10 space-y-3 text-center sm:mb-12">
        <p className={cn(MARKETING_EYEBROW, 'text-sky-700')}>Enterprise-grade security</p>
        <h2 className={cn(MARKETING_H3, 'text-neutral-900')}>
          <span className="text-brand-primary">Encrypted</span>, backed up, and built for operators who cannot afford downtime
        </h2>
        <p className={cn(MARKETING_LEAD, 'mx-auto max-w-2xl text-neutral-600')}>
          Honest status on what ships today versus what is on the roadmap. No vanity certification
          badges.
        </p>
      </div>

      <div className="relative z-10 grid gap-5 lg:grid-cols-3">
        {HOME_SECURITY_CLUSTERS.map((cluster, index) => {
          const Icon = CLUSTER_ICONS[index] || ShieldCheck;
          return (
            <div
              key={cluster.id}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-6"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-200/70">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">{cluster.title}</h3>
              <ul className="mt-4 space-y-3">
                {cluster.items.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="text-xs font-medium text-neutral-500">{item.desc}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                        CAPABILITY_STATUS_STYLE[item.status]
                      )}
                    >
                      {item.status === 'shipped'
                        ? 'Available'
                        : item.status === 'partial'
                          ? 'Partial'
                          : 'Roadmap'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}
