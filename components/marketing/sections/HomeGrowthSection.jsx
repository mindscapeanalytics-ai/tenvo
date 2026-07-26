'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building2, Network, Store, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';

const GROWTH_POINTS = [
  { icon: Store, title: 'One store', body: 'Launch with inventory, POS, and branded storefront.' },
  { icon: Building2, title: 'Multi-location', body: 'Warehouses and shops share one stock picture.' },
  { icon: Network, title: 'Multi-business', body: 'Run several brands from one owner workspace.' },
  { icon: Users, title: 'Growing teams', body: 'Role-based access from cashier to finance lead.' },
];

/**
 * Light growth section with real storefront imagery.
 */
export default function HomeGrowthSection({ workspaceHref = '/register' }) {
  return (
    <MarketingSection padding="loose" className="border-b border-neutral-200/80 bg-white">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-5">
          <p className={MARKETING_EYEBROW}>Business growth</p>
          <h2 className={MARKETING_SECTION_HEADING}>Grow from one store to hundreds</h2>
          <p className={MARKETING_LEAD}>
            Start with a single counter and online shop. Add warehouses, branches, and sister brands
            without ripping out your stack every time you expand.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {GROWTH_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-4"
                >
                  <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-primary ring-1 ring-brand-200/60">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-500">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-dark"
            >
              <Link href={workspaceHref}>Start free</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl border-neutral-300 px-6 font-semibold">
              <MarketingCtaLink href={getBookMeetingHref()}>Book a demo</MarketingCtaLink>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.25)]">
          <div className="relative aspect-[5/4] overflow-hidden bg-neutral-100 sm:aspect-[4/3]">
            <Image
              src={TENVO_IMG.supermarketStore}
              alt="TENVO supermarket storefront for multi-location retail"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 bg-white p-4 sm:gap-3 sm:p-5">
            {[
              { label: 'Branches', value: '12', icon: Building2 },
              { label: 'Channels', value: '3', icon: Store },
              { label: 'Ready', value: 'Scale', icon: TrendingUp },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                  {kpi.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-900">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
