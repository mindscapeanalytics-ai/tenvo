'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileSpreadsheet,
  Info,
  Package,
  Receipt,
  Settings,
  Truck,
  X,
} from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import {
  MARKETING_CONTAINER,
  MARKETING_EYEBROW,
  MARKETING_MAIN_BOTTOM_STICKY,
  MARKETING_SECTION_HEADING,
  MARKETING_STAT_VALUE,
} from '@/lib/utils/marketingLayout';
import { TenvoTextLogo } from '@/components/branding/TenvoTextLogo';
import CommerceAndIntelligenceSection from '@/components/marketing/sections/CommerceAndIntelligenceSection';
import CompetitorComparisonSection from '@/components/marketing/sections/CompetitorComparisonSection';
import HomeBentoFeatures from '@/components/marketing/sections/HomeBentoFeatures';
import HomeROIBanner from '@/components/marketing/sections/HomeROIBanner';
import HomeHero from '@/components/marketing/sections/HomeHero';
import HomeTrustStrip from '@/components/marketing/sections/HomeTrustStrip';
import HomeProductDemoSection from '@/components/marketing/sections/HomeProductDemoSection';
import HomeIntegrationMarquee from '@/components/marketing/sections/HomeIntegrationMarquee';
import HomeToolkitSection from '@/components/marketing/sections/HomeToolkitSection';
import HomeIndustrySolutionsSection from '@/components/marketing/sections/HomeIndustrySolutionsSection';
import HomeOnboardingPathSection from '@/components/marketing/sections/HomeOnboardingPathSection';
import HomeSecurityTrustSection from '@/components/marketing/sections/HomeSecurityTrustSection';
import TestimonialCarousel from '@/components/marketing/TestimonialCarousel';
import { DemoStoreGallery } from '@/components/marketing/sections/DemoStoreGallery';
import AffiliateProgramSection from '@/components/marketing/sections/AffiliateProgramSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';
import { cn } from '@/lib/utils';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import {
  ScrollReveal,
  AnimatedCounter,
  ScrollProgress,
  GradientMesh,
  ScrollIndicator,
  CardLift,
  PulseDot,
} from '@/components/marketing/effects/ModernEffects';

export default function Home() {
  const { user } = useAuth();
  const workspaceHref = user ? '/multi-business' : '/register';
  const workspaceCtaMobile = user ? 'Open workspace' : 'Start free';
  const workspaceCtaDesktop = user ? 'Open workspace' : 'Start free';

  const trackHeroCta = (kind, href) => {
    trackEvent(EVENTS.HERO_CTA_CLICK, {
      cta_location: 'home_hero',
      cta_kind: kind,
      cta_destination: href,
    });
  };

  // --- STATE FOR INTERACTIVE COMPONENTS ---
  const [stickyCtaScrollReady, setStickyCtaScrollReady] = useState(false);
  const [stickyCtaDismissed, setStickyCtaDismissed] = useState(false);
  const STICKY_CTA_DISMISS_KEY = 'tenvo_sticky_cta_dismissed_session';

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

  // Sticky CTA scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setStickyCtaScrollReady(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <MarketingLayout transparentNav={true} mainBottomClass={MARKETING_MAIN_BOTTOM_STICKY}>

      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* STICKY CTA - mobile: 3-col grid (Book | Trial | Close) + generous pr for assistant FAB; sm+: strip layout */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white shadow-[0_-3px_16px_-6px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 items-center gap-y-2 px-[max(1rem,env(safe-area-inset-left))] py-2 pr-[calc(5rem+env(safe-area-inset-right,0px))] sm:flex sm:flex-row sm:gap-4 sm:py-2.5 sm:pl-8 sm:pr-[calc(8rem+env(safe-area-inset-right,0px))] md:pl-10 lg:px-12 lg:pr-[calc(10rem+env(safe-area-inset-right,0px))]">
          <div className="hidden min-w-0 flex-1 items-center gap-2.5 sm:flex sm:gap-3">
            <div className="shrink-0 translate-y-px">
              <TenvoTextLogo compact iconClassName="shadow-sm" />
            </div>
            <div className="min-w-0 border-l border-neutral-200 pl-2.5 sm:pl-3">
              <p className="text-[13px] font-bold leading-tight text-neutral-900">Ready to streamline your operations?</p>
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
                Book a meeting
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

      <section className="relative overflow-hidden">
        <GradientMesh variant="hero" />
        
        <div className="relative z-10">
          <HomeHero
            workspaceHref={workspaceHref}
            workspaceCtaMobile={workspaceCtaMobile}
            workspaceCtaDesktop={workspaceCtaDesktop}
          />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <ScrollIndicator />
        </div>
      </section>

      <ScrollReveal direction="fade" threshold={0.3}>
        <HomeTrustStrip />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <CommerceAndIntelligenceSection />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <DemoStoreGallery variant="featured" />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <HomeProductDemoSection />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <CompetitorComparisonSection />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <HomeToolkitSection />
      </ScrollReveal>

      {/* 4. UNIFIED ENGINE & EXCEL IMPORT */}
      <HomeBentoFeatures />

      {/* 6. ROI & EXCLUSIVITY BANNER */}
      <HomeROIBanner />

      <ScrollReveal direction="up" threshold={0.2}>
        <HomeIndustrySolutionsSection />
      </ScrollReveal>


      {/* 7. UNIQUE BENEFITS & COMPETITIVE ANALYSIS */}
      <section className="relative bg-white border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28 overflow-hidden">
        <GradientMesh variant="subtle" />
        <div className={cn(MARKETING_CONTAINER, 'relative z-10')}>

          <ScrollReveal direction="up" threshold={0.2}>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className={MARKETING_EYEBROW}>Why Choose Tenvo</h2>
              <h3 className={MARKETING_SECTION_HEADING}>
                What makes TENVO unique?
              </h3>
              <p className="text-lg text-neutral-500 font-medium">
                We built an enterprise inventory system specifically for Pakistani businesses, addressing the critical issues competitors ignore.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                num: '1.',
                title: 'Urdu Language Support',
                body: "Your office managers might prefer English, but your warehouse team on the ground doesn't have to suffer. TENVO features a full Urdu UI toggle designed for easy catalog searches, barcode scanning, and transfer entries.",
              },
              {
                num: '2.',
                title: 'Zero-Data-Loss Migration',
                body: 'Moving systems is scary. TENVO assigns a dedicated migration manager to every single enterprise customer. We map your current Excel files, verify duplicate SKU databases, and transfer everything for free.',
              },
              {
                num: '3.',
                title: 'Local Cloud & Offline POS',
                body: 'Load dashboards instantly with zero lag. Our local cloud server architecture guarantees fast access times inside Pakistan, coupled with offline point-of-sale terminals that sync automatically when internet recovers.',
              },
            ].map((card, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 100} threshold={0.2}>
                <CardLift className="h-full">
                  <div className="p-8 border border-neutral-200/80 rounded-[2rem] bg-neutral-50 space-y-4 h-full hover:border-brand-primary/30 transition-colors duration-300">
                    <h4 className="font-semibold text-lg text-neutral-900">{card.num} {card.title}</h4>
                    <p className="text-sm text-neutral-600 font-medium leading-relaxed">{card.body}</p>
                  </div>
                </CardLift>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal direction="up" threshold={0.1}>
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:rounded-[2.5rem] lg:p-10">
              <h4 className="mb-1 text-lg font-semibold text-neutral-900 sm:text-xl">Operating model comparison</h4>
              <p className="mb-4 max-w-2xl text-[11px] font-semibold text-neutral-500 sm:mb-6 sm:text-xs">
                For a buyer-style view versus typical storefront-first or multi-app suites, see{' '}
                <Link href="/why-tenvo" className="font-semibold text-brand-primary hover:underline">Why TENVO</Link>.
              </p>

              {(() => {
                const operatingModelRows = [
                  ['Branded store + POS + warehouse in one rhythm', 'Heavy customization', 'Manual links', 'Designed together'],
                  ['Web orders in the same queue as counter & B2B', 'Often separate modules', 'Fragmented tabs', 'Single order hub'],
                  ['Implementation Time', '6 - 12 Months', 'Manual Setup (Days)', 'Go live in 4 Days'],
                  ['Excel Paste & Import', 'Partial / Strict formatting', 'Native', 'Native (with cell validation)'],
                  ['Batch & Expiry Warning', 'Complex add-on module', 'Manual tracking / Missing', 'Built-in (with expiry alerts)'],
                  ['Pakistan tax setup', 'Custom expensive wrappers', 'Impossible', 'Compliant & Automatic'],
                  ['Multichannel Sell Sync', 'Rigid API integrations', 'Manual entry drift', 'Daraz & Shopify native API'],
                  ['Upfront Licensing Cost', 'PKR 500,000+', 'PKR 0', 'Free Trial, scale from PKR 4,500/mo'],
                ];

                return (
                  <>
                    {/* Mobile — stacked cards (no horizontal scroll) */}
                    <div className="divide-y divide-neutral-100 lg:hidden">
                      {operatingModelRows.map(([feature, erp, sheet, tenvo]) => (
                        <div key={feature} className="space-y-2.5 py-4 first:pt-0 last:pb-0">
                          <p className="text-sm font-bold leading-snug text-neutral-900">{feature}</p>
                          <div className="space-y-2">
                            {[
                              { label: 'Traditional ERPs', value: erp, highlight: false },
                              { label: 'Spreadsheets', value: sheet, highlight: false },
                              { label: 'TENVO Inventory Engine', value: tenvo, highlight: true },
                            ].map((col) => (
                              <div
                                key={col.label}
                                className={cn(
                                  'rounded-xl border px-3 py-2.5',
                                  col.highlight
                                    ? 'border-brand-200 bg-brand-50/70'
                                    : 'border-neutral-100 bg-neutral-50/60'
                                )}
                              >
                                <p
                                  className={cn(
                                    'text-[10px] font-semibold uppercase tracking-wide',
                                    col.highlight ? 'text-brand-primary' : 'text-neutral-400'
                                  )}
                                >
                                  {col.label}
                                </p>
                                <p
                                  className={cn(
                                    'mt-0.5 text-xs font-semibold leading-snug',
                                    col.highlight ? 'text-brand-primary' : 'text-neutral-600'
                                  )}
                                >
                                  {col.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop — comparison table */}
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full min-w-[700px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-neutral-200 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            <th className="p-4">Key Capabilities</th>
                            <th className="p-4">Traditional ERPs</th>
                            <th className="p-4">Spreadsheets</th>
                            <th className="p-4 text-brand-primary">TENVO Inventory Engine</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operatingModelRows.map(([feature, erp, sheet, tenvo]) => (
                            <tr
                              key={feature}
                              className="border-b border-neutral-100 text-xs font-semibold text-neutral-700 transition-colors duration-150 hover:bg-neutral-50/80"
                            >
                              <td className="p-4 font-bold text-neutral-900">{feature}</td>
                              <td className="p-4 text-neutral-400">{erp}</td>
                              <td className="p-4 text-neutral-400">{sheet}</td>
                              <td className="p-4 font-bold text-brand-primary">{tenvo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </ScrollReveal>

        </div>
      </section>

      <ScrollReveal direction="up" threshold={0.2}>
        <HomeOnboardingPathSection />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <TestimonialCarousel variant="featured" />
      </ScrollReveal>

      <ScrollReveal direction="up" threshold={0.2}>
        <HomeSecurityTrustSection />
      </ScrollReveal>

      <ScrollReveal direction="fade" threshold={0.2}>
        <HomeIntegrationMarquee compact />
      </ScrollReveal>

      {/* 10. FAQ */}
      <section className="relative bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28 overflow-hidden">
        <GradientMesh variant="subtle" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

          <ScrollReveal direction="up" threshold={0.3}>
            <div className="text-center mb-16 space-y-4">
              <h2 className={MARKETING_EYEBROW}>Frequently Asked Questions</h2>
              <h3 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                Everything you need to know.
              </h3>
              <p className="text-sm text-neutral-500 font-semibold">
                Can&apos;t find the answer you&apos;re looking for? Reach out to our dedicated support squad.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              {
                q: 'Can I really import native Excel files directly?',
                a: "Yes! Unlike traditional ERP platforms that fail if your spreadsheet isn't formatted perfectly, TENVO supports direct upload of native .xlsx files. Our interface checks your columns in real-time, displays explicit warnings for duplicate SKU codes or invalid prices, and allows you to partially import valid lines while providing a fixed Excel output file for errors.",
              },
              {
                q: 'Is TENVO compliant with FBR tax laws?',
                a: 'TENVO features a localized tax ledger that calculates standard 18% GST (and configurable provincial rates) per invoice line. We provide audit-ready logs and export-oriented summaries for your filing workflow. Live FBR IRIS sync is on the roadmap.',
              },
              {
                q: 'How does the Urdu language toggle work?',
                a: 'We realize warehouse teams may prefer Urdu for floor tasks. TENVO includes a language toggle with growing Urdu strings for core hub actions — full product localization is expanding release by release.',
              },
              {
                q: 'Will we lose data during our migration?',
                a: 'Never. Every single enterprise client is assigned a dedicated human Migration Manager. We review your messy old spreadsheets, check for SKU overlaps, verify existing supplier ledgers, perform sandbox test uploads, and ensure 100% data round-trip validation before switching your physical warehouse operations live.',
              },
            ].map((faq, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 60} threshold={0.1}>
                <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm hover:border-neutral-300 transition-colors duration-200">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-6 text-left group hover:bg-neutral-50/60 transition-colors duration-200"
                    aria-expanded={expandedFaq === index}
                  >
                    <span className="font-semibold text-neutral-800 text-sm sm:text-base group-hover:text-brand-primary transition-colors duration-200">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 shrink-0 ml-4 text-neutral-400 transition-all duration-300',
                        'group-hover:text-brand-primary',
                        expandedFaq === index ? 'rotate-180 text-brand-primary' : ''
                      )}
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6 border-t border-neutral-100 animate-fade-in-up">
                      <p className="pt-4 text-sm text-neutral-600 leading-relaxed font-medium">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* AFFILIATE PROGRAM CTA */}
      <AffiliateProgramSection />

      {/* 11. FINAL CTA */}
      <section className="relative bg-white py-10 sm:py-14 lg:py-24 overflow-hidden">
        <GradientMesh variant="hero" />
        <div className={cn(MARKETING_CONTAINER, 'relative z-10')}>
          <ScrollReveal direction="up" threshold={0.3}>
            <div className="relative rounded-[3rem] p-8 sm:p-12 lg:p-16 text-center space-y-6 overflow-hidden border border-neutral-200/80 bg-white/80 backdrop-blur-sm shadow-sm">
              {/* Subtle inner gradient orbs */}
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-primary/8 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-brand-secondary/6 blur-3xl" aria-hidden />

              <p className="relative z-10 text-[11px] font-semibold text-brand-primary uppercase tracking-[0.32em]">Ready to take command?</p>
              <h3 className="relative z-10 text-3xl sm:text-5xl font-semibold text-neutral-900 tracking-tight max-w-4xl mx-auto">
                Unify your warehouse, sales, and accounts today.
              </h3>
              <p className="relative z-10 max-w-2xl mx-auto text-sm sm:text-base text-neutral-600 font-medium leading-relaxed">
                Join operational teams moving from spreadsheets to one connected workspace — inventory, storefront, POS, and finance with Pakistan-first tax configuration.
              </p>

              <div className="relative z-10 pt-4 flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  asChild size="lg"
                  className="h-14 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white px-8 text-base font-semibold uppercase tracking-[0.15em] shadow-md hover:shadow-xl hover:scale-[1.03] active:scale-100 transition-all duration-300"
                >
                  <Link href={workspaceHref} onClick={() => trackHeroCta('footer_workspace', workspaceHref)}>
                    {workspaceCtaDesktop}
                  </Link>
                </Button>
                <Button
                  asChild size="lg" variant="outline"
                  className="h-14 rounded-xl border-neutral-300 bg-white hover:border-brand-primary hover:text-brand-primary hover:scale-[1.02] active:scale-100 px-8 text-base font-semibold uppercase tracking-[0.15em] transition-all duration-300"
                >
                  <Link href="/pricing">View Pricing Plans</Link>
                </Button>
              </div>

              <p className="relative z-10 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                No credit card required &bull; 14-day free trial &bull; Custom migration included
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>


    </MarketingLayout>
  );
}
