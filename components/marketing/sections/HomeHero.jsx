'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import MarketingMeshBackground from '@/components/marketing/effects/MarketingMeshBackground';
import HomeHeroDevicesVisual from '@/components/marketing/sections/HomeHeroDevicesVisual';
import { cn } from '@/lib/utils';
import {
  MARKETING_CONTAINER,
  MARKETING_LEAD,
} from '@/lib/utils/marketingLayout';

const VALUE_CHECKS = [
  'Save Time & Reduce Costs',
  'Make Smarter Decisions with AI',
  'Scale Effortlessly Across Locations',
];

/**
 * Homepage hero — copy + desktop/mobile dashboard composite.
 */
export default function HomeHero({
  workspaceHref = '/register',
  workspaceCtaMobile = 'Start Free Trial',
  workspaceCtaDesktop = 'Start Free Trial',
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trackHeroCta = (kind, href) => {
    trackEvent(EVENTS.HERO_CTA_CLICK, {
      cta_location: 'home_hero',
      cta_kind: kind,
      cta_destination: href,
    });
  };

  return (
    <MarketingMeshBackground
      as="section"
      variant="hero"
      className={cn(
        'relative flex flex-col justify-center overflow-x-clip border-b border-neutral-200/70',
        'min-h-[calc(100svh-0.5rem)] lg:min-h-[min(100svh,56rem)]',
        'pb-16 pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pb-20',
        'lg:pb-24 lg:pt-[calc(5.5rem+env(safe-area-inset-top,0px))]'
      )}
    >
      <div className={cn('relative z-10 mx-auto w-full min-w-0', MARKETING_CONTAINER)}>
        <div className="grid min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <div
            className={cn(
              'col-span-1 min-w-0 max-w-full space-y-6 lg:col-span-5 lg:max-w-xl lg:space-y-8 xl:col-span-5 xl:max-w-2xl',
              mounted ? 'animate-fade-in-up' : 'opacity-0'
            )}
          >
            <div className="space-y-4 sm:space-y-5">
              <h1 className="text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.15rem] lg:leading-[1.06] xl:text-[3.4rem]">
                The All-in-One{' '}
                <span className="text-brand-primary">Business OS</span> for 2026 and Beyond.
              </h1>
              <p className={cn(MARKETING_LEAD, 'max-w-lg text-neutral-600')}>
                TENVO is an intelligent platform that unifies Inventory, POS, CRM, Accounting,
                Ecommerce, and Analytics so your whole business runs from one workspace.
              </p>
            </div>

            <ul className="space-y-3.5">
              {VALUE_CHECKS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium text-neutral-800 sm:text-[0.9375rem]"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex w-full min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 min-h-[48px] w-full rounded-xl bg-brand-primary px-7 text-[0.9375rem] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(210,43,43,0.45)] hover:bg-brand-primary-dark sm:w-auto sm:min-w-[10.5rem]"
              >
                <Link
                  href={workspaceHref}
                  className="inline-flex w-full items-center justify-center"
                  onClick={() => trackHeroCta('workspace', workspaceHref)}
                >
                  <span className="md:hidden">{workspaceCtaMobile}</span>
                  <span className="hidden md:inline">{workspaceCtaDesktop}</span>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 min-h-[48px] w-full rounded-xl border-neutral-900 bg-white px-6 text-[0.9375rem] font-semibold text-neutral-900 hover:bg-neutral-50 sm:w-auto sm:min-w-[10.5rem]"
              >
                <MarketingCtaLink
                  href={getBookMeetingHref()}
                  className="inline-flex w-full items-center justify-center gap-2"
                  onClick={() => trackHeroCta('book_meeting', getBookMeetingHref())}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-900">
                    <Play className="h-2.5 w-2.5 fill-neutral-900 text-neutral-900" aria-hidden />
                  </span>
                  Book a Demo
                </MarketingCtaLink>
              </Button>
            </div>

            <p className="text-sm font-medium text-neutral-500">No credit card required</p>
          </div>

          <div
            className={cn(
              'relative col-span-1 min-w-0 w-full lg:col-span-7',
              mounted ? 'animate-fade-in' : 'opacity-0'
            )}
          >
            <HomeHeroDevicesVisual />
          </div>
        </div>
      </div>
    </MarketingMeshBackground>
  );
}
