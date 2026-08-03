'use client';

import Link from 'next/link';
import Image from '@/components/marketing/ui/MarketingImage';
import { ArrowRight, Building2, Rocket, Shield, Users } from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MarketingSection } from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_H3,
  MARKETING_LEAD,
} from '@/lib/utils/marketingLayout';
import { MARKETING_HONEST_STATS } from '@/lib/marketing/homeVisualThemes';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import Hero from '@/components/marketing/sections/Hero';
import WhyTenvoSectionNav from '@/components/marketing/sections/WhyTenvoSectionNav';
import WhyTenvoProofSection from '@/components/marketing/sections/WhyTenvoProofSection';
import WhyTenvoPositioningSection from '@/components/marketing/sections/WhyTenvoPositioningSection';
import CompetitorComparisonSection from '@/components/marketing/sections/CompetitorComparisonSection';
import CTASection from '@/components/marketing/sections/CTASection';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { Button } from '@/components/ui/button';

const SCALE_POINTS = [
  {
    icon: Users,
    title: 'Roles that match real jobs',
    body: 'Cashier, warehouse, accountant, and owner each see what they need. No training everyone on an ERP they will never use.',
  },
  {
    icon: Building2,
    title: 'Scales with your entity structure',
    body: 'Multiple brands or branches under one disciplined operating model. Add warehouses and fiscal periods when the business is ready.',
  },
  {
    icon: Rocket,
    title: 'Start small, grow on the same stack',
    body: '14-day trial on core POS and inventory. Upgrade for campaigns, multi-warehouse, and advanced finance without migrating data.',
  },
  {
    icon: Shield,
    title: 'Compliance built into daily work',
    body: 'GST and sales tax configuration, audit-friendly ledgers, and export-oriented summaries. Live FBR IRIS sync remains on the roadmap.',
  },
];

export default function WhyTenvoPage() {
  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white">
        <Hero
          variant="centered"
          badge="For operators who outgrew patchwork tools"
          title={
            <>
              One intelligent platform for{' '}
              <span className="text-brand-primary">how you actually run the business</span>
            </>
          }
          subtitle="TENVO connects storefront, checkout, warehouse, and accounting in one calm workspace. Small teams move fast on day one; growing brands stay audit-ready without paying for a dozen disconnected products."
          primaryCTA={{ text: 'Start free', href: '/register' }}
          secondaryCTA={{ text: 'Book a meeting', href: getBookMeetingHref() }}
        />
        <WhyTenvoSectionNav embedded />
      </div>

      <MarketingSection id="who-its-for" className="scroll-mt-28 border-b border-neutral-200/80 bg-neutral-50">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5 sm:space-y-6">
            <p className={MARKETING_EYEBROW}>Who it is for</p>
            <h2 className={MARKETING_H3}>
              From a single outlet to a national footprint - same product philosophy.
            </h2>
            <p className={MARKETING_LEAD}>
              Solo founders get sensible defaults and fast setup. Growing brands get multi-location control
              and clear handoffs between sales, warehouse, and finance. Larger groups get traceability,
              tax posture, and operational reporting without forcing IT projects every quarter.
            </p>
            <ul className="space-y-4">
              {SCALE_POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{title}</p>
                    <p className="mt-0.5 text-sm font-medium text-neutral-500">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="rounded-xl border-2 font-semibold">
              <Link href="/industry-plans" className="inline-flex items-center gap-2">
                See Industry Plans <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl sm:rounded-[2rem]">
            <Image
              src={TENVO_IMG.retailDashboard}
              alt="TENVO retail dashboard for owner morning overview"
              fill
              className="object-contain p-3 sm:p-4"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </MarketingSection>

      <WhyTenvoProofSection />

      <WhyTenvoPositioningSection />

      <CompetitorComparisonSection />

      <MarketingSection className="border-b border-neutral-200/80 bg-neutral-50" padding="tight">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {MARKETING_HONEST_STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <CTASection
        variant="split"
        title="Ready to simplify how you sell and operate?"
        subtitle="Bring your team onto one platform built for Pakistani realities, with room to grow globally."
        primaryCTA={{ text: 'Create your workspace', href: '/register' }}
        secondaryCTA={{ text: 'Book a meeting', href: getBookMeetingHref() }}
      />
    </MarketingLayout>
  );
}
