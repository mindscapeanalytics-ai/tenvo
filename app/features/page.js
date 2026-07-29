'use client';

import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import FeaturesModuleNav from '@/components/marketing/sections/FeaturesModuleNav';
import FeaturesInventorySection from '@/components/marketing/sections/FeaturesInventorySection';
import OperationsFlow from '@/components/marketing/sections/OperationsFlow';
import HomeSecurityTrustSection from '@/components/marketing/sections/HomeSecurityTrustSection';
import CTASection from '@/components/marketing/sections/CTASection';
import MarketingFeatureCard from '@/components/marketing/ui/MarketingFeatureCard';
import { MarketingSection } from '@/components/marketing/layout/MarketingSection';
import { FEATURE_PAGE_CARDS } from '@/lib/marketing/homeVisualThemes';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white">
        <Hero
          variant="centered"
          badge="Platform capabilities"
          title={
            <>
              Everything you need to{' '}
              <span className="text-brand-primary">run the business</span>
            </>
          }
          subtitle="Storefront, POS, inventory, accounting, and Pakistan-ready tax in one hub. Each module below uses honest Available and Partial labels."
          primaryCTA={{
            text: 'Start free',
            href: '/register',
          }}
          secondaryCTA={{
            text: 'Industry Plans',
            href: '/industry-plans',
          }}
        />
        <FeaturesModuleNav embedded />
      </div>

      <FeaturesInventorySection />

      <OperationsFlow />

      <MarketingSection id="platform-depth" className="border-b border-neutral-200/80 bg-white">
        <div className="mx-auto mb-8 max-w-3xl space-y-3 text-center sm:mb-10 lg:mb-12">
          <p className={MARKETING_EYEBROW}>Platform modules</p>
          <h2 className={MARKETING_SECTION_HEADING}>Finance, channels, and intelligence</h2>
          <p className={MARKETING_LEAD}>
            Deep inventory coverage lives above. These cards cover manufacturing, books, tax,
            storefront, POS, and analytics with plan-honest bullets and product imagery.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {FEATURE_PAGE_CARDS.map((card) => (
            <MarketingFeatureCard
              key={card.id}
              id={card.id}
              title={card.title}
              description={card.description}
              features={card.features}
              heroImage={card.heroImage}
              demoHref={card.demoLabel ? card.href : undefined}
              demoLabel={card.demoLabel || undefined}
              accent={card.accent}
            />
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm font-medium text-neutral-500">
          Vertical packaging and demo storefronts on{' '}
          <Link href="/industry-plans" className="font-semibold text-brand-primary hover:underline">
            Industry Plans
          </Link>
          . Growth modules on{' '}
          <Link href="/solutions/marketing-crm" className="font-semibold text-brand-primary hover:underline">
            Marketing & CRM
          </Link>
          .
        </p>
      </MarketingSection>

      <div id="security" className="scroll-mt-28">
        <HomeSecurityTrustSection />
      </div>

      <CTASection
        variant="split"
        title="Ready to run inventory and sales in one hub?"
        subtitle="Start free for core catalog and stock, then add warehouses, batch/serial, and channels as you grow."
        primaryCTA={{
          text: 'Start free',
          href: '/register',
        }}
        secondaryCTA={{
          text: 'View pricing',
          href: '/pricing',
        }}
      />
    </MarketingLayout>
  );
}
