'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { TRIAL_CONFIG } from '@/lib/config/platform';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';
import { cn } from '@/lib/utils';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';

/**
 * Closing CTA — light card with brand-red accents (not full dark theme).
 */
export default function HomeFinalCta({
  workspaceHref = '/register',
  workspaceCta = 'Start free',
}) {
  const track = (kind, href) => {
    trackEvent(EVENTS.HERO_CTA_CLICK, {
      cta_location: 'home_final_cta',
      cta_kind: kind,
      cta_destination: href,
    });
  };

  return (
    <section className="bg-neutral-50 py-12 sm:py-16 lg:py-24">
      <div className={MARKETING_CONTAINER}>
        <div
          className={cn(
            'relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_20px_50px_-36px_rgba(15,23,42,0.25)] sm:rounded-[2.5rem] sm:px-10 sm:py-16 lg:px-16'
          )}
        >
          <div
            className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 mx-auto max-w-3xl space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary">
              Ready to grow
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              Ready to run your business smarter?
            </h2>
            <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-neutral-600 sm:text-base">
              Join operators replacing spreadsheets and disconnected apps with one intelligent
              platform for storefront, POS, inventory, finance, and AI.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 w-full rounded-xl bg-brand-primary px-8 text-base font-semibold text-white hover:bg-brand-primary-dark sm:w-auto"
              >
                <Link
                  href={workspaceHref}
                  className="inline-flex items-center justify-center gap-2"
                  onClick={() => track('workspace', workspaceHref)}
                >
                  {workspaceCta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 w-full rounded-xl border-neutral-300 bg-white px-8 text-base font-semibold text-neutral-900 hover:border-brand-primary hover:text-brand-primary sm:w-auto"
              >
                <MarketingCtaLink
                  href={getBookMeetingHref()}
                  onClick={() => track('book_meeting', getBookMeetingHref())}
                >
                  Book a demo
                </MarketingCtaLink>
              </Button>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              No credit card · {TRIAL_CONFIG.durationDays}-day trial · Guided onboarding
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
