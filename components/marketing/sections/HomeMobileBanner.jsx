'use client';

import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import { MarketingPhonePair } from '@/components/marketing/ui/MarketingPhoneMockup';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

/**
 * Brand-red mobile banner with dual phone mockups that fit full UI screenshots.
 */
export default function HomeMobileBanner({ workspaceHref = '/register' }) {
  return (
    <section className="border-b border-neutral-200/80 bg-white py-10 sm:py-14 lg:py-20">
      <div className={MARKETING_CONTAINER}>
        <div
          className={cn(
            'relative overflow-hidden rounded-[1.75rem] text-white',
            'bg-gradient-to-br from-[#E84545] via-[#D22B2B] to-[#A82020]',
            'px-5 py-10 shadow-[0_28px_70px_-28px_rgba(210,43,43,0.5)]',
            'sm:rounded-[2rem] sm:px-8 sm:py-12 lg:rounded-[2.25rem] lg:px-10 lg:py-14 xl:px-12'
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 60% 50% at 15% 20%, rgba(255,255,255,0.28), transparent), radial-gradient(ellipse 50% 45% at 88% 75%, rgba(0,0,0,0.18), transparent)',
            }}
            aria-hidden
          />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
            <div className="flex flex-col justify-center space-y-5 text-white lg:col-span-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                <Smartphone className="h-3.5 w-3.5 text-white" aria-hidden />
                Access anywhere
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.55rem] lg:leading-[1.12]">
                Your Business. Anywhere, Anytime.
              </h2>

              <p className="max-w-md text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                Run sales, stock, money, and customer inquiries from your phone. The same TENVO hub
                that powers your desktop, tuned for mobile.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="h-12 rounded-xl border-0 bg-white px-6 font-semibold text-[#D22B2B] shadow-sm hover:bg-neutral-50 hover:text-[#A82020]"
                >
                  <Link
                    href={workspaceHref}
                    className="inline-flex items-center justify-center gap-2 text-[#D22B2B]"
                  >
                    Start free
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-xl border-2 border-white/55 bg-transparent px-6 font-semibold text-white shadow-none hover:border-white hover:bg-white/10 hover:text-white"
                >
                  <MarketingCtaLink
                    href={getBookMeetingHref()}
                    className="text-white hover:text-white"
                  >
                    Book a demo
                  </MarketingCtaLink>
                </Button>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-[11px]">
                Works in mobile browsers today · Native apps on roadmap
              </p>
            </div>

            <div className="relative lg:col-span-7">
              {/* Soft ground glow under phones */}
              <div
                className="pointer-events-none absolute inset-x-[12%] bottom-0 h-16 rounded-[100%] bg-black/25 blur-2xl"
                aria-hidden
              />

              {/* Desktop pair: hub home + POS */}
              <div className="relative hidden py-4 lg:block">
                <MarketingPhonePair
                  left={{
                    src: TENVO_IMG.mobileHome,
                    alt: 'TENVO mobile hub with quick entry and metrics',
                    fit: 'cover',
                  }}
                  right={{
                    src: TENVO_IMG.mobilePos,
                    alt: 'TENVO mobile POS product grid',
                    fit: 'cover',
                    priority: true,
                  }}
                />
              </div>

              {/* Mobile / tablet: hub + stock */}
              <div className="relative px-2 py-3 lg:hidden">
                <MarketingPhonePair
                  compact
                  left={{
                    src: TENVO_IMG.mobileHome,
                    alt: 'TENVO mobile hub',
                    fit: 'cover',
                    priority: true,
                  }}
                  right={{
                    src: TENVO_IMG.mobileStock,
                    alt: 'TENVO mobile inventory',
                    fit: 'cover',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
