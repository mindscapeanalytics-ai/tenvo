/**
 * Product proof for `/why-tenvo` — one hub narrative without duplicating CommerceAndIntelligenceSection.
 */
'use client';

import Link from 'next/link';
import Image from '@/components/marketing/ui/MarketingImage';
import { ArrowRight, Layers3, Package, Store, TrendingUp } from 'lucide-react';
import { MarketingSection } from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import { cn } from '@/lib/utils';

const PROOF_POINTS = [
  {
    icon: Package,
    title: 'One catalog, every channel',
    body: 'Web storefront, POS, restaurant orders, and B2B invoices read the same SKUs, stock picture, and customer record. No nightly CSV exports between tools.',
    href: '/features#inventory',
    cta: 'Inventory depth',
  },
  {
    icon: Store,
    title: 'Branded commerce that stays operational',
    body: 'Elevated storefront templates per vertical, honest checkout rules (Rx, bookables, COD vs deferred stock), and hub order fulfilment in the same workspace.',
    href: '/features#storefront',
    cta: 'Storefront & checkout',
  },
  {
    icon: Layers3,
    title: 'Industry Plans, not generic ERP',
    body: 'Pharmacy, supermarket, auto parts, milk route, restaurant, and more ship with presets, demo paths, and modules that match how those businesses actually run.',
    href: '/solutions',
    cta: 'Browse Industry Plans',
  },
  {
    icon: TrendingUp,
    title: 'Room to grow into CRM and analytics',
    body: 'Loyalty and campaigns tie to real orders on Professional+ and Business+. Dashboards and AI analyst helpers build on the same ledger, not a disconnected mart.',
    href: '/solutions/marketing-crm',
    cta: 'Marketing & CRM',
  },
];

export default function WhyTenvoProofSection() {
  return (
    <MarketingSection id="one-platform" className="scroll-mt-28 border-b border-neutral-200/80 bg-white">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xl sm:rounded-[2rem]">
            <Image
              src={TENVO_IMG.oneTenvoHub}
              alt="TENVO hub on desktop and mobile with shared business data"
              fill
              className="object-contain p-3 sm:p-4"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-neutral-500 lg:text-left">
            Real product screens - not a stitched mock-up of separate apps.
          </p>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <div>
            <p className={MARKETING_EYEBROW}>One platform</p>
            <h2 className={cn(MARKETING_SECTION_HEADING, 'mt-2')}>
              Replace the patchwork with one calm operating system.
            </h2>
            <p className={cn(MARKETING_LEAD, 'mt-4')}>
              TENVO is opinionated about connected data: what you sell online, at the till, and in
              the back office should agree before leadership makes decisions. Start on a 14-day trial,
              scale plans when you need warehouses, campaigns, or fiscal periods.
            </p>
          </div>

          <ul className="space-y-4">
            {PROOF_POINTS.map(({ icon: Icon, title, body, href, cta }) => (
              <li
                key={title}
                className="rounded-2xl border border-neutral-200/90 bg-neutral-50/50 p-4 sm:p-5"
              >
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{title}</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">{body}</p>
                    <Link
                      href={href}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
                    >
                      {cta}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MarketingSection>
  );
}
