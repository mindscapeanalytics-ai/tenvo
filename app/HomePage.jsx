'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ChevronDown, X } from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import {
  MARKETING_CONTAINER,
  MARKETING_EYEBROW,
  MARKETING_MAIN_BOTTOM_STICKY,
} from '@/lib/utils/marketingLayout';
import { TenvoTextLogo } from '@/components/branding/TenvoTextLogo';
import HomeHero from '@/components/marketing/sections/HomeHero';
import HomeModulesGrid from '@/components/marketing/sections/HomeModulesGrid';
import HomeBusinessPain from '@/components/marketing/sections/HomeBusinessPain';
import HomeEcosystem from '@/components/marketing/sections/HomeEcosystem';
import { DemoStoreGallery } from '@/components/marketing/sections/DemoStoreGallery';
import HomeIndustryShowcase from '@/components/marketing/sections/HomeIndustryShowcase';
import HomeAISection from '@/components/marketing/sections/HomeAISection';
import HomeAutomationFlow from '@/components/marketing/sections/HomeAutomationFlow';
import HomeComparisonCards from '@/components/marketing/sections/HomeComparisonCards';
import HomeGrowthSection from '@/components/marketing/sections/HomeGrowthSection';
import HomeMobileBanner from '@/components/marketing/sections/HomeMobileBanner';
import HomeStatsBar from '@/components/marketing/sections/HomeStatsBar';
import HomeProductTrustStrip from '@/components/marketing/sections/HomeProductTrustStrip';
import HomeSecurityTrustSection from '@/components/marketing/sections/HomeSecurityTrustSection';
import HomeIntegrationMarquee from '@/components/marketing/sections/HomeIntegrationMarquee';
import TestimonialCarousel from '@/components/marketing/TestimonialCarousel';
import AffiliateProgramSection from '@/components/marketing/sections/AffiliateProgramSection';
import HomeFinalCta from '@/components/marketing/sections/HomeFinalCta';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';
import { cn } from '@/lib/utils';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import {
  ScrollReveal,
  ScrollProgress,
  ScrollIndicator,
} from '@/components/marketing/effects/ModernEffects';

export default function Home() {
  const { user } = useAuth();
  const workspaceHref = user ? '/multi-business' : '/register';
  const workspaceCtaMobile = user ? 'Open workspace' : 'Start Free Trial';
  const workspaceCtaDesktop = user ? 'Open workspace' : 'Start Free Trial';

  const trackHeroCta = (kind, href) => {
    trackEvent(EVENTS.HERO_CTA_CLICK, {
      cta_location: 'home_hero',
      cta_kind: kind,
      cta_destination: href,
    });
  };

  const [stickyCtaScrollReady, setStickyCtaScrollReady] = useState(false);
  const [stickyCtaDismissed, setStickyCtaDismissed] = useState(false);
  const STICKY_CTA_DISMISS_KEY = 'tenvo_sticky_cta_dismissed_session';
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('access') !== 'denied') return;

    toast.error('You do not have permission to access that area.');
    params.delete('access');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(STICKY_CTA_DISMISS_KEY) === '1') {
        setStickyCtaDismissed(true);
      }
    } catch {
      /* ignore private mode */
    }
  }, []);

  const dismissStickyCta = () => {
    setStickyCtaDismissed(true);
    try {
      sessionStorage.setItem(STICKY_CTA_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const showStickyCta = stickyCtaScrollReady && !stickyCtaDismissed;

  useEffect(() => {
    const handleScroll = () => {
      setStickyCtaScrollReady(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <MarketingLayout transparentNav={false} mainBottomClass={MARKETING_MAIN_BOTTOM_STICKY}>
      <ScrollProgress />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white shadow-[0_-3px_16px_-6px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className={cn(MARKETING_CONTAINER, 'grid min-w-0 grid-cols-1 items-center gap-y-2 py-2 pr-[calc(5rem+env(safe-area-inset-right,0px))] sm:flex sm:flex-row sm:gap-4 sm:py-2.5 sm:pr-[calc(8rem+env(safe-area-inset-right,0px))] lg:pr-[calc(10rem+env(safe-area-inset-right,0px))]')}>
          <div className="hidden min-w-0 flex-1 items-center gap-2.5 sm:flex sm:gap-3">
            <div className="shrink-0 translate-y-px">
              <TenvoTextLogo compact iconClassName="shadow-sm" />
            </div>
            <div className="min-w-0 border-l border-neutral-200 pl-2.5 sm:pl-3">
              <p className="text-[13px] font-bold leading-tight text-neutral-900">
                Ready to run your business smarter?
              </p>
              <p className="text-[11px] font-medium leading-snug text-neutral-500">
                Storefront, POS, inventory, and finance in one workspace.
              </p>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:flex-1 sm:justify-end sm:gap-2.5">
            <Button
              asChild
              variant="outline"
              className="h-10 min-w-0 shrink rounded-lg border-neutral-300 px-2 text-[11px] font-bold leading-tight sm:h-9 sm:px-4 sm:text-sm"
            >
              <MarketingCtaLink
                href={getBookMeetingHref()}
                className="block truncate text-center"
                onClick={() => trackHeroCta('sticky_book_meeting', getBookMeetingHref())}
              >
                Book a demo
              </MarketingCtaLink>
            </Button>
            <Button
              asChild
              className="h-10 min-w-0 shrink rounded-lg bg-brand-primary px-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-white hover:bg-brand-primary-dark sm:h-9 sm:max-w-[13rem] sm:px-4 sm:text-xs"
            >
              <Link
                href={workspaceHref}
                className="block truncate text-center"
                onClick={() => trackHeroCta('sticky_workspace', workspaceHref)}
              >
                {user ? 'Workspace' : 'Start free'}
              </Link>
            </Button>
            <button
              type="button"
              onClick={dismissStickyCta}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200/90 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 sm:h-9 sm:w-9"
              aria-label="Close promotion bar"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <HomeHero
          workspaceHref={workspaceHref}
          workspaceCtaMobile={workspaceCtaMobile}
          workspaceCtaDesktop={workspaceCtaDesktop}
        />
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
          <ScrollIndicator />
        </div>
      </div>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeModulesGrid />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeBusinessPain />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeEcosystem />
      </ScrollReveal>

      {/* LIVE DEMO STOREFRONTS — do not disturb */}
      <ScrollReveal direction="up" threshold={0.15}>
        <DemoStoreGallery variant="featured" />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeIndustryShowcase />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.12}>
        <HomeAISection />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeAutomationFlow />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeComparisonCards />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeGrowthSection workspaceHref={workspaceHref} />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeMobileBanner workspaceHref={workspaceHref} />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <HomeStatsBar />
      </ScrollReveal>

      <ScrollReveal direction="fade" threshold={0.2}>
        <HomeProductTrustStrip />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <HomeSecurityTrustSection />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.15}>
        <TestimonialCarousel variant="featured" />
      </ScrollReveal>

      <ScrollReveal direction="fade" threshold={0.15}>
        <HomeIntegrationMarquee compact />
      </ScrollReveal>

      <section className="relative overflow-hidden border-b border-neutral-200/80 bg-neutral-50 py-10 sm:py-16 lg:py-24">
        <div className={cn(MARKETING_CONTAINER, 'relative z-10')}>
          <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="up" threshold={0.2}>
            <div className="mb-12 space-y-3 text-center sm:mb-14">
              <h2 className={MARKETING_EYEBROW}>Frequently asked questions</h2>
              <h3 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Everything you need to know.
              </h3>
              <p className="text-sm font-semibold text-neutral-500">
                Can&apos;t find the answer? Reach out to our support team.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              {
                q: 'Can I import native Excel files directly?',
                a: 'Yes. TENVO supports direct upload of native .xlsx files with column checks, duplicate SKU warnings, and partial import of valid rows.',
              },
              {
                q: 'Does TENVO work outside one country?',
                a: 'Yes. TENVO ships with multi-country regional packs for currency, tax labels, and locale. Country-specific depth varies; live government filing connectors stay on the roadmap where noted.',
              },
              {
                q: 'Can I run multiple locations or brands?',
                a: 'Yes. Multi-warehouse and multi-business workflows are built in so you can grow from one store to many without switching systems.',
              },
              {
                q: 'Is there a native mobile app?',
                a: 'The full hub works in mobile browsers today. Native App Store and Google Play apps are on the roadmap; we do not claim downloadable apps yet.',
              },
            ].map((faq, index) => (
              <ScrollReveal key={faq.q} direction="up" delay={index * 50} threshold={0.1}>
                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-colors duration-200 hover:border-neutral-300">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="group flex w-full items-center justify-between p-5 text-left transition-colors duration-200 hover:bg-neutral-50/60 sm:p-6"
                    aria-expanded={expandedFaq === index}
                  >
                    <span className="text-sm font-semibold text-neutral-800 transition-colors duration-200 group-hover:text-brand-primary sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        'ml-4 h-5 w-5 shrink-0 text-neutral-400 transition-all duration-300 group-hover:text-brand-primary',
                        expandedFaq === index ? 'rotate-180 text-brand-primary' : ''
                      )}
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="animate-fade-in-up border-t border-neutral-100 px-5 pb-5 sm:px-6 sm:pb-6">
                      <p className="pt-4 text-sm font-medium leading-relaxed text-neutral-600">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
          </div>
        </div>
      </section>

      <AffiliateProgramSection />
      <HomeFinalCta workspaceHref={workspaceHref} workspaceCta={workspaceCtaDesktop} />
    </MarketingLayout>
  );
}
